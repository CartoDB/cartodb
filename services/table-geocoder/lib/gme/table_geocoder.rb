# encoding: utf-8

require_relative '../abstract_table_geocoder'
require_relative 'client'
require_relative 'geocoder_client'

module Carto
  module Gme
    class TableGeocoder < CartoDB::AbstractTableGeocoder

      MAX_BLOCK_SIZE = 1000

      # See https://developers.google.com/maps/documentation/geocoding/#Types
      ACCEPTED_ADDRESS_TYPES = ['street_address', 'route', 'intersection', 'neighborhood']

      attr_reader :connection, :formatter, :processed_rows, :state

      def initialize(arguments)
        super(arguments)
        @formatter = arguments.fetch(:formatter)
        client_id = arguments.fetch(:client_id)
        private_key = arguments.fetch(:private_key)
        gme_client = Client.new(client_id, private_key)
        @geocoder_client = GeocoderClient.new(gme_client)
      end

      def cancel
        #TODO: implement
      end

      def run
        @state = 'processing'
        add_georef_status_column

        # Here's the actual stuff
        data_input_blocks.each do |data_block|
          geocode(data_block)
          update_table(data_block)
        end

        @state = 'completed'
      rescue => e
        # TODO better error management
        @state = 'failed'
        raise e
      ensure
        FileUtils.remove_entry_secure @working_dir
      end

      # Empty methods, needed because they're triggered from geocoding.rb
      def remote_id; end
      def process_results; end

      def update_geocoding_status
        #TODO: implement
        { processed_rows: processed_rows, state: state }
      end


      private

      # Returns a "generator"
      # TODO: take into account state/province/country from formatter
      def data_input_blocks
        Enumerator.new do |enum|
          loop do
            data_input = connection.select("cartodb_id, #{formatter} searchtext".lit)
              .from(@sequel_qualified_table_name)
              .where("cartodb_georef_status IS NULL".lit)
              .limit(MAX_BLOCK_SIZE)
              .all
            enum.yield data_input
            break if data_input.length < MAX_BLOCK_SIZE # last iteration, no need for another query
          end
        end
      end

      def geocode(data_block)
        data_block.each do |row|
          response = @geocoder_client.geocode(row[:searchtext])
          if response['status'] != 'OK'
            row.merge!(cartodb_georef_status: false)
          else
            result = response['results'].select { |r| r['types'] & ACCEPTED_ADDRESS_TYPES }.first
            if result.nil?
              row.merge!(cartodb_georef_status: false)
            else
              location = result['geometry']['location']
              row.merge!(location.deep_symbolize_keys.merge(cartodb_georef_status: true))
            end
          end
        end
      end

      def update_table(data_block)
        # At this point, data_block is an Array that looks like this:
        #   [{:cartodb_id=>1, :searchtext=>"Some real street name", :lat=>19.29544, :lng=>-99.1472101, :cartodb_georef_status=>true},
        #    {:cartodb_id=>2, :searchtext=>"foo", :cartodb_georef_status=>false}]
        geocoded = data_block.select {|row| row[:cartodb_georef_status] == true}
        if geocoded.count > 0
          geocoded_to_sql = geocoded.map {|row| "(#{row[:cartodb_id]}, #{row[:lng]}, #{row[:lat]})"}.join(',')
          query_geocoded = %Q{
            UPDATE #{@qualified_table_name} as target SET
              the_geom = ST_SetSRID(ST_MakePoint(geocoded.lng,geocoded.lat),4326),
              cartodb_georef_status = TRUE
            FROM (VALUES
              #{geocoded_to_sql}
            ) as geocoded(cartodb_id,lng,lat)
            WHERE target.cartodb_id = geocoded.cartodb_id;
          }
          connection.run(query_geocoded)
        end

        non_geocoded = data_block.select {|row| row[:cartodb_georef_status] == false}
        if non_geocoded.count > 0
          non_geocoded_to_sql = non_geocoded.map {|row| "(#{row[:cartodb_id]})"}.join(',')
          query_non_geocoded = %Q{
            UPDATE #{@qualified_table_name} as target SET
              cartodb_georef_status = FALSE
            FROM (VALUES
              #{non_geocoded_to_sql}
            ) as nongeocoded(cartodb_id)
            WHERE target.cartodb_id = nongeocoded.cartodb_id;
          }
          connection.run(query_non_geocoded)
        end
      end

    end
  end
end

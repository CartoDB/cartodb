# encoding: utf-8

require_relative '../abstract_table_geocoder'
require_relative 'client'
require_relative 'geocoder_client'

module Carto
  module Gme
    class TableGeocoder < CartoDB::AbstractTableGeocoder

      DEFAULT_MAX_BLOCK_SIZE = 1000

      # See https://developers.google.com/maps/documentation/geocoding/#Types
      ACCEPTED_ADDRESS_TYPES = ['street_address', 'route', 'intersection', 'neighborhood']

      attr_reader :original_formatter, :processed_rows, :state, :max_block_size

      def initialize(arguments)
        super(arguments)
        @original_formatter = arguments.fetch(:original_formatter)
        client_id = arguments.fetch(:client_id)
        private_key = arguments.fetch(:private_key)
        @max_block_size = arguments[:max_block_size] || DEFAULT_MAX_BLOCK_SIZE
        gme_client = Client.new(client_id, private_key)
        @geocoder_client = GeocoderClient.new(gme_client)
      end

      def cancel
        #TODO: implement
      end

      def run
        @state = 'processing'
        @processed_rows = 0
        ensure_georef_status_colummn_valid

        # Here's the actual stuff
        data_input_blocks.each do |data_block|
          geocode(data_block)
          update_table(data_block)
          @processed_rows += data_block.size
        end

        @state = 'completed'
      rescue => e
        @state = 'failed'
        raise e
      end

      # Empty methods, needed because they're triggered from geocoding.rb
      def remote_id; end
      def process_results; end # TODO: can be removed from here and abstract class

      def update_geocoding_status
        { processed_rows: processed_rows, state: state }
      end


      private

      # Returns a "generator"
      def data_input_blocks
        Enumerator.new do |enum|
          begin
            data_input = connection.select(:cartodb_id, searchtext_expression)
              .from(@sequel_qualified_table_name)
              .where(cartodb_georef_status: nil)
              .limit(max_block_size)
              .all
            enum.yield data_input
            # last iteration when data_input.length < max_block_size, no need for another query
          end while data_input.length == max_block_size
        end
      end

      def searchtext_expression
        # The original_formatter has the following format:
        #   `{street_column_name}[[, additional_free_text][, {province_column_name}][, country_free_text]]`
        # See https://github.com/jeremyevans/sequel/blob/master/doc/security.rdoc
        # See http://sequel.jeremyevans.net/rdoc/classes/Sequel/SQL/Builders.html
        atoms = original_formatter.split(',').map {|s| s.strip }
        Sequel.join(atoms.map { |atom|
                      if match = /\A{(?<column_name>.*)}\z/.match(atom)
                        Sequel.identifier(match[:column_name])
                      else
                        atom
                      end
                    }, ',').as(:searchtext)
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
          geocoded_to_sql = geocoded.map {|row| "(#{row[:cartodb_id]}, #{row[:lat]}, #{row[:lng]})"}.join(',')
          query_geocoded = %Q{
            UPDATE #{@qualified_table_name} as target SET
              the_geom = CDB_LatLng(geocoded.lat,geocoded.lng),
              cartodb_georef_status = TRUE
            FROM (VALUES
              #{geocoded_to_sql}
            ) as geocoded(cartodb_id,lat,lng)
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

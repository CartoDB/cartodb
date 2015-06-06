# encoding: utf-8

require_relative '../abstract_table_geocoder'
require_relative 'client'
require_relative 'geocoder_client'

module Carto
  module Gme
    class TableGeocoder < CartoDB::AbstractTableGeocoder

      attr_reader :connection, :formatter, :processed_rows, :state

      def self.enabled?
        config = Cartodb.config[:gce_geocoder]
        config.present? && config['client_id'].present? && config['private_key'].present?
      end

      def initialize(arguments)
        raise 'Not configured' unless self.class.enabled?
        super(arguments)
        @formatter = arguments[:formatter]
        client_id = Cartodb.config[:gce_geocoder]['client_id']
        private_key = Cartodb.config[:gce_geocoder]['private_key']
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
      # TODO: actually take blocks of a given size
      # TODO: take into account state/province/country from formatter
      def data_input_blocks
        Enumerator.new do |enum|
          data_input = connection.select("cartodb_id, #{formatter} searchtext".lit)
            .from(@sequel_qualified_table_name)
            .where("cartodb_georef_status IS NULL".lit).all
          enum.yield data_input
        end
      end

      def geocode(data_block)
        data_block.each do |row|
          response = JSON::parse(@geocoder_client.geocode(row[:searchtext]))
          if response['status'] != 'OK'
            row.merge!(cartodb_georef_status: false)
          else
            result = response['results'].select { |res| res['types'].include?('street_address') }.first
            if result.nil?
              row.merge!(cartodb_georef_status: false)
            else
              location = result['geometry']['location']
              row.merge!(location.deep_symbolize_keys.merge(cartodb_georef_status: true))
            end
          end
          sleep 0.01 # TODO: remove when throttling is implemented
        end
      end

      def update_table(data_block)
        # TODO: implement
      end

    end
  end
end

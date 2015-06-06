# encoding: utf-8

require_relative '../abstract_table_geocoder'

module Carto
  module Gme
    class TableGeocoder < CartoDB::AbstractTableGeocoder

      attr_reader :connection, :formatter, :processed_rows, :state

      def self.enabled?
        #TODO check the config instead
        true
      end

      def initialize(arguments)
        super(arguments)
        @formatter = arguments[:formatter]
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
      def data_input_blocks
        Enumerator.new do |enum|
          data_input = connection.select("cartodb_id, #{formatter} searchText".lit)
            .from(@sequel_qualified_table_name)
            .where("cartodb_georef_status IS NULL".lit).all
          enum.yield data_input
        end
      end

      def geocode(data_input)
        # TODO: implement
      end

      def update_table(data_output)
        # TODO: implement
      end

    end
  end
end

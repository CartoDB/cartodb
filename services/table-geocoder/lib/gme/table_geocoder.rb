# encoding: utf-8

module Carto
  module Gme
    class TableGeocoder
      def self.enabled?
        #TODO check the config instead
        true
      end

      def initialize(config)
        @config = config
      end

      def cancel
        raise 'TODO: implement'
      end

      def run
        raise 'TODO: implement'
      end

      def remote_id
        raise "TODO: this shouldn't be part of a common interface"
      end

      def update_geocoding_status
        raise 'TODO: implement'
      end

      def process_results
        raise 'TODO: implement'
      end

      def used_batch_request?
        false
      end

    end
  end
end

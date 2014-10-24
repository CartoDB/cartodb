# encoding: utf-8

module CartoDB
  module Doubles
    class ImporterStats
      TEST_HOST = '172.28.128.3'
      TEST_PORT = 8125

      private_class_method :new

      def self.instance
        Statsd.host = TEST_HOST
        Statsd.port = TEST_PORT
        importer_stats_double = new
        importer_stats_double.timed_blocks = Hash.new(0)
        importer_stats_double
      end

      attr_writer :timed_blocks

      def timing(key)
        if(block_given?)
          @timed_blocks[key] = @timed_blocks[key] + 1
          yield
        end
      end

      def timed_block(key)
        @timed_blocks[key]
      end

    end
  end
end
# encoding: utf-8

module CartoDB
  module Doubles
    class CartodbStats
      TEST_HOST = '172.28.128.3'
      TEST_PORT = 8125

      Statsd.host = TEST_HOST
      Statsd.port = TEST_PORT

      def initialize
        @timed_blocks = Hash.new(0)
      end

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
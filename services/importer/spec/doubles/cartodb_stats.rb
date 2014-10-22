# encoding: utf-8

module CartoDB
  module Doubles
    class CartodbStats

      def initialize
        @timed_blocks = {}
      end

      def timing(key)
        if(block_given?)
          @timed_blocks[key] = true
          yield
        end
      end

      def timed_block(key)
        @timed_blocks[key]
      end

    end
  end
end
# encoding: utf-8

module CartoDB
  module Doubles
    class CartodbStats

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
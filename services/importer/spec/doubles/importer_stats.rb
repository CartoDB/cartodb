# encoding: utf-8

module CartoDB
  module Doubles
    class ImporterStats < CartoDB::Importer2::ImporterStats

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
        @timing_stack.push(key)

        begin

          if(block_given?)
            @timed_blocks[timing_chain] = @timed_blocks[timing_chain] + 1
            yield
          end

        ensure
          @timing_stack.pop
        end

      end

      def timed_block(key)
        @timed_blocks[key]
      end

      def timed_block_prefix(prefix)
        @timed_blocks.each_key.find_all { | item | !Regexp.new("^#{prefix}").match(item).nil? }.size
      end

      def spy_runner(runner)
        importer_self = self
        runner.instance_eval {
          @importer_stats = importer_self
        }
      end

    end
  end
end
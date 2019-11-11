require_relative '../../../../lib/cartodb/stats/importer'

module CartoDB
  module Doubles
    module Stats
      class Importer < CartoDB::Stats::Importer

        TEST_HOST = '172.28.128.3'
        TEST_PORT = 8125

        def self.instance(config={}, host_info=Socket.gethostname)
          Statsd.host = TEST_HOST
          Statsd.port = TEST_PORT
          importer_stats_double = new({}, 'importer-stats-double')
          importer_stats_double.timed_blocks = Hash.new(0)
          importer_stats_double
        end

        attr_writer :timed_blocks

        def timing(key)
          @timing_stack.push(key)

          begin
            return_value = nil

            if(block_given?)
              @timed_blocks[timing_chain] = @timed_blocks[timing_chain] + 1
              return_value = yield
            end

          ensure
            @timing_stack.pop
          end

          return_value
        end

        def timed_block(key)
          @timed_blocks[key]
        end

        def timed_block_prefix_count(prefix)
          matching_timed_blocks_count("^#{prefix}")
        end

        def timed_block_suffix_count(suffix)
          matching_timed_blocks_count("#{suffix}$")
        end

        def matching_timed_blocks_count(regexp)
          @timed_blocks.each_key.find_all { | key | !Regexp.new(regexp).match(key).nil? }.map { |key| @timed_blocks[key] }.reduce(0, :+)
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
end
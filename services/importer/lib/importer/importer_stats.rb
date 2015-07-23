require 'statsd'

module CartoDB
  module Importer2

    class ImporterStats
      PREFIX = 'importer'

      private_class_method :new
      attr_reader :fully_qualified_prefix

      def self.instance(host = nil, port = nil, host_info = nil)
        if host && port
          Statsd.host = host
          Statsd.port = port

          return new(host_info)
        else
          NullImporterStats.new
        end
      end

      def initialize(host_info)
        @fully_qualified_prefix = "#{PREFIX}.#{host_info}"
        @timing_stack = [fully_qualified_prefix]
      end

      def timing(key)
        return_value = nil
        @timing_stack.push(key)
        Statsd.timing(timing_chain) do
          begin
            return_value = yield
          rescue => e
            @timing_stack.pop
            raise e
          end
        end
        @timing_stack.pop
        return_value
      end

      def timing_chain
        @timing_stack.join('.')
      end

      def gauge(key, value)
        Statsd.gauge("#{fully_qualified_prefix}.#{key}", value)
      end

      def increment(key)
        Statsd.increment("#{fully_qualified_prefix}.#{key}")
      end

    end

    class NullImporterStats

      def timing(key)
        yield
      end

      def gauge(key, value); end

      def increment(key); end

    end

  end
end

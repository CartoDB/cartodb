require 'statsd'

module CartoDB
  module Importer2

    class ImporterStats
      PREFIX = 'importer'

      private_class_method :new

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
        @timing_stack = ["#{PREFIX}.#{host_info}"]
      end

      def timing(key)
        return_value = nil
        @timing_stack.push(key)
        Statsd.timing(timing_chain) do
          return_value = yield
        end
        @timing_stack.pop
        return_value
      end

      def timing_chain
        @timing_stack.join('.')
      end

    end

    class NullImporterStats

      def timing(key)
        yield
      end

    end

  end
end

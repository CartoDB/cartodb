require 'statsd'

module CartoDB
  module Importer2

    class ImporterStats
      PREFIX = 'importer'

      private_class_method :new

      def self.instance(host = nil, port = nil)
        if host && port
          Statsd.host = host
          Statsd.port = port

          return new
        else
          NullImporterStats.new
        end
      end

      def initialize
        @timing_stack = [PREFIX]
      end

      def timing(key)
        @timing_stack.push(key)
        Statsd.timing(timing_chain) do
          yield
        end
        @timing_stack.pop
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

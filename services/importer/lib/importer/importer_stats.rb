require 'statsd'

module CartoDB
  module Importer2

    class ImporterStats
      PREFIX = 'importer'

      private_class_method :new

      def self.instance(host, port)
        if host && port
          Statsd.host = host
          Statsd.port = port

          return new
        else
          NullImporterStats.new
        end
      end

      def timing(key)
        Statsd.timing("#{PREFIX}.#{key}") do
          yield
        end
      end

    end

    class NullImporterStats

      def timing(key)
        yield
      end

    end

  end
end

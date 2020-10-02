require_relative 'aggregator'

module CartoDB
  module Stats
    class Importer < Aggregator

      PREFIX = 'importer'.freeze

      def self.instance(config={}, host_info=Socket.gethostname)
        super(PREFIX, config, host_info)
      end

    end
  end
end

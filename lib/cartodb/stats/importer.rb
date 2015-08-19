require_dependency 'lib/cartodb/stats/aggregator'

module CartoDB
  module Stats

    class Importer < Aggregator

      PREFIX = 'importer'

      def self.instance(config={}, host_info=Socket.gethostname)
        super(PREFIX, config, host_info)
      end

    end

  end
end
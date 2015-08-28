require_relative 'aggregator'

module CartoDB
  module Stats

    class ExploreAPI < Aggregator

      PREFIX = 'explore_api'

      def self.instance(config={}, host_info=Socket.gethostname)
        super(PREFIX, config, host_info)
      end

    end

  end
end

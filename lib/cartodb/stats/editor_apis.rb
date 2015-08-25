require_relative 'aggregator'

module CartoDB
  module Stats

    class EditorAPIs < Aggregator

      PREFIX = 'editor'

      def self.instance(config={}, host_info=Socket.gethostname)
        super(PREFIX, config, host_info)
      end

    end

  end
end
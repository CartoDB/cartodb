# encoding: utf-8

module Carto
  module Api
    class ConnectorPresenter

      def initialize(connector_config)
        @connector_config = connector_config
      end

      def to_poro
        return {} unless @connector_config

        {
          name: @connector_config.connector_provider.name,
          enabled: @connector_config.enabled
        }
      end

    end
  end
end

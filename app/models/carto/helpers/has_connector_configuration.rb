module Carto
  module HasConnectorConfiguration
    def connector_configuration(provider_name)
      provider = ConnectorProvider.find_by_name(provider_name)
      ConnectorConfiguration.for_user(self, provider)
    end
  end
end

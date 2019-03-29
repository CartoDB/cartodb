module Carto
  # Note: Connector provider IDs are not kept between clouds, so we look them up by name
  module ConnectorConfigurationImporter
    private

    def build_connector_configurations_from_hash(exported_ccs)
      return [] unless exported_ccs

      exported_ccs.map { |cc| build_connector_configuration_from_hash(cc) }.compact
    end

    def build_connector_configuration_from_hash(exported_cc)
      provider_name = exported_cc[:provider_name]
      provider = Carto::ConnectorProvider.find_by_name(provider_name)

      unless provider
        CartoDB::Logger.error(message: 'Missing connector provider during migration', provider_name: provider_name)
        raise 'Missing connector provider'
      end

      Carto::ConnectorConfiguration.new(
        created_at: exported_cc[:created_at],
        updated_at: exported_cc[:updated_at],
        enabled: exported_cc[:enabled],
        max_rows: exported_cc[:max_rows],
        connector_provider: provider
      )
    end
  end

  module ConnectorConfigurationExporter
    private

    def export_connector_configuration(connector_configuration)
      {
        created_at: connector_configuration.created_at,
        updated_at: connector_configuration.updated_at,
        enabled: connector_configuration.enabled,
        max_rows: connector_configuration.max_rows,
        provider_name: connector_configuration.connector_provider.name
      }
    end
  end
end

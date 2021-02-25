def mocked_record(data)
  Struct.new(*data.keys).new(*data.values)
end

def replace_connector_providers(*args)
  options = args.extract_options!
  original_providers = Carto::Connector::PROVIDERS.dup
  Carto::Connector::PROVIDERS.clear unless options[:incremental]
  Carto::Connector::PROVIDERS.push(*args)
  Carto::Connector.providers.keys.each do |provider_name|
    create(:connector_provider, name: provider_name) unless Carto::ConnectorProvider.where(name: provider_name).exists?
  end
  original_providers
end

def restore_connector_providers(providers)
  Carto::Connector::PROVIDERS.replace(providers)
end

def with_connector_providers(*args)
  original_providers = replace_connector_providers(*args)
  yield
ensure
  restore_connector_providers(original_providers)
end

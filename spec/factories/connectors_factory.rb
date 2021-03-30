FactoryBot.define do
  factory :connector_provider, class: Carto::ConnectorProvider do
    name { 'test_provider' }
  end
end

FactoryBot.define do
  factory :connector_configuration, class: Carto::ConnectorConfiguration do
    enabled { true }
    max_rows { 100 }
  end
end

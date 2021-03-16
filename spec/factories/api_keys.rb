FactoryBot.define do
  factory :api_key_apis, class: 'Carto::ApiKey' do
    initialize_with { Carto::ApiKey.send :new }

    type { Carto::ApiKey::TYPE_REGULAR }
    name { unique_name('regular api key for apis') }
    grants do
      [
        { type: 'apis', apis: ['sql', 'maps'] }
      ]
    end
  end

  factory :master_api_key, class: 'Carto::ApiKey' do
    initialize_with { Carto::ApiKey.send :new }

    type { Carto::ApiKey::TYPE_MASTER }
    name { Carto::ApiKey::NAME_MASTER }
    grants do
      [
        { type: 'apis', apis: ['sql', 'maps'] },
        { type: 'dataservices', services: ['geocoding', 'routing', 'isolines', 'observatory'] }
      ]
    end
  end

  factory :oauth_api_key, class: 'Carto::ApiKey' do
    initialize_with { Carto::ApiKey.send :new }

    type { Carto::ApiKey::TYPE_OAUTH }
    name { unique_name('internal api key') }
    grants do
      [{ type: 'apis', apis: [] }]
    end
  end

  factory :oauth_api_key_user_profile_grant, class: 'Carto::ApiKey' do
    initialize_with { Carto::ApiKey.send :new }

    type { Carto::ApiKey::TYPE_OAUTH }
    name { unique_name('internal api key') }
    grants do
      [
        { type: 'apis', apis: [] },
        { type: 'user', data: ['profile'] }
      ]
    end
  end

  factory :oauth_api_key_datasets_metadata_grant, class: 'Carto::ApiKey' do
    initialize_with { Carto::ApiKey.send :new }

    type { Carto::ApiKey::TYPE_OAUTH }
    name { unique_name('internal api key') }
    grants do
      [
        { type: 'apis', apis: [] },
        { type: 'database', table_metadata: [] }
      ]
    end
  end
end

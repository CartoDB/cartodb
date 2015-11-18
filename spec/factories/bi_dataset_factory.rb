require_relative '../../app/models/carto/bi_dataset'

FactoryGirl.define do
  factory :bi_dataset, class: Carto::BiDataset do
    state 'pending'
    import_config '{ "a_key": "a_value" }'
    association :user, factory: :carto_user
    import_source 'the import source'
    import_credentials '{ "user": "the user", "password": "the password" }'
  end
end

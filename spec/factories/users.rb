# Read about factories at https://github.com/thoughtbot/factory_girl

FactoryGirl.define do

  factory :user do

    username               { String.random(5).downcase }
    email                  { String.random(5).downcase + '@' + String.random(5).downcase + '.com' }
    password               { email.split('@').first }
    table_quota            5
    quota_in_bytes         5000000
    id                     { UUIDTools::UUID.timestamp_create.to_s }

    trait :admin_privileges do

      username 'Admin'
      email 'admin@example.com'
      admin true

    end

    trait :private_tables do
      private_tables_enabled true
    end

    trait :sync_tables do
      sync_tables_enabled true
    end

    trait :enabled do
      enabled true
    end

    factory :user_with_private_tables, traits: [:enabled, :private_tables]
    factory :admin, traits: [:admin]

    factory :valid_user do
      username { String.random(5).downcase }
      email { String.random(5).downcase + '@' + String.random(5).downcase + '.com' }
      password 'kkkkkkkkk'
      password_confirmation 'kkkkkkkkk'
      salt 'kkkkkkkkk'
      crypted_password 'kkkkkkkkk'
    end

  end

  factory :carto_user, class: Carto::User do

    username { String.random(5).downcase }
    email { String.random(5).downcase + '@' + String.random(5).downcase + '.com' }

    password { email.split('@').first }
    password_confirmation { email.split('@').first }
    salt 'kkkkkkkkk'
    crypted_password 'kkkkkkkkk'

    api_key '21ee521b8a107ea55d61fd7b485dd93d54c0b9d2'
    table_quota 5
    quota_in_bytes 5000000
    id { UUIDTools::UUID.timestamp_create.to_s }

    before(:create) do
      CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
    end

    after(:create) do |carto_user|
      ::User.where(id: carto_user.id).first.after_create
      CartoDB::UserModule::DBService.any_instance.unstub
    end
  end

end

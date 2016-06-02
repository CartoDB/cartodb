# Read about factories at https://github.com/thoughtbot/factory_girl

require 'helpers/unique_names_helper'

include UniqueNamesHelper

FactoryGirl.define do

  factory :user, class: ::User do

    username               { unique_name('user') }
    email                  { unique_email }
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

    trait :mobile do
      mobile_max_open_users    100000
      mobile_max_private_users 20000
    end

    factory :user_with_private_tables, traits: [:enabled, :private_tables]
    factory :admin, traits: [:admin]

    factory :valid_user do
      username { unique_name('user') }
      email { unique_email }
      password 'kkkkkkkkk'
      password_confirmation 'kkkkkkkkk'
      salt 'kkkkkkkkk'
      crypted_password 'kkkkkkkkk'
    end

    before(:create) do
      CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
    end
  end

  factory :carto_user, class: Carto::User do

    username { unique_name('user') }
    email { unique_email }

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

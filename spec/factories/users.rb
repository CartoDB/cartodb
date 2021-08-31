require 'helpers/account_types_helper'
require 'helpers/unique_names_helper'
require 'carto/user_authenticator'
require 'cartodb-common'

include AccountTypesHelper
include UniqueNamesHelper

FactoryBot.define do
  factory :user, class: ::User do
    to_create { |user| user.save(raise_on_failure: true) }

    sequence(:username) { |i| "#{Faker::Internet.username(separators: [])}#{i}" }
    email                  { "#{username}@example.com" }
    password               { "#{username}123" }
    password_confirmation  { password }
    table_quota            { 5 }
    quota_in_bytes         { 5_000_000 }
    id                     { Carto::UUIDHelper.random_uuid }
    builder_enabled        { nil } # Most tests still assume editor

    trait :admin_privileges do
      username { 'Admin' }
      email { 'admin@example.com' }
      admin { true }
    end

    trait :private_tables do
      private_tables_enabled { true }
    end

    trait :sync_tables do
      sync_tables_enabled { true }
    end

    trait :enabled do
      enabled { true }
    end

    trait :mobile do
      mobile_max_open_users    { 100_000 }
      mobile_max_private_users { 20_000 }
    end

    trait :locked do
      state { 'locked' }
    end

    trait :unverified do
      email_verification_token   { 'aaa' }
      email_verification_sent_at { Time.current - 8.days }
    end

    trait :valid do
      password { 'kkkkkkkkk' }
      password_confirmation { 'kkkkkkkkk' }
      crypted_password do
        Carto::Common::EncryptionService.encrypt(password: password, secret: Cartodb.config[:password_secret])
      end
    end

    transient do
      factory_bot_context { {} }
    end

    factory :user_with_private_tables, traits: [:enabled, :private_tables]
    factory :admin, traits: [:admin]
    factory :valid_user, traits: [:valid]
    factory :unverified_user, traits: [:valid, :unverified]
    factory :locked_user, traits: [:valid, :locked]

    after(:build) do |user|
      create_account_type_fg(user.account_type)
    end

    before(:create) do |user|
      CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
      create_account_type_fg(user.account_type)
    end
  end

  factory :carto_user, class: Carto::User do
    to_create(&:save!)

    sequence(:username) { |i| "#{Faker::Internet.username(separators: [])}#{i}" }
    email { "#{username}@example.org" }
    password { email.split('@').first }
    password_confirmation { email.split('@').first }
    crypted_password do
      Carto::Common::EncryptionService.encrypt(password: password, secret: Cartodb.config[:password_secret])
    end

    api_key { '21ee521b8a107ea55d61fd7b485dd93d54c0b9d2' }
    table_quota { nil }
    quota_in_bytes { 5_000_000 }
    id { Carto::UUIDHelper.random_uuid }
    builder_enabled { nil } # Most tests still assume editor


    before(:build) do |carto_user|
      create_account_type_fg(carto_user.account_type)
    end

    before(:create) do |carto_user|
      CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
      create_account_type_fg(carto_user.account_type)
    end

    after(:create) do |carto_user|
      carto_user.sequel_user.after_create
      CartoDB::UserModule::DBService.any_instance.unstub
      carto_user.reload
    end

    trait :locked do
      state { 'locked' }
    end

    trait :mfa_setup do
      after :create do |carto_user|
        carto_user.user_multifactor_auths << create(:totp, :needs_setup, user_id: carto_user.id)
      end
    end

    trait :mfa_enabled do
      after :create do |carto_user|
        carto_user.user_multifactor_auths << create(:totp, :active, user_id: carto_user.id)
      end
    end

    factory :carto_locked_user, traits: [:locked]
    factory :carto_user_mfa_setup, traits: [:mfa_setup]
    factory :carto_user_mfa, traits: [:mfa_enabled]
  end

  # Light user: database creation etc is skipped
  factory :carto_user_light, class: Carto::User do
    to_create(&:save)

    sequence(:username) { |i| "#{Faker::Internet.username(separators: [])}#{i}" }
    email { "#{username}@example.org" }
    password { email.split('@').first }
    password_confirmation { email.split('@').first }
    crypted_password do
      Carto::Common::EncryptionService.encrypt(password: password, secret: Cartodb.config[:password_secret])
    end

    api_key { '21ee521b8a107ea55d61fd7b485dd93d54c0b9d2' }
    table_quota { nil }
    quota_in_bytes { 5_000_000 }
    id { Carto::UUIDHelper.random_uuid }
    builder_enabled { nil } # Most tests still assume editor

    after(:build) do |carto_user|
      create_account_type_fg(carto_user.account_type)
    end

    before(:create) do |carto_user|
      CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
      create_account_type_fg(carto_user.account_type)
    end

    after(:create) do |carto_user|
      CartoDB::UserModule::DBService.any_instance.unstub
    end
  end
end

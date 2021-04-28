require 'helpers/account_types_helper'
require 'helpers/unique_names_helper'

include UniqueNamesHelper

FactoryBot.define do
  factory :organization, class: 'Carto::Organization' do
    name { unique_name('organization') }
    seats { 10 }
    quota_in_bytes { 100.megabytes }
    geocoding_quota { 1000 }
    here_isolines_quota { 1000 }
    map_views_quota { 100_000 }
    website { 'carto.com' }
    description { 'Lorem ipsum dolor sit amet' }
    display_name { 'Vizzuality Inc' }
    discus_shortname { 'cartodb' }
    twitter_username { 'cartodb' }
    location { 'Madrid' }
    builder_enabled { false } # Most tests still assume editor
    geocoder_provider { 'heremaps' }
    isolines_provider { 'heremaps' }
    routing_provider { 'heremaps' }

    transient do
      owner { create(:user) }
    end

    trait :with_owner do
      after(:create) do |organization, evaluator|
        CartoDB::UserOrganization.new(organization.id, evaluator.owner.id).promote_user_to_admin
        create_account_type_fg('ORGANIZATION USER') # TODO: move to a global callback
        organization.reload
      end
    end

    trait :saml_enabled do
      auth_saml_configuration do
        {
          issuer: 'localhost.lan',
          idp_sso_service_url: 'https://example.com/saml/signon/',
          idp_slo_service_url: 'https://example.com/saml/signon/',
          idp_cert_fingerprint: '',
          assertion_consumer_service_url: 'https://localhost.lan/saml/finalize',
          name_identifier_format: '',
          email_attribute: 'username'
        }.stringify_keys
      end
    end

    factory :organization_whitelist_carto, class: 'Carto::Organization' do
      whitelisted_email_domains { ['carto.com'] }
      auth_username_password_enabled { true }
    end

    factory :organization_google_whitelist_empty, class: 'Carto::Organization' do
      whitelisted_email_domains { [] }
      auth_google_enabled { true }
    end

    factory :organization_with_users, class: 'Carto::Organization' do
      after(:create) do |org|
        create_account_type_fg('ORGANIZATION USER')
        owner = create(:user)
        uo = CartoDB::UserOrganization.new(org.id, owner.id)
        uo.promote_user_to_admin
        org.reload
        user = build(:user)
        user.organization_id = org.id
        user.enabled = true
        user.save
        org.reload
      end

      trait :mfa_enabled do
        auth_username_password_enabled { true }

        after :create do |org|
          Carto::Organization.find(org.id).users.each do |user|
            user.user_multifactor_auths << create(:totp, :active, user_id: user.id)
            user.save!
          end
        end
      end
    end

    factory :saml_organization, class: 'Carto::Organization' do
      auth_saml_configuration do
        {
          issuer: 'localhost.lan',
          idp_slo_service_url: 'https://example.com/saml/signon/',
          idp_slo_service_url: 'https://example.com/saml/signon/',
          idp_cert_fingerprint: '',
          assertion_consumer_service_url: 'https://localhost.lan/saml/finalize',
          name_identifier_format: '',
          email_attribute: 'username'
        }.stringify_keys
      end
    end

    factory :carto_organization, class: 'Carto::Organization' do
      name { unique_name('organization') }
      seats { 10 }
      quota_in_bytes { 100.megabytes }
      geocoding_quota { 1000 }
      here_isolines_quota { 1000 }
      map_views_quota { 100_000 }
      website { 'carto.com' }
      description { 'Lorem ipsum dolor sit amet' }
      display_name { 'Vizzuality Inc' }
      discus_shortname { 'cartodb' }
      twitter_username { 'cartodb' }
      location { 'Madrid' }
      builder_enabled { false } # Most tests still assume editor
    end
  end
end

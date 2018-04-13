require 'helpers/account_types_helper'
require 'helpers/unique_names_helper'

include UniqueNamesHelper

FactoryGirl.define do

  factory :organization do
    to_create(&:save)

    name { unique_name('organization') }
    seats 10
    quota_in_bytes 100.megabytes
    geocoding_quota 1000
    here_isolines_quota 1000
    obs_snapshot_quota 1000
    obs_general_quota 1000
    map_view_quota 100000
    website 'carto.com'
    description 'Lorem ipsum dolor sit amet'
    display_name 'Vizzuality Inc'
    discus_shortname 'cartodb'
    twitter_username 'cartodb'
    location 'Madrid'
    builder_enabled false # Most tests still assume editor

    factory :organization_whitelist_carto do
      whitelisted_email_domains ['carto.com']
      auth_username_password_enabled true
    end

    factory :organization_with_users do
      after(:create) do |org|
        create_account_type_fg('ORGANIZATION USER')
        owner = FactoryGirl.create(:user)
        uo = CartoDB::UserOrganization.new(org.id, owner.id)
        uo.promote_user_to_admin
        org.reload
        user = FactoryGirl.build(:user)
        user.organization_id = org.id
        user.enabled = true
        user.save
        org.reload
      end
    end

    factory :saml_organization do
      auth_saml_configuration do
        {
          issuer: 'localhost.lan',
          idp_sso_target_url: 'https://example.com/saml/signon/',
          idp_slo_target_url: 'https://example.com/saml/signon/',
          idp_cert_fingerprint: '',
          assertion_consumer_service_url: 'https://localhost.lan/saml/finalize',
          name_identifier_format: '',
          email_attribute: 'username'
        }.stringify_keys
      end
    end
  end
end

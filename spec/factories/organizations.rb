FactoryGirl.define do

  factory :organization do
    to_create(&:save)
    name 'vizzuality'
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
  end
end

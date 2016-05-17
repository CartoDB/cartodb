FactoryGirl.define do

  factory :organization do
    name 'vizzuality'
    seats 10
    quota_in_bytes 100.megabytes
    geocoding_quota 1000
    here_isolines_quota 1000
    obs_snapshot_quota 1000
    obs_general_quota 1000
    map_view_quota 100000
    website 'cartodb.com'
    description 'Lorem ipsum dolor sit amet'
    display_name 'Vizzuality Inc'
    discus_shortname 'cartodb'
    twitter_username 'cartodb'
    location 'Madrid'

    factory :organization_with_users do
      after(:create) do |org|
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
  end

end

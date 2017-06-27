FactoryGirl.define do
  factory :carto_synchronization, class: Carto::Synchronization do
    id { UUIDTools::UUID.random_uuid }
    name 'histcounties_1979_present'
    interval 2592000
    url 'https://common-data.cartodb.com/api/v2/sql?q=select+*+from+%22histcounties_1979_present%22&format=shp&filename=histcounties_1979_present'
    state 'success'
    type_guessing true
    quoted_fields_guessing true
    content_guessing true

    after(:build) do |sync|
      sync.log = FactoryGirl.build(:carto_log, type: 'sync')
    end
  end
end

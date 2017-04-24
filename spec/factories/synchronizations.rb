FactoryGirl.define do
  factory :carto_synchronization, class: Carto::Synchronization do
    id { UUIDTools::UUID.random_uuid }
  end
end

FactoryGirl.define do
  factory :automatic_geocoding, class: Carto::AutomaticGeocoding do
    to_create(&:save)
  end
end

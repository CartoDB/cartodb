FactoryGirl.define do
  factory :automatic_geocoding do
    to_create(&:save)
  end
end

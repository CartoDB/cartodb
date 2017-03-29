FactoryGirl.define do
  to_create(&:save)

  # TODO: refactor tests that depend on default geocoding factory
  factory :geocoding, class: Geocoding do
    factory :high_resolution_geocoding do
      kind 'high-resolution'
    end
  end
end

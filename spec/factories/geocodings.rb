FactoryGirl.define do

  # TODO: refactor tests that depend on default geocoding factory
  factory :geocoding do

    kind 'high-resolution'

    factory :high_resolution_geocoding do
    end

  end

end

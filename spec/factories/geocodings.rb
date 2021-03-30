FactoryBot.define do
  # TODO: refactor tests that depend on default geocoding factory
  factory :geocoding, class: Geocoding do
    to_create(&:save)

    kind { 'namedplace' }
    formatter { 'foo' }

    factory :high_resolution_geocoding do
      kind { 'high-resolution' }
    end
  end

  factory :carto_geocoding, class: 'Carto::Geocoding' do
    kind { 'namedplace' }
    formatter { 'foo' }
    used_credits { 1 }
  end
end

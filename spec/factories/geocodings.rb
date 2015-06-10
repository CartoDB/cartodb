FactoryGirl.define do

  factory :geocoding do

    formatter 'admin'

    factory :high_resolution_geocoding do
      kind 'high-resolution'
    end
  end

end

FactoryGirl.define do
  factory :automatic_geocoding do
    geocoding_id 1
    state "MyText"
    run_at "2013-11-20 12:26:29"
    interval 1
  end
end

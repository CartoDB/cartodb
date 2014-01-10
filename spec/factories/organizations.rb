FactoryGirl.define do

  factory :organization do
    seats 10
    quota_in_bytes 100.megabytes
  end

end

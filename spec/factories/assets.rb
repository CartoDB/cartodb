FactoryGirl.define do

  factory :asset do
    asset_file { (Rails.root + 'db/fake_data/simple.json').to_s }
  end

end

FactoryGirl.define do

  factory :feature_flag do
    id { rand(10000) }
    sequence(:name) {|n| "FF#{n}" }
    restricted true
  end

  factory :carto_feature_flag, class: Carto::FeatureFlag do
    id { rand(10000) }
    sequence(:name) {|n| "FF#{n}" }
    restricted true
  end

end

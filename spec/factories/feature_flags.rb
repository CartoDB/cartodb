FactoryGirl.define do
  factory :feature_flag, class: 'Carto::FeatureFlag' do
    id { |n| (Carto::FeatureFlag.last&.id || 0) + 1 }
    sequence(:name) { |n| "feature-flag-name-#{n}" }
    restricted { true }

    trait(:restricted) { restricted { true } }
    trait(:not_restricted) { restricted { false } }
  end
end

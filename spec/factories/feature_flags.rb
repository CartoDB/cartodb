FactoryBot.define do
  factory :feature_flag, class: 'Carto::FeatureFlag' do
    sequence(:id)
    sequence(:name) { |n| "feature-flag-name-#{n}" }
    restricted { true }

    trait(:restricted) { restricted { true } }
    trait(:not_restricted) { restricted { false } }
  end
end

FactoryGirl.define do
  factory :totp, class: Carto::UserMultifactorAuth do
    type Carto::UserMultifactorAuth::TYPE_TOTP

    trait :needs_setup do
      enabled false
    end

    trait :active do
      enabled true
    end

    trait :disabled do
      enabled false
    end

    factory :totp_needs_setup, traits: [:needs_setup]
    factory :totp_active, traits: [:active]
    factory :totp_disabled, traits: [:disabled]
  end
end

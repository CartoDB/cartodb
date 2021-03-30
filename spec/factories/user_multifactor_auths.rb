FactoryBot.define do
  factory :totp, class: 'Carto::UserMultifactorAuth' do
    type { Carto::UserMultifactorAuth::TYPE_TOTP }

    trait :needs_setup do
      enabled { false }
    end

    trait :active do
      enabled { true }
    end
  end
end

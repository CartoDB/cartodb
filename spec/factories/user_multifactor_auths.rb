FactoryGirl.define do
  factory :totp, class: Carto::UserMultifactorAuth do
    type Carto::UserMultifactorAuth::TYPE_TOTP
  end
end

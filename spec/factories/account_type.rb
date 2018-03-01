FactoryGirl.define do
  factory :account_type_free, class: Carto::AccountType do
    account_type 'FREE'
    association :rate_limit, factory: :rate_limits
  end

  factory :account_type_pro, class: Carto::AccountType do
    account_type 'PRO'
    association :rate_limit, factory: :rate_limits_pro
  end
end

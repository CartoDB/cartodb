FactoryGirl.define do
  factory :account_type_free, class: Carto::AccountType do
    account_type 'FREE'
    association :rate_limit, factory: :rate_limits
  end
end

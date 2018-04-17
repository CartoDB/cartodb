FactoryGirl.define do
  factory :account_type, class: Carto::AccountType do
    to_create do |instance|
      avoid_dup(instance)
    end

    account_type 'FREE'
    association :rate_limit, factory: :rate_limits
  end

  factory :account_type_free, class: Carto::AccountType do
    to_create do |instance|
      avoid_dup(instance)
    end

    account_type 'FREE'
    association :rate_limit, factory: :rate_limits
  end

  factory :account_type_pro, class: Carto::AccountType do
    to_create do |instance|
      avoid_dup(instance)
    end

    account_type 'PRO'
    association :rate_limit, factory: :rate_limits_pro
  end

  factory :account_type_org, class: Carto::AccountType do
    to_create do |instance|
      avoid_dup(instance)
    end

    account_type 'ORGANIZATION USER'
    association :rate_limit, factory: :rate_limits
  end

  def avoid_dup(account_type)
    account_type.save! unless Carto::AccountType.exists?(account_type: account_type.account_type)
  end
end

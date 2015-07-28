# Read about factories at https://github.com/thoughtbot/factory_girl

FactoryGirl.define do

  factory :user do

    username               { String.random(5).downcase }
    email                  { String.random(5).downcase + '@' + String.random(5).downcase + '.com' }
    password               { email.split('@').first }
    table_quota            5
    quota_in_bytes         5000000
    id                     { UUIDTools::UUID.timestamp_create.to_s }

    trait :admin_privileges do

      username 'Admin'
      email 'admin@example.com'
      admin true

    end

    trait :private_tables do
      private_tables_enabled true
    end

    trait :sync_tables do
      sync_tables_enabled true
    end

    trait :enabled do
      enabled true
    end

    factory :user_with_private_tables, traits: [:enabled, :private_tables]
    factory :admin, traits: [:admin]

    factory :valid_user do
      username { "user#{rand(10000)}" }
      email { "email" + rand(10000).to_s + "@nonono.com" }
      password 'kkkkkkkkk'
      password_confirmation 'kkkkkkkkk'
      salt 'kkkkkkkkk'
      crypted_password 'kkkkkkkkk'
    end

    # For unit testing, without database
    factory :organization_owner do
      id { UUIDTools::UUID.timestamp_create.to_s }
      organization FactoryGirl.build(:organization_with_id)

      after(:build) do |owner|
        owner.organization.owner = owner
      end
    end

  end

end

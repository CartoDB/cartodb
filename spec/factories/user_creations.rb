require 'ostruct'

FactoryGirl.define do

  factory :user_creation, class: Carto::UserCreation do
    username "whatever"
    email "whatever@cartodb.com"
    crypted_password "rgjreogjorejgpovrjeg"
    salt "ewefgrjwopjgow"
    google_sign_in false
    quota_in_bytes 10000000

    factory :autologin_user_creation do
      state 'success'
      created_at { Time.now }

      after(:build) do |model, evaluator|
        # This is useful to test user creation logic without persistence
        fake_user = OpenStruct.new(enable_account_token: nil, enabled: true, dashboard_viewed_at: nil)
        model.instance_variable_set(:@cartodb_user, fake_user)
      end
    end
  end

end


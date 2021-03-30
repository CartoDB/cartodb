FactoryBot.define do
  factory :oauth_app_users, class: Carto::OauthAppUser do
    to_create(&:save!)

    skip_role_setup { true }
  end
end

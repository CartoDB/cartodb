FactoryBot.define do
  factory :oauth_authorization_codes, class: Carto::OauthAuthorizationCode do
    to_create(&:save!)
  end
end

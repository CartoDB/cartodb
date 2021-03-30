FactoryBot.define do
  factory :oauth_access_tokens, class: Carto::OauthAccessToken do
    to_create(&:save!)

    skip_api_key_creation { true }
  end
end

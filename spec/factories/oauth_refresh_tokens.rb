FactoryBot.define do
  factory :oauth_refresh_tokens, class: Carto::OauthRefreshToken do
    to_create(&:save!)

    skip_token_regeneration { true }
    token { 'a-fake-and-test-token' }
  end
end

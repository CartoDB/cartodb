require_relative '../../app/models/carto/widget'

FactoryGirl.define do
  factory :oauth_app, class: Carto::OauthApp do
    name { unique_name('Oauth application') }
    redirect_uri 'https://redirect.uri'
  end
end

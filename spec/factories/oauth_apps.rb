require_relative '../../app/models/carto/widget'

FactoryGirl.define do
  factory :oauth_app, class: Carto::OauthApp do
    name { unique_name('Oauth application') }
    redirect_urls ['https://redirect.uri']
  end
end

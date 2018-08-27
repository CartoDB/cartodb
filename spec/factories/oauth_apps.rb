FactoryGirl.define do
  factory :oauth_app, class: Carto::OauthApp do
    to_create(&:save!)

    name { unique_name('Oauth application') }
    redirect_uris ['https://redirect.uri']
    icon_url 'http://localhost/some_icon.png'
  end
end

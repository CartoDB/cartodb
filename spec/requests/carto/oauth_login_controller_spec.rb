require 'spec_helper_min'

describe Carto::OauthLoginController do
  before(:all) do
    @organization = FactoryGirl.create(:organization_google_whitelist_empty)
  end

  after(:all) do
    @organization.destroy
  end

  it 'does not allow Google signup if whitelisted domains is empty' do
    allow_any_instance_of(Carto::Oauth::Google::Api).to receive(:user).and_return(nil)
    allow(Carto::Oauth::Google::Config).to receive(:config).and_return('client_id' => '11')
    allow_any_instance_of(Carto::Oauth::Client).to receive(:exchange_code_for_token).and_return('123')
    allow_any_instance_of(Carto::OauthLoginController).to receive(:valid_authenticity_token?).and_return(true)

    expect_any_instance_of(CartoDB::UserAccountCreator).to receive(:new).never
    get google_oauth_url(user_domain: @organization.name,
                        code: 'blabla',
                        state: '{"organization_name": "' + @organization.name + '"}')
    response.status.should eq 302
    follow_redirect!
    request.path.should eq '/login'
  end

  it 'allows Google signup with whitelisted domains' do
    @organization.whitelisted_email_domains = ['*gmail.com']
    @organization.save

    allow_any_instance_of(Carto::Oauth::Google::Api).to receive(:user).and_return(nil)
    allow(Carto::Oauth::Google::Config).to receive(:config).and_return('client_id' => '11')
    allow_any_instance_of(Carto::Oauth::Client).to receive(:exchange_code_for_token).and_return('123')
    allow_any_instance_of(Carto::OauthLoginController).to receive(:valid_authenticity_token?).and_return(true)

    expect_any_instance_of(CartoDB::UserAccountCreator).to receive(:valid?).once
    get google_oauth_url(user_domain: @organization.name,
                        code: 'blabla',
                        state: '{"organization_name": "' + @organization.name + '"}')
    response.status.should eq 200
  end
end
require 'spec_helper_min'

describe Carto::OauthLoginController do
  before(:all) do
    @organization = create(:organization_google_whitelist_empty)
  end

  after(:all) do
    @organization.destroy
  end

  it 'does not allow Google signup if whitelisted domains is empty' do
    Carto::Oauth::Google::Api.any_instance.stubs(:user).returns(nil)
    Carto::Oauth::Google::Config.stubs(:config).returns('client_id' => '11')
    Carto::Oauth::Client.any_instance.stubs(:exchange_code_for_token).returns('123')
    Carto::OauthLoginController.any_instance.stubs(:valid_authenticity_token?).returns(true)

    CartoDB::UserAccountCreator.any_instance.expects(:new).never
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

    Carto::Oauth::Google::Api.any_instance.stubs(:user).returns(nil)
    Carto::Oauth::Google::Config.stubs(:config).returns('client_id' => '11')
    Carto::Oauth::Client.any_instance.stubs(:exchange_code_for_token).returns('123')
    Carto::OauthLoginController.any_instance.stubs(:valid_authenticity_token?).returns(true)

    CartoDB::UserAccountCreator.any_instance.expects(:valid?).once
    get google_oauth_url(user_domain: @organization.name,
                        code: 'blabla',
                        state: '{"organization_name": "' + @organization.name + '"}')
    response.status.should eq 200
  end
end

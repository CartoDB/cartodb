require 'spec_helper_min'
require 'carto/oauth_provider_controller'

describe Carto::OauthProviderController do
  before(:all) do
    @sequel_developer = FactoryGirl.create(:valid_user)
    @developer = Carto::User.find(@sequel_developer.id)
    @oauth_app = FactoryGirl.create(:oauth_app, user: @developer)

    @user = FactoryGirl.create(:valid_user)
  end

  after(:all) do
    @oauth_app.destroy
    @developer.destroy

    @user.destroy
  end

  after(:each) do
    Carto::User.find(@user.id).oauth_app_users.each(&:destroy)
  end

  before(:each) do
    login_as(@user)
  end

  describe '#consent' do
    it 'shows the consent form' do
      get oauth_provider_authorize_url(
        client_id: @oauth_app.client_id,
        response_type: 'code',
        state: 'random_state_thingy'
      )
      expect(response.status).to(eq(200))
    end
  end
end

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
    login_as(@user, scope: @user.username)
    host!("#{@user.username}.localhost.lan")
  end

  describe '#consent' do
    let(:valid_payload) do
      {
        client_id: @oauth_app.client_id,
        response_type: 'code',
        state: 'random_state_thingy'
      }
    end

    it 'logged out, redirects to login' do
      logout
      get oauth_provider_authorize_url(valid_payload)

      expect(response.status).to(eq(302))
      expect(response.location).to(include('/login'))
    end

    it 'shows the consent form' do
      get oauth_provider_authorize_url(valid_payload)

      expect(response.status).to(eq(200))
      expect(response.body).to(include(valid_payload[:client_id]))
      expect(response.body).to(include(valid_payload[:state]))
    end

    it 'returns a 404 error if application cannot be found' do
      get oauth_provider_authorize_url(valid_payload.merge(client_id: 'e'))

      expect(response.status).to(eq(404))
    end

    it 'redirects with an error if invalid response_type' do
      get oauth_provider_authorize_url(valid_payload.merge(response_type: 'err'))

      expect(response.status).to(eq(302))
      expect(response.location).to(start_with(@oauth_app.redirect_uri))
      expect(Addressable::URI.parse(response.location).query_values['error']).to(eq('unsupported_response_type'))
    end

    it 'redirects with an error if missing state' do
      get oauth_provider_authorize_url(valid_payload.merge(state: ''))

      expect(response.status).to(eq(302))
      expect(response.location).to(start_with(@oauth_app.redirect_uri))
      qs = Addressable::URI.parse(response.location).query_values
      expect(qs['error']).to(eq('invalid_request'))
      expect(qs['error_description']).to(eq('state is mandatory'))
    end

    it 'redirects with an error if requesting unknown scopes' do
      get oauth_provider_authorize_url(valid_payload.merge(scope: 'invalid wadus'))

      expect(response.status).to(eq(302))
      expect(response.location).to(start_with(@oauth_app.redirect_uri))
      expect(Addressable::URI.parse(response.location).query_values['error']).to(eq('invalid_scope'))
    end

    it 'redirects with an error if requesting with an invalid redirect_uri' do
      get oauth_provider_authorize_url(valid_payload.merge(redirect_uri: 'invalid'))

      expect(response.status).to(eq(302))
      expect(response.location).to(start_with(@oauth_app.redirect_uri))
      qs = Addressable::URI.parse(response.location).query_values
      expect(qs['error']).to(eq('invalid_request'))
      expect(qs['error_description']).to(eq('The redirect_uri is not authorized for this application'))
    end
  end
end

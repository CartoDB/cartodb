require 'spec_helper_min'
require 'carto/oauth_provider_controller'
require 'support/helpers'

describe Carto::OauthProviderController do
  include HelperMethods

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

  let(:valid_payload) do
    {
      client_id: @oauth_app.client_id,
      response_type: 'code',
      state: 'random_state_thingy',
      accept: true
    }
  end

  shared_examples_for 'authorization parameter validation' do
    it 'returns a 404 error if application cannot be found' do
      request_endpoint(valid_payload.merge(client_id: 'e'))

      expect(response.status).to(eq(404))
    end

    it 'redirects with an error if invalid response_type' do
      request_endpoint(valid_payload.merge(response_type: 'err'))

      expect(response.status).to(eq(302))
      expect(response.location).to(start_with(@oauth_app.redirect_uris.first))
      expect(Addressable::URI.parse(response.location).query_values['error']).to(eq('unsupported_response_type'))
    end

    it 'redirects with an error if missing state' do
      request_endpoint(valid_payload.merge(state: ''))

      expect(response.status).to(eq(302))
      expect(response.location).to(start_with(@oauth_app.redirect_uris.first))
      qs = Addressable::URI.parse(response.location).query_values
      expect(qs['error']).to(eq('invalid_request'))
      expect(qs['error_description']).to(eq('state is mandatory'))
    end

    it 'redirects with an error if requesting unknown scopes' do
      request_endpoint(valid_payload.merge(scope: 'invalid wadus'))

      expect(response.status).to(eq(302))
      expect(response.location).to(start_with(@oauth_app.redirect_uris.first))
      expect(Addressable::URI.parse(response.location).query_values['error']).to(eq('invalid_scope'))
    end

    it 'redirects with an error if requesting with an invalid redirect_uri' do
      request_endpoint(valid_payload.merge(redirect_uri: 'invalid'))

      expect(response.status).to(eq(302))
      expect(response.location).to(start_with(@oauth_app.redirect_uris.first))
      qs = Addressable::URI.parse(response.location).query_values
      expect(qs['error']).to(eq('invalid_request'))
      expect(qs['error_description']).to(eq('The redirect_uri is not authorized for this application'))
    end
  end

  describe '#consent' do
    before(:each) do
      login_as(@user, scope: @user.username)
      host!("#{@user.username}.localhost.lan")
    end

    it_behaves_like 'authorization parameter validation' do
      def request_endpoint(parameters)
        get oauth_provider_authorize_url(parameters)
      end
    end

    it 'logged out, redirects to login' do
      logout
      get oauth_provider_authorize_url(valid_payload)

      expect(response.status).to(eq(302))
      expect(response.location).to(include('/login'))
    end

    it 'with valid payload, shows the consent form' do
      get oauth_provider_authorize_url(valid_payload)

      expect(response.status).to(eq(200))
      expect(response.body).to(include(valid_payload[:client_id]))
      expect(response.body).to(include(valid_payload[:state]))
    end

    it 'with valid payload, and pre-authorized, redirects back to the application' do
      oau = @oauth_app.oauth_app_users.create!(user_id: @user.id)
      get oauth_provider_authorize_url(valid_payload)

      authorization = oau.oauth_authorizations.first
      expect(authorization).to(be)
      expect(authorization.code).to(be_present)
      expect(authorization.api_key).not_to(be)

      expect(response.status).to(eq(302))
      expect(Addressable::URI.parse(response.location).query_values['code']).to(eq(authorization.code))
    end

    # TODO: Do not auto-consent if requesting more scopes
  end

  describe '#authorize' do
    before(:each) do
      login_as(@user, scope: @user.username)
      host!("#{@user.username}.localhost.lan")
    end

    it_behaves_like 'authorization parameter validation' do
      def request_endpoint(parameters)
        post oauth_provider_authorize_url(parameters)
      end
    end

    it 'logged out, redirects to login' do
      logout
      post oauth_provider_authorize_url(valid_payload)

      expect(response.status).to(eq(302))
      expect(response.location).to(include('/login'))
    end

    it 'with valid payload, creates an authorization and redirects back to the application with a code' do
      post oauth_provider_authorize_url(valid_payload)

      authorization = @oauth_app.oauth_app_users.find_by_user_id!(@user.id).oauth_authorizations.first
      expect(authorization).to(be)
      expect(authorization.code).to(be_present)
      expect(authorization.api_key).not_to(be)

      expect(response.status).to(eq(302))
      expect(Addressable::URI.parse(response.location).query_values['code']).to(eq(authorization.code))
    end

    # TODO: Upgrade oauth_app_user if requesting more scopes
  end

  describe '#token' do
    before(:each) do
      @oauth_app_user = @oauth_app.oauth_app_users.create!(user_id: @user.id)
      @authorization = @oauth_app_user.oauth_authorizations.create_with_code!(nil)
    end

    let (:token_payload) do
      {
        client_id: @oauth_app.client_id,
        client_secret: @oauth_app.client_secret,
        grant_type: 'authorization_code',
        code: @authorization.code
      }
    end

    it 'with valid code returns an api key' do
      post_json oauth_provider_token_url(token_payload) do |response|
        @authorization.reload
        expect(@authorization.code).to(be_nil)
        expect(@authorization.api_key).to(be)

        expect(response.status).to(eq(200))
        expect(response.body).to(eq(access_token: @authorization.api_key.token, token_type: "bearer"))
      end
    end

    it 'with expired code, returns code not valid' do
      Delorean.jump(2.minutes)

      post_json oauth_provider_token_url(token_payload) do |response|
        @authorization.reload
        expect(@authorization.code).to(be)
        expect(@authorization.api_key).to(be_nil)

        expect(response.status).to(eq(400))
        expect(response.body[:error]).to(eq('invalid_grant'))
      end
    end

    it 'with invalid code, returns error without creating the api key' do
      post_json oauth_provider_token_url(token_payload.merge(code: 'invalid')) do |response|
        @authorization.reload
        expect(@authorization.code).to(be)
        expect(@authorization.api_key).to(be_nil)

        expect(response.status).to(eq(400))
        expect(response.body[:error]).to(eq('invalid_grant'))
      end
    end

    it 'with invalid client_id, returns error without creating the api key' do
      post_json oauth_provider_token_url(token_payload.merge(client_id: 'invalid')) do |response|
        @authorization.reload
        expect(@authorization.code).to(be)
        expect(@authorization.api_key).to(be_nil)

        expect(response.status).to(eq(400))
        expect(response.body[:error]).to(eq('invalid_client'))
      end
    end

    it 'with invalid client_secret, returns error without creating the api key' do
      post_json oauth_provider_token_url(token_payload.merge(client_secret: 'invalid')) do |response|
        @authorization.reload
        expect(@authorization.code).to(be)
        expect(@authorization.api_key).to(be_nil)

        expect(response.status).to(eq(400))
        expect(response.body[:error]).to(eq('invalid_client'))
      end
    end

    it 'with invalid grant_type, returns error without creating the api key' do
      post_json oauth_provider_token_url(token_payload.merge(grant_type: 'invalid')) do |response|
        @authorization.reload
        expect(@authorization.code).to(be)
        expect(@authorization.api_key).to(be_nil)

        expect(response.status).to(eq(400))
        expect(response.body[:error]).to(eq('unsupported_grant_type'))
      end
    end

    it 'with invalid redirect_uri, returns error without creating the api key' do
      post_json oauth_provider_token_url(token_payload.merge(redirect_uri: 'invalid')) do |response|
        @authorization.reload
        expect(@authorization.code).to(be)
        expect(@authorization.api_key).to(be_nil)

        expect(response.status).to(eq(400))
        expect(response.body[:error]).to(eq('invalid_request'))
      end
    end
  end
end

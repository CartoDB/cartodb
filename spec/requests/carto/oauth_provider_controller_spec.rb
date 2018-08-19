require 'spec_helper_min'
require 'carto/oauth_provider_controller'
require 'support/helpers'

describe Carto::OauthProviderController do
  include HelperMethods

  before(:all) do
    @sequel_developer = FactoryGirl.create(:valid_user)
    @developer = Carto::User.find(@sequel_developer.id)
    @user = FactoryGirl.create(:valid_user)
  end

  before(:each) do
    @oauth_app = FactoryGirl.create(:oauth_app, user: @developer)
  end

  after(:each) do
    @oauth_app.reload.destroy
  end

  after(:all) do
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

      authorization_code = oau.oauth_authorization_codes.first
      expect(authorization_code).to(be)
      expect(authorization_code.code).to(be_present)

      expect(response.status).to(eq(302))
      expect(Addressable::URI.parse(response.location).query_values['code']).to(eq(authorization_code.code))
    end

    it 'with valid payload, pre-authorized and requesting more scopes, shows the consent screen' do
      @oauth_app.oauth_app_users.create!(user_id: @user.id)
      get oauth_provider_authorize_url(valid_payload.merge(scope: 'offline'))

      expect(response.status).to(eq(200))
      expect(response.body).to(include(valid_payload[:client_id]))
      expect(response.body).to(include(valid_payload[:state]))
    end
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

      authorization_code = @oauth_app.oauth_app_users.find_by_user_id!(@user.id).oauth_authorization_codes.first
      expect(authorization_code).to(be)
      expect(authorization_code.code).to(be_present)

      expect(response.status).to(eq(302))
      expect(Addressable::URI.parse(response.location).query_values['code']).to(eq(authorization_code.code))
    end

    it 'with valid payload and redirect URIs, creates an authorization and redirects back to the requested URI' do
      @oauth_app.update!(redirect_uris: ['https://domain1', 'https://domain2', 'https://domain3'])

      post oauth_provider_authorize_url(valid_payload.merge(redirect_uri: 'https://domain3'))

      authorization_code = @oauth_app.oauth_app_users.find_by_user_id!(@user.id).oauth_authorization_codes.first
      expect(authorization_code).to(be)
      expect(authorization_code.code).to(be_present)
      expect(authorization_code.redirect_uri).to(eq('https://domain3'))

      expect(response.status).to(eq(302))
      expect(Addressable::URI.parse(response.location).query_values['code']).to(eq(authorization_code.code))
      expect(response.location).to(start_with('https://domain3'))
    end

    it 'with valid payload, and a pre-existing grant, upgrades it adding more scopes' do
      oau = @oauth_app.oauth_app_users.create!(user_id: @user.id)
      post oauth_provider_authorize_url(valid_payload.merge(scope: 'offline'))

      expect(oau.scopes).to(eq([]))
      oau.reload
      expect(oau.scopes).to(eq(['offline']))

      authorization_code = @oauth_app.oauth_app_users.find_by_user_id!(@user.id).oauth_authorization_codes.first
      expect(authorization_code).to(be)
      expect(authorization_code.code).to(be_present)

      expect(response.status).to(eq(302))
      expect(Addressable::URI.parse(response.location).query_values['code']).to(eq(authorization_code.code))
    end
  end

  describe '#token' do
    before(:each) do
      @oauth_app_user = @oauth_app.oauth_app_users.create!(user_id: @user.id)
      @authorization_code = @oauth_app_user.oauth_authorization_codes.create!
    end

    let (:auth_code_token_payload) do
      {
        client_id: @oauth_app.client_id,
        client_secret: @oauth_app.client_secret,
        grant_type: 'authorization_code',
        code: @authorization_code.code
      }
    end

    describe 'with authorization code' do
      it 'with valid code returns an api key' do
        post_json oauth_provider_token_url(auth_code_token_payload) do |response|
          expect(Carto::OauthAuthorizationCode.exists?(@authorization_code.id)).to(be_false)
          access_token = @oauth_app_user.oauth_access_tokens.reload.first
          expect(access_token).to(be)

          expect(response.status).to(eq(200))
          expect(response.body[:access_token]).to(eq(access_token.api_key.token))
          expect(response.body[:token_type]).to(eq('bearer'))
          expect(response.body[:expires_in]).to(be_between(3595, 3600)) # Little margin for slowness
          expect(response.body[:refresh_token]).to(be_nil)
        end
      end

      it 'with valid code and offline scope returns an api key and refresh token' do
        @authorization_code.update!(scopes: ['offline'])

        post_json oauth_provider_token_url(auth_code_token_payload) do |response|
          expect(Carto::OauthAuthorizationCode.exists?(@authorization_code.id)).to(be_false)
          access_token = @oauth_app_user.oauth_access_tokens.reload.first
          expect(access_token).to(be)

          expect(response.status).to(eq(200))
          expect(response.body[:access_token]).to(eq(access_token.api_key.token))
          expect(response.body[:token_type]).to(eq('bearer'))
          expect(response.body[:expires_in]).to(be_between(3595, 3600)) # Little margin for slowness
          expect(response.body[:user_info_url]).to(include(api_v4_users_me_path, @user.username))

          refresh_token = @oauth_app_user.oauth_refresh_tokens.find_by_token(response.body[:refresh_token])
          expect(refresh_token).to(be)
        end
      end

      it 'with valid code and redirect uri returns an api key' do
        @oauth_app.update!(redirect_uris: ['https://domain1', 'https://domain2', 'https://domain3'])
        @authorization_code.update!(redirect_uri: 'https://domain3')

        post_json oauth_provider_token_url(auth_code_token_payload.merge(redirect_uri: 'https://domain3')) do |response|
          expect(Carto::OauthAuthorizationCode.exists?(@authorization_code.id)).to(be_false)
          access_token = @oauth_app_user.oauth_access_tokens.reload.first
          expect(access_token).to(be)

          expect(response.status).to(eq(200))
          expect(response.body[:access_token]).to(eq(access_token.api_key.token))
          expect(response.body[:token_type]).to(eq('bearer'))
          expect(response.body[:expires_in]).to(be_between(3595, 3600)) # Little margin for slowness
          expect(response.body[:user_info_url]).to(include(api_v4_users_me_path, @user.username))
        end
      end

      it 'with expired code, returns code not valid' do
        Delorean.jump(2.minutes)

        post_json oauth_provider_token_url(auth_code_token_payload) do |response|
          expect(Carto::OauthAuthorizationCode.exists?(@authorization_code.id)).to(be_true)
          access_token = @oauth_app_user.oauth_access_tokens.reload.first
          expect(access_token).to(be_nil)

          expect(response.status).to(eq(400))
          expect(response.body[:error]).to(eq('invalid_grant'))
        end
      end

      it 'with invalid code, returns error without creating the api key' do
        post_json oauth_provider_token_url(auth_code_token_payload.merge(code: 'invalid')) do |response|
          expect(Carto::OauthAuthorizationCode.exists?(@authorization_code.id)).to(be_true)
          access_token = @oauth_app_user.oauth_access_tokens.reload.first
          expect(access_token).to(be_nil)

          expect(response.status).to(eq(400))
          expect(response.body[:error]).to(eq('invalid_grant'))
        end
      end

      it 'with invalid redirect_uri, returns error without creating the api key' do
        post_json oauth_provider_token_url(auth_code_token_payload.merge(redirect_uri: 'invalid')) do |response|
          expect(Carto::OauthAuthorizationCode.exists?(@authorization_code.id)).to(be_true)
          access_token = @oauth_app_user.oauth_access_tokens.reload.first
          expect(access_token).to(be_nil)

          expect(response.status).to(eq(400))
          expect(response.body[:error]).to(eq('invalid_request'))
        end
      end

      it 'without redirect_uri, returns error without creating the api key' do
        @authorization_code.update!(redirect_uri: @oauth_app.redirect_uris.first)

        post_json oauth_provider_token_url(auth_code_token_payload) do |response|
          expect(Carto::OauthAuthorizationCode.exists?(@authorization_code.id)).to(be_true)
          access_token = @oauth_app_user.oauth_access_tokens.reload.first
          expect(access_token).to(be_nil)

          expect(response.status).to(eq(400))
          expect(response.body[:error]).to(eq('invalid_request'))
        end
      end
    end

    describe 'with refresh token' do
      before(:each) do
        @refresh_token = @oauth_app_user.oauth_refresh_tokens.create!(scopes: ['offline'])
      end

      let (:refresh_token_payload) do
        {
          client_id: @oauth_app.client_id,
          client_secret: @oauth_app.client_secret,
          grant_type: 'refresh_token',
          refresh_token: @refresh_token.token
        }
      end

      it 'with valid token returns an api key' do
        post_json oauth_provider_token_url(refresh_token_payload) do |response|
          access_token = @oauth_app_user.oauth_access_tokens.reload.first
          expect(access_token).to(be)
          expect { @refresh_token.reload }.to(change { @refresh_token.token })
          expect(access_token.scopes).to(eq(@refresh_token.scopes))

          expect(response.status).to(eq(200))
          expect(response.body[:access_token]).to(eq(access_token.api_key.token))
          expect(response.body[:token_type]).to(eq('bearer'))
          expect(response.body[:expires_in]).to(be_between(3595, 3600)) # Little margin for slowness
          expect(response.body[:refresh_token]).to(eq(@refresh_token.token))
        end
      end

      it 'with valid token and explicit scopes returns a restricted api key' do
        post_json oauth_provider_token_url(refresh_token_payload.merge(scope: '')) do |response|
          access_token = @oauth_app_user.oauth_access_tokens.reload.first
          expect(access_token).to(be)
          expect { @refresh_token.reload }.to(change { @refresh_token.token })
          expect(access_token.scopes).to(eq([]))

          expect(response.status).to(eq(200))
          expect(response.body[:access_token]).to(eq(access_token.api_key.token))
          expect(response.body[:token_type]).to(eq('bearer'))
          expect(response.body[:expires_in]).to(be_between(3595, 3600)) # Little margin for slowness
          expect(response.body[:refresh_token]).to(eq(@refresh_token.token))
        end
      end

      it 'with expired token, returns error without creating the api key' do
        Delorean.jump 1.year

        post_json oauth_provider_token_url(refresh_token_payload) do |response|
          access_token = @oauth_app_user.oauth_access_tokens.reload.first
          expect(access_token).to(be_nil)

          expect(response.status).to(eq(400))
          expect(response.body[:error]).to(eq('invalid_grant'))
        end
      end

      it 'with invalid code, returns error without creating the api key' do
        post_json oauth_provider_token_url(refresh_token_payload.merge(refresh_token: 'invalid')) do |response|
          access_token = @oauth_app_user.oauth_access_tokens.reload.first
          expect(access_token).to(be_nil)

          expect(response.status).to(eq(400))
          expect(response.body[:error]).to(eq('invalid_grant'))
        end
      end
    end

    it 'with invalid client_id, returns error without creating the api key' do
      post_json oauth_provider_token_url(auth_code_token_payload.merge(client_id: 'invalid')) do |response|
        expect(Carto::OauthAuthorizationCode.exists?(@authorization_code.id)).to(be_true)
        access_token = @oauth_app_user.oauth_access_tokens.reload.first
        expect(access_token).to(be_nil)

        expect(response.status).to(eq(400))
        expect(response.body[:error]).to(eq('invalid_client'))
      end
    end

    it 'with invalid client_secret, returns error without creating the api key' do
      post_json oauth_provider_token_url(auth_code_token_payload.merge(client_secret: 'invalid')) do |response|
        expect(Carto::OauthAuthorizationCode.exists?(@authorization_code.id)).to(be_true)
        access_token = @oauth_app_user.oauth_access_tokens.reload.first
        expect(access_token).to(be_nil)

        expect(response.status).to(eq(400))
        expect(response.body[:error]).to(eq('invalid_client'))
      end
    end

    it 'with invalid grant_type, returns error without creating the api key' do
      post_json oauth_provider_token_url(auth_code_token_payload.merge(grant_type: 'invalid')) do |response|
        expect(Carto::OauthAuthorizationCode.exists?(@authorization_code.id)).to(be_true)
        access_token = @oauth_app_user.oauth_access_tokens.reload.first
        expect(access_token).to(be_nil)

        expect(response.status).to(eq(400))
        expect(response.body[:error]).to(eq('unsupported_grant_type'))
      end
    end
  end

  describe '#acceptance' do
    include Capybara::DSL

    it 'following the oauth flow produces a valid API Key and refresh token to renew it' do
      # Since Capybara+rack passes all requests to the local server, we set a redirect URI inside localhost
      redirect_uri = "https://#{@user.username}.localhost.lan/redirect"
      @oauth_app.update!(redirect_uris: ['https://fake_uri', redirect_uri])

      # Login
      login_as(@user, scope: @user.username)
      base_uri = "http://#{@user.username}.localhost.lan"
      begin
        visit "#{base_uri}/login"
      rescue ActionView::MissingTemplate
        # Expected error trying to load dashboard statics
      end

      # Request authorization
      state = '123qweasdzxc'
      visit "#{base_uri}/oauth2/authorize?client_id=#{@oauth_app.client_id}&state=#{state}" \
            "&response_type=code&scope=offline&redirect_uri=#{redirect_uri}"

      begin
        click_on 'Accept'
      rescue ActionController::RoutingError
        # Expected error since /redirect is a made up URL
      end

      expect(current_url).to(start_with(redirect_uri))
      response_parameters = Addressable::URI.parse(current_url).query_values
      expect(response_parameters['state']).to(eq(state))
      code = response_parameters['code']

      # Exchange token for API Key
      logout
      payload = {
        client_id: @oauth_app.client_id,
        client_secret: @oauth_app.client_secret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirect_uri
      }
      token_response = post_json oauth_provider_token_url(payload) do |response|
        expect(response.status).to(eq(200))

        response.body
      end

      api_key = token_response[:access_token]
      me_url = token_response[:user_info_url]
      refresh_token = token_response[:refresh_token]

      expect(api_key).to(be)
      expect(me_url).to(be)
      expect(refresh_token).to(be)

      # Try to use the access token
      # TODO: use bearer auth
      get_json "#{me_url}?api_key=#{api_key}" do |response|
        expect(response.status).to(eq(200))

        expect(response.body[:username]).to(eq(@user.username))
      end

      # Access token expiration, should no longer work
      Delorean.jump(2.hours)
      Rake.application.rake_require('tasks/oauth')
      Rake::Task.define_task(:environment)
      Rake::Task['cartodb:oauth:destroy_expired_access_tokens'].invoke

      get_json "#{me_url}?api_key=#{api_key}" do |response|
        expect(response.status).to(eq(401))
      end

      # Get a new acess token using refresh token
      payload = {
        client_id: @oauth_app.client_id,
        client_secret: @oauth_app.client_secret,
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      }
      token_response = post_json oauth_provider_token_url(payload) do |response|
        expect(response.status).to(eq(200))

        response.body
      end

      api_key = token_response[:access_token]
      expect(api_key).to(be)

      get_json "#{me_url}?api_key=#{api_key}" do |response|
        expect(response.status).to(eq(200))

        expect(response.body[:username]).to(eq(@user.username))
      end
    end
  end
end

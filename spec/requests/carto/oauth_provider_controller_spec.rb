require 'spec_helper_min'
require 'carto/oauth_provider_controller'
require 'support/helpers'
require 'helpers/subdomainless_helper'

describe Carto::OauthProviderController do
  include HelperMethods
  include_context 'organization with users helper'

  before(:all) do
    @sequel_developer = create(:valid_user)
    @developer = Carto::User.find(@sequel_developer.id)
    @user = create(:valid_user)
  end

  before(:each) do
    @oauth_app = create(:oauth_app, user: @developer)
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

  def parse_fragment_parameters(uri)
    URI.decode_www_form(Addressable::URI.parse(uri).fragment).to_h
  end

  def parse_query_parameters(uri)
    Addressable::URI.parse(uri).query_values
  end

  def validate_token_response(parameters, access_token, refresh_token = nil)
    expect(parameters[:access_token]).to(eq(access_token.api_key.token))
    expect(parameters[:token_type]).to(eq('Bearer'))
    expect(parameters[:expires_in].to_i).to(be_between(3595, 3600)) # Little margin for slowness
    if refresh_token
      expect(parameters[:refresh_token]).to(eq(refresh_token.token))
    else
      expect(parameters[:refresh_token]).to(be_nil)
    end
    expect(parameters[:user_info_url]).to(include(api_v4_users_me_path, access_token.oauth_app_user.user.username))
  end

  shared_examples_for 'authorization parameter validation' do
    it 'returns a 400 error if application cannot be found' do
      request_endpoint(valid_payload.merge(client_id: 'e'))

      expect(response.status).to(eq(400))
      expect(response.body).to(include('invalid_client'))
    end

    it 'shows an error if invalid response_type' do
      request_endpoint(valid_payload.merge(response_type: 'err'))

      expect(response.status).to(eq(400))
      expect(response.body).to(include('unsupported_response_type'))
    end

    shared_examples_for 'invalid parameter redirections' do
      it 'redirects with an error if missing state' do
        request_endpoint(valid_payload.merge(state: ''))

        expect(response.status).to(eq(302))
        expect(response.location).to(start_with(@oauth_app.redirect_uris.first))
        qs = parse_uri_parameters(response.location)
        expect(qs['error']).to(eq('invalid_request'))
        expect(qs['error_description']).to(eq('The following required params are missing: state'))
      end

      it 'redirects with an error if requesting unknown scopes' do
        request_endpoint(valid_payload.merge(scope: 'invalid wadus'))
        expect(response.status).to(eq(302))
        expect(response.location).to(start_with(@oauth_app.redirect_uris.first))
        expect(response.location).to(include(valid_payload[:state]))
        qs = parse_uri_parameters(response.location)
        expect(qs['error']).to(eq('invalid_scope'))
      end

      it 'redirects with an error if requesting non-existent datasets' do
        request_endpoint(valid_payload.merge(scope: 'datasets:r:blabla'))

        expect(response.status).to(eq(302))
        expect(response.location).to(start_with(@oauth_app.redirect_uris.first))
        expect(response.location).to(include(valid_payload[:state]))
        qs = parse_uri_parameters(response.location)
        expect(qs['error']).to(eq('invalid_scope'))
      end

      it 'redirects with an error if requesting non-existent schemas' do
        request_endpoint(valid_payload.merge(scope: 'schemas:c:blabla'))

        expect(response.status).to(eq(302))
        expect(response.location).to(start_with(@oauth_app.redirect_uris.first))
        expect(response.location).to(include(valid_payload[:state]))
        qs = parse_uri_parameters(response.location)
        expect(qs['error']).to(eq('invalid_scope'))
      end

      it 'redirects with an error if requesting invalid dataset scopes' do
        user_table = create(:carto_user_table, :with_db_table, user_id: @developer.id)
        request_endpoint(valid_payload.merge(scope: "datasets:wtf:#{user_table.name}"))

        expect(response.status).to(eq(302))
        expect(response.location).to(start_with(@oauth_app.redirect_uris.first))
        expect(response.location).to(include(valid_payload[:state]))
        qs = parse_uri_parameters(response.location)
        expect(qs['error']).to(eq('invalid_scope'))
      end

      it 'redirects with an error if requesting invalid schema scopes' do
        request_endpoint(valid_payload.merge(scope: "schemas:wtf:#{@developer.database_schema}"))

        expect(response.status).to(eq(302))
        expect(response.location).to(start_with(@oauth_app.redirect_uris.first))
        expect(response.location).to(include(valid_payload[:state]))
        qs = parse_uri_parameters(response.location)
        expect(qs['error']).to(eq('invalid_scope'))
      end

      it 'redirects with an error if requesting with an invalid redirect_uri' do
        request_endpoint(valid_payload.merge(redirect_uri: 'invalid'))

        expect(response.status).to(eq(302))
        expect(response.location).to(start_with(@oauth_app.redirect_uris.first))
        expect(response.location).to(include(valid_payload[:state]))
        qs = parse_uri_parameters(response.location)
        expect(qs['error']).to(eq('invalid_request'))
        expect(qs['error_description']).to(eq('The redirect_uri must match the redirect_uri param used in the authorization request'))
      end

      describe 'with restricted app' do
        before(:each) do
          @oauth_app.update!(restricted: true)
          @org_authorization = @oauth_app.oauth_app_organizations.create!(organization: @carto_organization, seats: 1)
        end

        it 'redirects with an error if the user is not an organization member' do
          request_endpoint(valid_payload)

          expect(response.status).to(eq(302))
          expect(response.location).to(start_with(@oauth_app.redirect_uris.first))
          qs = parse_uri_parameters(response.location)
          expect(qs['error']).to(eq('access_denied'))
          expect(qs['error_description']).to(eq('User is not part of an organization'))
        end

        it 'succeeds if logged in as a member of an allowed organization' do
          logout
          login_as(@org_user_1, scope: @org_user_1.username)
          request_endpoint(valid_payload)

          expect_success(response)
        end

        it 'redirects with an error if the organization is out of seats for the application' do
          @oauth_app.oauth_app_users.create!(user: @carto_org_user_2)
          logout
          login_as(@org_user_1, scope: @org_user_1.username)
          request_endpoint(valid_payload)

          expect(response.status).to(eq(302))
          expect(response.location).to(start_with(@oauth_app.redirect_uris.first))
          qs = parse_uri_parameters(response.location)
          expect(qs['error']).to(eq('access_denied'))
          expect(qs['error_description']).to(eq('User does not have an available seat to use this application'))
        end
      end
    end

    describe 'with code response' do
      it_behaves_like 'invalid parameter redirections' do
        def parse_uri_parameters(uri)
          parse_query_parameters(uri)
        end
      end
    end

    describe 'with token response' do
      it_behaves_like 'invalid parameter redirections' do
        before(:each) do
          valid_payload[:response_type] = 'token'
        end

        def parse_uri_parameters(uri)
          parse_fragment_parameters(uri)
        end
      end
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

      def expect_success(response)
        expect(response.status).to(eq(200))
      end
    end

    shared_examples_for 'success with response pre-authorized' do
      it 'with valid payload and code response, pre-authorized, redirects back to the application' do
        oau = @oauth_app.oauth_app_users.create!(user_id: @user.id)
        get oauth_provider_authorize_url(valid_payload.merge(response_type: 'code'))

        authorization_code = oau.oauth_authorization_codes.first
        expect(authorization_code).to(be)
        expect(authorization_code.code).to(be_present)

        expect(response.status).to(eq(302))
        expect(parse_query_parameters(response.location)['code']).to(eq(authorization_code.code))
      end

      it 'with valid payload and token response, pre-authorized, redirects back to the application' do
        oau = @oauth_app.oauth_app_users.create!(user_id: @user.id)
        get oauth_provider_authorize_url(valid_payload.merge(response_type: 'token'))

        access_token = oau.oauth_access_tokens.first
        expect(access_token).to(be)
        expect(access_token.api_key).to(be_present)

        expect(response.status).to(eq(302))
        response_parameters = parse_fragment_parameters(response.location)
        validate_token_response(response_parameters.symbolize_keys, access_token)
      end
    end

    describe 'domains and authentication' do
      it 'works with a URL for another username/org' do
        # e.g: org.carto.com/oauth2 should work, even if the correct one is org.carto.com/u/username/oauth2
        stub_domainful('wadus')
        expect(oauth_provider_authorize_url).not_to(include(@user.username))
        get oauth_provider_authorize_url(valid_payload)
        expect(response.status).to(eq(200))
      end

      it 'in subdomainless, should not require username at all' do
        stub_subdomainless
        expect(oauth_provider_authorize_url).not_to(include(@user.username))
        get oauth_provider_authorize_url(valid_payload)
        expect(response.status).to(eq(200))
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

    it 'with valid payload, shows the username in the consent form' do
      get oauth_provider_authorize_url(valid_payload)

      expect(response.status).to(eq(200))
      expect(response.body).to(include(valid_payload[:client_id]))
      expect(response.body).to(include(valid_payload[:state]))
      expect(response.body).to(include("by <strong>#{@oauth_app.user.name_or_username}"))
    end

    it 'with valid payload, does not show the username in the consent form if the oauth_app does not have user' do
      Cartodb::Central.stubs(:api_sync_enabled?).returns(true)
      @oauth_app.update!(user: nil, avoid_sync_central: true)

      get oauth_provider_authorize_url(valid_payload)

      expect(response.status).to(eq(200))
      expect(response.body).to(include(valid_payload[:client_id]))
      expect(response.body).to(include(valid_payload[:state]))
      expect(response.body).to_not(include("by <strong>"))
    end

    it 'with valid payload and datasets scopes shows the consent form' do
      user_table = create(:carto_user_table, :with_db_table, user_id: @developer.id)
      scopes = ["datasets:r:#{user_table.name}", "datasets:metadata"]
      get oauth_provider_authorize_url(valid_payload.merge(scopes: scopes))

      expect(response.status).to(eq(200))
      expect(response.body).to(include(valid_payload[:client_id]))
      expect(response.body).to(include(valid_payload[:state]))
    end

    it 'with valid payload and schemas scopes shows the consent form' do
      user_table = create(:carto_user_table, :with_db_table, user_id: @developer.id)
      get oauth_provider_authorize_url(valid_payload.merge(scopes: "schemas:r:#{user_table.name}"))

      expect(response.status).to(eq(200))
      expect(response.body).to(include(valid_payload[:client_id]))
      expect(response.body).to(include(valid_payload[:state]))
    end

    it 'with valid payload, pre-authorized and requesting more scopes, shows the consent screen' do
      @oauth_app.oauth_app_users.create!(user_id: @user.id)
      get oauth_provider_authorize_url(valid_payload.merge(scope: 'offline'))

      expect(response.status).to(eq(200))
      expect(response.body).to(include(valid_payload[:client_id]))
      expect(response.body).to(include(valid_payload[:state]))
    end

    describe 'with code or token' do
      it_behaves_like 'success with response pre-authorized'
    end

    describe 'with silent flow' do
      before(:each) do
        valid_payload[:response_type] = 'token'
        valid_payload[:prompt] = 'none'
      end

      it_behaves_like 'success with response pre-authorized'

      it 'redirects with invalid request if prompt is not none' do
        get oauth_provider_authorize_url(valid_payload.merge(response_type: 'token', prompt: "wat"))

        expect(response.status).to(eq(302))
        expect(response.body).to(include('invalid_request'))
      end

      it 'redirects with login_required if not logged in and client_id exists' do
        logout
        get oauth_provider_authorize_url(valid_payload)

        expect(response.status).to(eq(302))
        expect(response.body).to(include('login_required'))
      end

      it 'shows consent screen if not logged in and wrong client_id' do
        logout
        get oauth_provider_authorize_url(valid_payload.merge(client_id: 'wrong'))

        expect(response.status).to(eq(400))
        expect(response.body).to(include('Invalid client ID or secret'))
      end

      it 'redirects with access_denied if not authorized' do
        get oauth_provider_authorize_url(valid_payload)

        expect(response.status).to(eq(302))
        expect(response.body).to(include('access_denied'))
      end

      it 'with valid payload, pre-authorized and requesting more scopes redirects with access_denied' do
        @oauth_app.oauth_app_users.create!(user_id: @user.id)
        get oauth_provider_authorize_url(valid_payload.merge(scope: 'offline'))

        expect(response.status).to(eq(302))
        expect(response.body).to(include('access_denied'))
      end
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

      def expect_success(response)
        expect(response.status).to(eq(302))
        expect(response.location).not_to(include('error'))
      end
    end

    context 'without session' do
      before(:each) do
        logout
      end

      context 'with subdomainless' do
        before(:each) do
          stub_subdomainless
        end

        it 'redirects to login with username' do
          endpoint = "http://localhost.lan:53716/user/#{@user.username}/oauth2/authorize"
          expected_url = "http://localhost.lan:53716/user/#{@user.username}/login"

          post endpoint, valid_payload

          expect(response.status).to(eq(302))
          expect(response.location).to eql expected_url
        end

        it 'redirects to login without username' do
          endpoint = "http://localhost.lan:53716/oauth2/authorize"
          expected_url = "http://localhost.lan:53716/login"

          post endpoint, valid_payload

          expect(response.status).to(eq(302))
          expect(response.location).to eql expected_url
        end
      end

      context 'with subdomainful' do
        before(:each) do
          stub_domainful('wadus')
        end

        it 'redirects to login with username' do
          endpoint = "http://wadus.localhost.lan:53716/user/#{@user.username}/oauth2/authorize"
          expected_url = "http://wadus.localhost.lan:53716/login"

          post endpoint, valid_payload

          expect(response.status).to(eq(302))
          expect(response.location).to eql expected_url
        end

        it 'redirects to login without username' do
          endpoint = "http://wadus.localhost.lan:53716/oauth2/authorize"
          expected_url = "http://wadus.localhost.lan:53716/login"

          post endpoint, valid_payload

          expect(response.status).to(eq(302))
          expect(response.location).to eql expected_url
        end
      end
    end

    shared_examples_for 'successfully authorizes' do
      it 'with valid payload, creates an authorization and redirects back to the application with a code' do
        post oauth_provider_authorize_url(valid_payload)

        validate_response(response)
      end

      it 'with valid payload and redirect URIs, creates an authorization and redirects back to the requested URI' do
        @oauth_app.update!(redirect_uris: ['https://domain1', 'https://domain2', 'https://domain3'])

        post oauth_provider_authorize_url(valid_payload.merge(redirect_uri: 'https://domain3'))

        validate_response(response)
        expect(response.location).to(start_with('https://domain3'))
      end

      it 'with valid payload, and a pre-existing grant, upgrades it adding more scopes' do
        oau = @oauth_app.oauth_app_users.create!(user_id: @user.id)
        post oauth_provider_authorize_url(valid_payload.merge(scope: 'dataservices:geocoding'))

        expect(oau.scopes).to(eq([]))
        oau.reload
        expect(oau.scopes).to(eq(['dataservices:geocoding']))

        validate_response(response)
      end

      it 'with client_secret in the payload throws an error' do
        payload = valid_payload.merge(client_secret: 'abcdefgh')
        post oauth_provider_authorize_url(payload)

        expect(response.status).to(eq(302))
        expect(response.body).to(include('invalid_request'))
        expect(response.body).to(include('client_secret'))
      end
    end

    describe 'with code response' do
      it_behaves_like 'successfully authorizes' do
        def validate_response(response)
          authorization_code = @oauth_app.oauth_app_users.find_by_user_id!(@user.id).oauth_authorization_codes.first
          expect(authorization_code).to(be)
          expect(authorization_code.code).to(be_present)

          expect(response.status).to(eq(302))
          expect(parse_query_parameters(response.location)['code']).to(eq(authorization_code.code))
        end
      end
    end

    describe 'with token response' do
      before(:each) do
        valid_payload[:response_type] = 'token'
      end

      it_behaves_like 'successfully authorizes' do
        def validate_response(response)
          access_token = @oauth_app.oauth_app_users.find_by_user_id!(@user.id).oauth_access_tokens.first
          expect(access_token).to(be)
          expect(access_token.api_key).to(be_present)

          expect(response.status).to(eq(302))
          validate_token_response(parse_fragment_parameters(response.location).symbolize_keys, access_token)
        end
      end

      it 'redirects with an error if requesting offline scope' do
        post oauth_provider_authorize_url(valid_payload.merge(scope: 'offline'))

        expect(response.status).to(eq(302))
        expect(response.location).to(start_with(@oauth_app.redirect_uris.first))
        qs = parse_fragment_parameters(response.location)
        expect(qs['error']).to(eq('invalid_scope'))
      end
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
          validate_token_response(response.body, access_token)
        end
      end

      it 'with valid code and offline scope returns an api key and refresh token' do
        @authorization_code.update!(scopes: ['offline'])

        post_json oauth_provider_token_url(auth_code_token_payload) do |response|
          expect(Carto::OauthAuthorizationCode.exists?(@authorization_code.id)).to(be_false)
          access_token = @oauth_app_user.oauth_access_tokens.reload.first
          expect(access_token).to(be)
          refresh_token = @oauth_app_user.oauth_refresh_tokens.find_by_token(response.body[:refresh_token])
          expect(refresh_token).to(be)

          expect(response.status).to(eq(200))
          validate_token_response(response.body, access_token, refresh_token)
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
          validate_token_response(response.body, access_token)
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
          validate_token_response(response.body, access_token, @refresh_token)
        end
      end

      it 'with valid token and explicit scopes returns a restricted api key' do
        post_json oauth_provider_token_url(refresh_token_payload.merge(scope: '')) do |response|
          access_token = @oauth_app_user.oauth_access_tokens.reload.first
          expect(access_token).to(be)
          expect { @refresh_token.reload }.to(change { @refresh_token.token })
          expect(access_token.scopes).to(eq([]))

          expect(response.status).to(eq(200))
          validate_token_response(response.body, access_token, @refresh_token)
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

      it 'with missing refresh_token parameter returns an informative error' do
        payload = refresh_token_payload.except(:refresh_token)
        post_json oauth_provider_token_url(payload) do |response|
          expect(response.status).to(eq(400))
          expect(response.body[:error]).to(eq('invalid_request'))
          expect(response.body[:error_description]).to(include('refresh_token'))
        end
      end
    end

    it 'with missing required parameters returns an informative error' do
      payload = auth_code_token_payload.except(:client_secret).except(:client_id).except(:code)
      post_json oauth_provider_token_url(payload) do |response|
        expect(response.status).to(eq(400))
        expect(response.body[:error]).to(eq('invalid_request'))
        expect(response.body[:error_description]).to(include('client_secret'))
        expect(response.body[:error_description]).to(include('client_id'))
        expect(response.body[:error_description]).to(include('code'))
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

    # Since Capybara+rack passes all requests to the local server, we set a redirect URI inside localhost
    let(:redirect_uri) { "https://#{@user.username}.localhost.lan/redirect" }

    let(:state) { SecureRandom.hex(16) }

    let(:base_uri) { "http://#{@user.username}.localhost.lan" }

    before(:each) do
      @oauth_app.update!(redirect_uris: ['https://fake_uri', redirect_uri])
    end

    def login
      login_as(@user, scope: @user.username)
      begin
        visit "#{base_uri}/login"
      rescue ActionView::MissingTemplate
        # Expected error trying to load dashboard statics
      end
    end

    def request_authorization(response_type, scope)
      visit "#{base_uri}/oauth2/authorize?client_id=#{@oauth_app.client_id}&state=#{state}" \
            "&response_type=#{response_type}&scope=#{scope}&redirect_uri=#{redirect_uri}"

      begin
        click_on 'Accept'
      rescue ActionController::RoutingError
        # Expected error since /redirect is a made up URL
      end
    end

    def test_access_token(token_response, expect_success:)
      # TODO: use bearer auth
      get_json "#{token_response[:user_info_url]}?api_key=#{token_response[:access_token]}" do |response|
        if expect_success
          expect(response.status).to(eq(200))
          expect(response.body[:username]).to(eq(@user.username))
        else
          expect(response.status).to(eq(401))
        end
      end
    end

    it 'following the code flow produces a valid API Key and refresh token to renew it' do
      login

      request_authorization('code', 'offline')

      expect(current_url).to(start_with(redirect_uri))
      response_parameters = parse_query_parameters(current_url)
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

      refresh_token = token_response[:refresh_token]
      expect(refresh_token).to(be)

      # Try to use the access token
      test_access_token(token_response, expect_success: true)

      # Access token expiration, should no longer work
      Delorean.jump(2.hours)
      Rake.application.rake_require('tasks/oauth')
      Rake::Task.define_task(:environment)
      Rake::Task['cartodb:oauth:destroy_expired_access_tokens'].reenable
      Rake::Task['cartodb:oauth:destroy_expired_access_tokens'].invoke

      test_access_token(token_response, expect_success: false)

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

      test_access_token(token_response, expect_success: true)
    end

    it 'following the implicit flow produces a valid API Key' do
      login

      request_authorization('token', '')

      # Capybara driver eats the fragment part of the URL to emulate browsers but we can recover it with some trickery
      redirected_url = Capybara.current_session.driver.response.location
      expect(redirected_url).to(start_with(redirect_uri))
      response_parameters = parse_fragment_parameters(redirected_url)
      expect(response_parameters['state']).to(eq(state))
      expect(response_parameters['refresh_token']).to(be_nil)

      test_access_token(response_parameters.symbolize_keys, expect_success: true)
    end

    it 'will return to oauth flow after login' do
      base_uri = "http://#{@organization.name}.localhost.lan"
      oauth_url = "#{base_uri}/oauth2/authorize?client_id=#{@oauth_app.client_id}&state=123&response_type=code"

      visit oauth_url
      fill_in 'email', with: @org_user_1.email
      fill_in 'password', with: @org_user_1.password
      click_on 'Log in'

      expect(current_url).to(eq(oauth_url))
    end
  end
end

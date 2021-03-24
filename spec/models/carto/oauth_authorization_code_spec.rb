require 'spec_helper_unit'

module Carto
  describe OauthAuthorizationCode do
    describe '#validation' do
      before do
        @user = create(:valid_user)
        @carto_user = Carto::User.find(@user.id)
        @app = build(:oauth_app, user: @carto_user)
        @app_user = OauthAppUser.new(user: @carto_user, oauth_app: @app)
      end

      it 'does not accept invalid scopes' do
        authorization = OauthAuthorizationCode.new(scopes: ['wadus'])
        expect(authorization).to_not(be_valid)
        expect(authorization.errors[:scopes]).to(include("contains unsupported scopes: wadus"))
      end

      it 'validates without redirect_uri and autogenerates code' do
        authorization = OauthAuthorizationCode.new(oauth_app_user: @app_user)
        expect(authorization).to(be_valid)
        expect(authorization.code).to(be_present)
      end

      it 'validates with redirect_uri and autogenerates code' do
        authorization = OauthAuthorizationCode.new(oauth_app_user: @app_user, redirect_uri: ['https://redirect'])
        expect(authorization).to(be_valid)
        expect(authorization.code).to(be_present)
      end
    end

    describe '#exchange!' do
      before do
        @user = create(:valid_user)
        @carto_user = Carto::User.find(@user.id)
        @app = create(:oauth_app, user: @carto_user)
        @app_user = OauthAppUser.create(user: @carto_user, oauth_app: @app)
        @authorization_code = @app_user.oauth_authorization_codes.create!
      end

      it 'fails if the code is expired' do
        @authorization_code.created_at -= 10.minutes
        expect { @authorization_code.exchange! }.to(raise_error(OauthProvider::Errors::InvalidGrant))
        expect(Carto::OauthAuthorizationCode.exists?(@authorization_code.id)).to(be_true)
      end

      it 'creates a new api key and blanks the code' do
        access_token, refresh_token = @authorization_code.exchange!

        expect(Carto::OauthAuthorizationCode.exists?(@authorization_code.id)).to(be_false)
        expect(access_token.api_key).to(be)
        expect(access_token.api_key.type).to(eq('oauth'))
        expect(refresh_token).to(be_nil)
      end

      it 'with offline scope creates a new access token and refresh token' do
        @authorization_code.update!(scopes: ['offline'])

        access_token, refresh_token = @authorization_code.exchange!

        expect(Carto::OauthAuthorizationCode.exists?(@authorization_code.id)).to(be_false)
        expect(access_token.api_key).to(be)
        expect(access_token.api_key.type).to(eq('oauth'))
        expect(refresh_token).to(be)
      end
    end
  end
end

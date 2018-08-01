# encoding: utf-8

require 'spec_helper_min'

module Carto
  describe OauthAuthorization do
    describe '#validation' do
      before(:all) do
        @user = FactoryGirl.build(:carto_user)
        @app = FactoryGirl.build(:oauth_app, user: @user)
        @api_key = FactoryGirl.build(:master_api_key, user: @user)
        @app_user = OauthAppUser.new(user: @user, oauth_app: @app)
      end

      it 'requires code or api_key' do
        authorization = OauthAuthorization.new
        expect(authorization).to_not(be_valid)
        expect(authorization.errors[:api_key]).to(include("must be present if code is missing"))

        authorization.code = ''
        expect(authorization).to_not(be_valid)
        expect(authorization.errors[:api_key]).to(include("must be present if code is missing"))
      end

      it 'redirect_uri cannot be set if api_key is' do
        authorization = OauthAuthorization.new(api_key: @api_key, redirect_uri: '')
        expect(authorization).to_not(be_valid)
        expect(authorization.errors[:redirect_uri]).to(include("must be nil if api_key is present"))
      end

      it 'validates with api_key' do
        authorization = OauthAuthorization.new(oauth_app_user: @app_user, api_key: @api_key)
        expect(authorization).to(be_valid)
      end

      it 'validates with code' do
        authorization = OauthAuthorization.new(oauth_app_user: @app_user, code: 'wadus')
        expect(authorization).to(be_valid)
      end
    end

    describe '#exchange!' do
      before(:all) do
        @user = FactoryGirl.create(:carto_user)
        @app = FactoryGirl.create(:oauth_app, user: @user)
        @app_user = OauthAppUser.create(user: @user, oauth_app: @app)
      end

      after(:all) do
        @app_user.destroy
        @user.destroy
        @app.destroy
      end

      before(:each) do
        @authorization = @app_user.oauth_authorizations.create_with_code!(nil)
      end

      after(:each) do
        @authorization.destroy
      end

      it 'fails if the code is expired' do
        @authorization.created_at -= 10.minutes
        expect { @authorization.exchange! }.to(raise_error(OauthProvider::Errors::InvalidGrant))
        expect(@authorization.code).to(be)
        expect(@authorization.api_key).to(be_nil)
      end

      it 'creates a new api key and blanks the code' do
        @authorization.exchange!
        expect(@authorization.code).to(be_nil)
        expect(@authorization.api_key).to(be)
        expect(@authorization.api_key.type).to(eq('oauth'))
      end
    end
  end
end

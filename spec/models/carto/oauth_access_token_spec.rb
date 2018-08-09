# encoding: utf-8

require 'spec_helper_min'

module Carto
  describe OauthAccessToken do
    describe '#validation' do
      before(:all) do
        @user = FactoryGirl.create(:carto_user)
        @app = FactoryGirl.create(:oauth_app, user: @user)
        @app_user = OauthAppUser.create!(user: @user, oauth_app: @app)
      end

      it 'does not accept invalid scopes' do
        access_token = OauthAccessToken.new(oauth_app_user: @app_user, scopes: ['wadus'])
        expect(access_token).to_not(be_valid)
        expect(access_token.errors[:scopes]).to(include("contains unsuported scopes: wadus"))
      end

      it 'auto generates api_key' do
        access_token = OauthAccessToken.new(oauth_app_user: @app_user)
        expect(access_token).to(be_valid)
        expect(access_token.api_key).to(be)
        expect(access_token.api_key.type).to(eq('oauth'))
      end
    end
  end
end

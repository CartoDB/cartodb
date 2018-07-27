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

      it 'validates with api_key' do
        authorization = OauthAuthorization.new(oauth_app_user: @app_user, api_key: @api_key)
        expect(authorization).to(be_valid)
      end

      it 'validates with code' do
        authorization = OauthAuthorization.new(oauth_app_user: @app_user, code: 'wadus')
        expect(authorization).to(be_valid)
      end
    end
  end
end

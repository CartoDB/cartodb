# encoding: utf-8

require 'spec_helper_min'

module Carto
  describe OauthAppUser do
    describe '#validation' do
      before(:all) do
        @user = FactoryGirl.build(:carto_user)
        @app = FactoryGirl.build(:oauth_app)
        @api_key = FactoryGirl.build(:master_api_key, user: @user)
      end

      it 'requires user' do
        app_user = OauthAppUser.new
        expect(app_user).to_not(be_valid)
        expect(app_user.errors[:user]).to(include("can't be blank"))
      end

      it 'requires oauth app_user' do
        app_user = OauthAppUser.new
        expect(app_user).to_not(be_valid)
        expect(app_user.errors[:oauth_app]).to(include("can't be blank"))
      end

      it 'requires code or api_key' do
        app_user = OauthAppUser.new
        expect(app_user).to_not(be_valid)
        expect(app_user.errors[:api_key]).to(include("must be present if code is missing"))

        app_user.code = ''
        expect(app_user).to_not(be_valid)
        expect(app_user.errors[:api_key]).to(include("must be present if code is missing"))
      end

      it 'requires code and redirection_url to be present at the same time' do
        app_user = OauthAppUser.new(code: 'code')
        expect(app_user).to_not(be_valid)
        expect(app_user.errors[:redirect_url]).to(include("must be present if code is"))

        app_user = OauthAppUser.new(redirect_url: 'something')
        expect(app_user).to_not(be_valid)
        expect(app_user.errors[:code]).to(include("must be present if redirect_url is"))
      end

      it 'must match application redirection URL' do
        app_user = OauthAppUser.new(redirect_url: 'something', oauth_app: @app)
        expect(app_user).to_not(be_valid)
        expect(app_user.errors[:redirect_url]).to(include("is not registered"))
      end

      it 'validates with api_key' do
        app_user = OauthAppUser.new(user: @user, oauth_app: @app, api_key: @api_key)
        expect(app_user).to(be_valid)
      end

      it 'validates with code' do
        app_user = OauthAppUser.new(user: @user, oauth_app: @app, code: 'wadus', redirect_url: @app.redirect_urls.first)
        expect(app_user).to(be_valid)
      end
    end
  end
end

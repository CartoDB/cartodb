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
        expect(access_token.errors[:scopes]).to(include("contains unsupported scopes: wadus"))
      end

      it 'it does accept read datasets scopes' do
        access_token = OauthAccessToken.new(oauth_app_user: @app_user, scopes: ['datasets:r:wadus'])
        expect(access_token).to(be_valid)
      end

      it 'it does accept write datasets scopes' do
        access_token = OauthAccessToken.new(oauth_app_user: @app_user, scopes: ['datasets:w:wadus'])
        expect(access_token).to(be_valid)
      end

      it 'it does accept read and write datasets scopes' do
        access_token = OauthAccessToken.new(oauth_app_user: @app_user, scopes: ['datasets:rw:wadus'])
        expect(access_token).to(be_valid)
      end

      it 'it does not accept invalid datasets scopes' do
        access_token = OauthAccessToken.new(oauth_app_user: @app_user, scopes: ['datasets:f:wadus'])
        expect(access_token).to_not(be_valid)
      end

      it 'auto generates api_key' do
        access_token = OauthAccessToken.create!(oauth_app_user: @app_user)
        expect(access_token.api_key).to(be)
        expect(access_token.api_key.type).to(eq('oauth'))
      end

      it 'api key includes permissions for requested scopes' do
        access_token = OauthAccessToken.create!(oauth_app_user: @app_user,
                                                scopes: ['dataservices:geocoding', 'user:profile'])
        expect(access_token.api_key).to(be)
        expect(access_token.api_key.type).to(eq('oauth'))
        expect(access_token.api_key.grants).to(include(type: 'apis', apis: ['sql']))
        expect(access_token.api_key.grants).to(include(type: 'dataservices', services: ['geocoding']))
        expect(access_token.api_key.grants).to(include(type: 'user', data: ['profile']))
      end

      it 'api key includes permissions for datasets scopes' do
        user_table = FactoryGirl.create(:carto_user_table, :with_db_table, user_id: @user.id)
        expected_grants =
          [
            {
              type: 'apis',
              apis: ['maps', 'sql']
            },
            {
              type: 'database',
              tables: [
                {
                  name: user_table.name,
                  permissions: ['select'],
                  schema: 'public'
                }
              ]
            }
          ]

        access_token = OauthAccessToken.create!(oauth_app_user: @app_user,
                                                scopes: ["datasets:r:#{user_table.name}"])
        expect(access_token.api_key).to(be)
        expect(access_token.api_key.type).to(eq('oauth'))
        expect(access_token.api_key.grants).to(eq(expected_grants))
      end
    end
  end
end

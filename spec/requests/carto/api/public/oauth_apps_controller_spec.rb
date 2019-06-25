require 'spec_helper_min'
require 'support/helpers'

describe Carto::Api::Public::OauthAppsController do
  include_context 'users helper'
  include_context 'organization with users helper'
  include HelperMethods

  describe 'index' do
    context 'regular users' do
      before(:all) do
        @params = { api_key: @user1.api_key, page: 1, per_page: 10 }

        @app1 = FactoryGirl.create(:oauth_app, user_id: @user1.id, name: 'ZZZ', restricted: false)
        @app2 = FactoryGirl.create(:oauth_app, user_id: @user1.id, name: 'ABC', restricted: true)
        @app3 = FactoryGirl.create(:oauth_app, user_id: @user2.id, name: 'ABC', restricted: true)
      end

      after(:all) do
        [@app1, @app2, @app3].each(&:destroy)
      end

      before(:each) do
        host! "#{@user1.username}.localhost.lan"
      end

      it 'returns 401 if there is no authenticated user' do
        get_json api_v4_oauth_apps_index_url do |response|
          expect(response.status).to eq(401)
        end
      end

      it 'returns 200 with the OAuth apps owned by the current user (sort by updated at by default)' do
        get_json api_v4_oauth_apps_index_url(@params) do |response|
          expect(response.status).to eq(200)
          expect(response.body[:total]).to eq 2
          expect(response.body[:count]).to eq 2
          expect(response.body[:result][0][:id]).to eq @app1.id
          expect(response.body[:result][0][:username]).to eq @user1.username
        end
      end

      it 'returns 200 with an empty array if the current user does not have apps' do
        @user3 = FactoryGirl.create(:valid_user)
        host! "#{@user3.username}.localhost.lan"

        get_json api_v4_oauth_apps_index_url(api_key: @user3.api_key) do |response|
          expect(response.status).to eq(200)
          expect(response.body[:total]).to eq 0
          expect(response.body[:count]).to eq 0
          expect(response.body[:result]).to be_empty
        end
      end

      it 'paginates the results' do
        get_json api_v4_oauth_apps_index_url(@params.merge(page: 2, per_page: 1)) do |response|
          expect(response.status).to eq(200)
          expect(response.body[:total]).to eq 2
          expect(response.body[:count]).to eq 1
          expect(response.body[:result][0][:id]).to eq @app2.id
        end
      end

      context 'ordering' do
        it 'orders results by name' do
          get_json api_v4_oauth_apps_index_url(@params.merge(order: 'name')) do |response|
            expect(response.status).to eq(200)
            expect(response.body[:total]).to eq 2
            expect(response.body[:count]).to eq 2
            expect(response.body[:result][0][:id]).to eq @app2.id
            expect(response.body[:result][1][:id]).to eq @app1.id
          end
        end

        it 'orders results by restricted' do
          get_json api_v4_oauth_apps_index_url(@params.merge(order: 'restricted')) do |response|
            expect(response.status).to eq(200)
            expect(response.body[:total]).to eq 2
            expect(response.body[:count]).to eq 2
            expect(response.body[:result][0][:id]).to eq @app1.id
            expect(response.body[:result][1][:id]).to eq @app2.id
          end
        end

        it 'returns 400 if the ordering param is invalid' do
          get_json api_v4_oauth_apps_index_url(@params.merge(order: 'client_secret')) do |response|
            expect(response.status).to eq(400)
            expect(response.body[:errors]).to include "Wrong 'order' parameter value"
          end
        end
      end
    end

    context 'organizational users' do
      before(:all) do
        @params = { page: 1, per_page: 10 }

        @app1 = FactoryGirl.create(:oauth_app, user_id: @org_user_1.id)
        @app2 = FactoryGirl.create(:oauth_app, user_id: @org_user_2.id)
        @app3 = FactoryGirl.create(:oauth_app, user_id: @org_user_owner.id)
      end

      after(:all) do
        [@app1, @app2, @app3].each(&:destroy)
      end

      before(:each) do
        host! "#{@organization.name}.localhost.lan"
      end

      it 'returns all the OAuth apps in the organization for the organization owner' do
        params = @params.merge(api_key: @org_user_owner.api_key, user_domain: @org_user_owner.username)
        get_json api_v4_oauth_apps_index_url(params) do |response|
          expect(response.status).to eq(200)
          expect(response.body[:total]).to eq 3
        end
      end

      it 'returns only the user apps for non owners' do
        params = @params.merge(api_key: @org_user_1.api_key, user_domain: @org_user_1.username)
        get_json api_v4_oauth_apps_index_url(params) do |response|
          expect(response.status).to eq(200)
          expect(response.body[:total]).to eq 1
        end
      end
    end
  end

  describe 'show' do
    before(:all) do
      @app = FactoryGirl.create(:oauth_app, user_id: @user1.id)
      @params = { api_key: @user1.api_key, id: @app.id }
    end

    after(:all) do
      @app.destroy
    end

    before(:each) do
      host! "#{@user1.username}.localhost.lan"
    end

    it 'returns 401 if there is no authenticated user' do
      get_json api_v4_oauth_apps_show_url(id: @app.id) do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns 404 if the app is not found' do
      wrong_id = @user1.id

      get_json api_v4_oauth_apps_show_url(@params.merge(id: wrong_id)) do |response|
        expect(response.status).to eq(404)
        expect(response.body[:errors]).to eq 'Record not found'
      end
    end

    it 'returns 200 with all the info from an OAuth App' do
      get_json api_v4_oauth_apps_show_url(@params) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:id]).to eq @app.id
        expect(response.body[:name]).to eq @app.name
        expect(response.body[:client_secret]).to eq @app.client_secret
        expect(response.body[:username]).to eq @user1.username
        expect(response.body.size).to eq 11
      end
    end
  end

  describe 'create' do
    before(:all) do
      @params = { api_key: @user1.api_key }
      @payload = { name: 'my app', redirect_uris: ['https://example.com'], icon_url: 'https://example.com/icon.png' }
    end

    after(:each) do
      @carto_user1.reload.oauth_apps.each(&:destroy)
    end

    before(:each) do
      host! "#{@user1.username}.localhost.lan"
    end

    it 'returns 401 if there is no authenticated user' do
      post_json api_v4_oauth_apps_create_url, @payload do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns 422 if a required parameter is missing' do
      post_json api_v4_oauth_apps_create_url(@params), @payload.except(:name) do |response|
        expect(response.status).to eq(422)
        expect(response.body[:errors]).to eq ({ name: ["can't be blank"] })
      end
    end

    it 'returns 201 if everything is ok' do
      post_json api_v4_oauth_apps_create_url(@params), @payload do |response|
        expect(response.status).to eq(201)
        expect(response.body[:name]).to eq 'my app'
        expect(@carto_user1.reload.oauth_apps.size).to eq 1
      end
    end
  end

  describe 'update' do
    before(:all) do
      @app = FactoryGirl.create(:oauth_app, user_id: @user1.id)
      @params = { id: @app.id, api_key: @user1.api_key }
      @payload = { name: 'updated name' }
    end

    after(:all) do
      @app.destroy
    end

    before(:each) do
      host! "#{@user1.username}.localhost.lan"
    end

    it 'returns 401 if there is no authenticated user' do
      put_json api_v4_oauth_apps_update_url(id: @app.id), @payload do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns 404 if the app is not found' do
      wrong_id = @user1.id

      put_json api_v4_oauth_apps_update_url(@params.merge(id: wrong_id)), @payload do |response|
        expect(response.status).to eq(404)
        expect(response.body[:errors]).to eq 'Record not found'
      end
    end

    it 'returns 200 if everything is ok' do
      put_json api_v4_oauth_apps_update_url(@params), @payload do |response|
        expect(response.status).to eq(200)
        expect(response.body[:name]).to eq 'updated name'
        expect(@app.reload.name).to eq 'updated name'
      end
    end

    it 'ignores non-editable fields' do
      payload = { client_secret: 'secreto ibérico' }

      put_json api_v4_oauth_apps_update_url(@params), payload do |response|
        expect(response.status).to eq(200)
        expect(@app.reload.client_secret).to_not eq 'secreto ibérico'
      end
    end
  end

  describe 'regenerate_secret' do
    before(:all) do
      @app = FactoryGirl.create(:oauth_app, user_id: @user1.id)
      @params = { id: @app.id, api_key: @user1.api_key }
    end

    after(:all) do
      @app.destroy
    end

    before(:each) do
      host! "#{@user1.username}.localhost.lan"
    end

    it 'returns 401 if there is no authenticated user' do
      put_json api_v4_oauth_apps_regenerate_secret_url(id: @app.id) do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns 404 if the app is not found' do
      wrong_id = @user1.id

      put_json api_v4_oauth_apps_regenerate_secret_url(@params.merge(id: wrong_id)) do |response|
        expect(response.status).to eq(404)
        expect(response.body[:errors]).to eq 'Record not found'
      end
    end

    it 'returns 200 if everything is ok' do
      original_secret = @app.client_secret

      put_json api_v4_oauth_apps_regenerate_secret_url(@params) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:client_secret]).to_not eq original_secret
        expect(@app.reload.client_secret).to_not eq original_secret
      end
    end
  end

  describe 'destroy' do
    before(:each) do
      @app = FactoryGirl.create(:oauth_app, user_id: @user1.id)
      @params = { id: @app.id, api_key: @user1.api_key }
    end

    after(:each) do
      @app.try(:destroy)
    end

    before(:each) do
      host! "#{@user1.username}.localhost.lan"
    end

    it 'returns 401 if there is no authenticated user' do
      delete_json api_v4_oauth_apps_destroy_url(id: @app.id) do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns 404 if the app is not found' do
      wrong_id = @user1.id

      delete_json api_v4_oauth_apps_destroy_url(@params.merge(id: wrong_id)) do |response|
        expect(response.status).to eq(404)
        expect(response.body[:errors]).to eq 'Record not found'
      end
    end

    it 'returns 204 if everything is ok' do
      delete_json api_v4_oauth_apps_destroy_url(@params) do |response|
        expect(response.status).to eq(204)
        expect(@carto_user1.reload.oauth_apps.size).to eq 0
      end
    end
  end
end

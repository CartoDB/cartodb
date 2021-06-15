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

        @app1 = create(:oauth_app, user_id: @user1.id, name: 'ZZZ', restricted: false)
        @app2 = create(:oauth_app, user_id: @user1.id, name: 'ABC', restricted: true)
        @app3 = create(:oauth_app, user_id: @user2.id, name: 'ABC', restricted: true)
      end

      after(:all) do
        [@app1, @app2, @app3].each(&:destroy)
      end

      before(:each) do
        host! "#{@user1.username}.localhost.lan"
      end

      it 'returns 401 if there is no authenticated user' do
        get_json api_v4_oauth_apps_url do |response|
          expect(response.status).to eq(401)
        end
      end

      context 'with engine disabled' do
        before(:each) do
          @user1.engine_enabled = false
          @user1.save
        end

        after(:each) do
          @user1.engine_enabled = true
          @user1.save
        end

        it 'returns 404' do
          get_json api_v4_oauth_apps_url(@params) do |response|
            expect(response.status).to eq(404)
          end
        end
      end

      it 'returns 200 with the OAuth apps owned by the current user (sort by updated at by default)' do
        get_json api_v4_oauth_apps_url(@params) do |response|
          expect(response.status).to eq(200)
          expect(response.body[:total]).to eq 2
          expect(response.body[:count]).to eq 2
          expect(response.body[:result][0][:id]).to eq @app1.id
          expect(response.body[:result][0][:username]).to eq @user1.username
        end
      end

      it 'returns 200 with an empty array if the current user does not have apps' do
        @user3 = create(:valid_user)
        host! "#{@user3.username}.localhost.lan"

        get_json api_v4_oauth_apps_url(api_key: @user3.api_key) do |response|
          expect(response.status).to eq(200)
          expect(response.body[:total]).to eq 0
          expect(response.body[:count]).to eq 0
          expect(response.body[:result]).to be_empty
        end
      end

      context 'pagination' do
        it 'paginates the results' do
          get_json api_v4_oauth_apps_url(@params.merge(page: 2, per_page: 1)) do |response|
            expect(response.status).to eq(200)
            expect(response.body[:total]).to eq 2
            expect(response.body[:count]).to eq 1
            expect(response.body[:result][0][:id]).to eq @app2.id
          end
        end

        it 'returns the expected links' do
          base_url = "http://#{@user1.username}.localhost.lan/api/v4/oauth_apps?api_key=#{@user1.api_key}&format=json"
          get_json api_v4_oauth_apps_url(@params.merge(page: 1, per_page: 1)) do |response|
            expect(response.status).to eq(200)
            expect(response.body[:_links][:first][:href]).to eq "#{base_url}&page=1&per_page=1"
            expect(response.body[:_links][:next][:href]).to eq "#{base_url}&page=2&per_page=1"
            expect(response.body[:_links][:last][:href]).to eq "#{base_url}&page=2&per_page=1"
          end
        end
      end

      context 'ordering' do
        it 'orders results by name' do
          get_json api_v4_oauth_apps_url(@params.merge(order: 'name')) do |response|
            expect(response.status).to eq(200)
            expect(response.body[:total]).to eq 2
            expect(response.body[:count]).to eq 2
            expect(response.body[:result][0][:id]).to eq @app2.id
            expect(response.body[:result][1][:id]).to eq @app1.id
          end
        end

        it 'orders results by restricted' do
          get_json api_v4_oauth_apps_url(@params.merge(order: 'restricted')) do |response|
            expect(response.status).to eq(200)
            expect(response.body[:total]).to eq 2
            expect(response.body[:count]).to eq 2
            expect(response.body[:result][0][:id]).to eq @app1.id
            expect(response.body[:result][1][:id]).to eq @app2.id
          end
        end

        it 'returns 400 if the ordering param is invalid' do
          get_json api_v4_oauth_apps_url(@params.merge(order: 'client_secret')) do |response|
            expect(response.status).to eq(400)
            expect(response.body[:errors]).to include "Wrong 'order' parameter value"
          end
        end
      end
    end

    context 'organizational users' do
      before(:all) do
        @params = { page: 1, per_page: 10 }

        @app1 = create(:oauth_app, user_id: @org_user_1.id)
        @app2 = create(:oauth_app, user_id: @org_user_2.id)
        @app3 = create(:oauth_app, user_id: @org_user_owner.id)
      end

      after(:all) do
        [@app1, @app2, @app3].each(&:destroy)
      end

      before(:each) do
        host! "#{@organization.name}.localhost.lan"
      end

      it 'returns all the OAuth apps in the organization for the organization owner' do
        params = @params.merge(api_key: @org_user_owner.api_key, user_domain: @org_user_owner.username)
        get_json api_v4_oauth_apps_url(params) do |response|
          expect(response.status).to eq(200)
          expect(response.body[:total]).to eq 3
        end
      end

      it 'returns only the user apps for non owners' do
        params = @params.merge(api_key: @org_user_1.api_key, user_domain: @org_user_1.username)
        get_json api_v4_oauth_apps_url(params) do |response|
          expect(response.status).to eq(200)
          expect(response.body[:total]).to eq 1
        end
      end
    end
  end

  describe 'index_granted' do
    before(:all) do
      @params = { api_key: @carto_org_user_1.api_key, page: 1, per_page: 10 }

      @app1 = create(:oauth_app, user_id: @carto_org_user_2.id, name: 'ZZZ', restricted: false)
      @app2 = create(:oauth_app, user_id: @carto_org_user_2.id, name: 'ABC', restricted: true)
      @app3 = create(:oauth_app, user_id: @carto_org_user_2.id)

      Carto::OauthAppUser.create!(user: @carto_org_user_1, oauth_app: @app1, scopes: ['user:profile'])
      Carto::OauthAppUser.create!(user: @carto_org_user_1, oauth_app: @app2)
    end

    after(:all) do
      [@app1, @app2, @app3].each(&:destroy)
    end

    before(:each) do
      host! "#{@carto_org_user_1.username}.localhost.lan"
    end

    it 'returns 401 if there is no authenticated user' do
      get_json api_v4_oauth_apps_index_granted_url do |response|
        expect(response.status).to eq(401)
      end
    end

    context 'with engine disabled' do
      before(:each) do
        @carto_org_user_1.engine_enabled = false
        @carto_org_user_1.save
      end

      after(:each) do
        @carto_org_user_1.engine_enabled = true
        @carto_org_user_1.save
      end

      it 'returns 404' do
        get_json api_v4_oauth_apps_index_granted_url(@params) do |response|
          expect(response.status).to eq(404)
        end
      end
    end

    it 'returns 200 with the OAuth apps granted by the current user and the scopes (sort by updated at by default)' do
      get_json api_v4_oauth_apps_index_granted_url(@params) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:total]).to eq 2
        expect(response.body[:count]).to eq 2
        expect(response.body[:result][0][:id]).to eq @app1.id
        expect(response.body[:result][0][:scopes][0][:description]).to eq 'User and personal data'
        expect(response.body[:result][0][:username]).to be_nil
        expect(response.body[:result][0][:client_secret]).to be_nil
      end
    end

    it 'returns 200 with an empty array if the current user does not have granted apps' do
      host! "#{@carto_org_user_2.username}.localhost.lan"

      get_json api_v4_oauth_apps_index_granted_url(api_key: @carto_org_user_2.api_key) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:total]).to eq 0
        expect(response.body[:count]).to eq 0
        expect(response.body[:result]).to be_empty
      end
    end

    context 'pagination' do
      it 'paginates the results' do
        get_json api_v4_oauth_apps_index_granted_url(@params.merge(page: 2, per_page: 1)) do |response|
          expect(response.status).to eq(200)
          expect(response.body[:total]).to eq 2
          expect(response.body[:count]).to eq 1
          expect(response.body[:result][0][:id]).to eq @app2.id
        end
      end

      it 'returns the expected links' do
        base_url = "http://#{@org_user_1.username}.localhost.lan/api/v4/granted_oauth_apps?"\
                    "api_key=#{@org_user_1.api_key}&format=json"
        get_json api_v4_oauth_apps_index_granted_url(@params.merge(page: 1, per_page: 1)) do |response|
          expect(response.status).to eq(200)
          expect(response.body[:_links][:first][:href]).to eq "#{base_url}&page=1&per_page=1"
          expect(response.body[:_links][:next][:href]).to eq "#{base_url}&page=2&per_page=1"
          expect(response.body[:_links][:last][:href]).to eq "#{base_url}&page=2&per_page=1"
        end
      end
    end

    context 'ordering' do
      it 'orders results by name' do
        get_json api_v4_oauth_apps_index_granted_url(@params.merge(order: 'name')) do |response|
          expect(response.status).to eq(200)
          expect(response.body[:total]).to eq 2
          expect(response.body[:count]).to eq 2
          expect(response.body[:result][0][:id]).to eq @app2.id
          expect(response.body[:result][1][:id]).to eq @app1.id
        end
      end

      it 'orders results by restricted' do
        get_json api_v4_oauth_apps_index_granted_url(@params.merge(order: 'restricted')) do |response|
          expect(response.status).to eq(200)
          expect(response.body[:total]).to eq 2
          expect(response.body[:count]).to eq 2
          expect(response.body[:result][0][:id]).to eq @app1.id
          expect(response.body[:result][1][:id]).to eq @app2.id
        end
      end

      it 'returns 400 if the ordering param is invalid' do
        get_json api_v4_oauth_apps_index_granted_url(@params.merge(order: 'client_secret')) do |response|
          expect(response.status).to eq(400)
          expect(response.body[:errors]).to include "Wrong 'order' parameter value"
        end
      end
    end
  end

  describe 'show' do
    before(:all) do
      @app = create(:oauth_app, user_id: @user1.id)
      @params = { api_key: @user1.api_key, id: @app.id }
    end

    after(:all) do
      @app.destroy
    end

    before(:each) do
      host! "#{@user1.username}.localhost.lan"
    end

    it 'returns 401 if there is no authenticated user' do
      get_json api_v4_oauth_app_url(id: @app.id) do |response|
        expect(response.status).to eq(401)
      end
    end

    context 'with engine disabled' do
      before(:each) do
        @user1.engine_enabled = false
        @user1.save
      end

      after(:each) do
        @user1.engine_enabled = true
        @user1.save
      end

      it 'returns 404' do
        get_json api_v4_oauth_app_url(@params) do |response|
          expect(response.status).to eq(404)
        end
      end
    end

    it 'returns 404 if the app is not found' do
      wrong_id = @user1.id

      get_json api_v4_oauth_app_url(@params.merge(id: wrong_id)) do |response|
        expect(response.status).to eq(404)
        expect(response.body[:errors]).to eq 'Record not found'
      end
    end

    it 'returns 404 if the app is not owned' do
      other_app = create(:oauth_app, user_id: @user2.id)

      get_json api_v4_oauth_app_url(@params.merge(id: other_app.id)) do |response|
        expect(response.status).to eq(404)
      end

      other_app.destroy
    end

    it 'returns 200 with all the info from an OAuth App' do
      get_json api_v4_oauth_app_url(@params) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:id]).to eq @app.id
        expect(response.body[:name]).to eq @app.name
        expect(response.body[:client_secret]).to eq @app.client_secret
        expect(response.body[:username]).to eq @user1.username
        expect(response.body.size).to eq 13
      end
    end
  end

  describe 'create' do
    before(:all) do
      @params = { api_key: @user1.api_key }
      @payload = {
        name: 'my app',
        redirect_uris: ['https://example.com'],
        icon_url: 'https://example.com/icon.png',
        website_url: 'https://example.com'
      }
    end

    after(:each) do
      @carto_user1.reload.oauth_apps.each(&:destroy)
    end

    before(:each) do
      Carto::OauthApp.any_instance.stubs(:sync_with_central?).returns(false)
      host! "#{@user1.username}.localhost.lan"
    end

    it 'returns 401 if there is no authenticated user' do
      post_json api_v4_oauth_apps_url, @payload do |response|
        expect(response.status).to eq(401)
      end
    end

    context 'with engine disabled' do
      before(:each) do
        @user1.engine_enabled = false
        @user1.save
      end

      after(:each) do
        @user1.engine_enabled = true
        @user1.save
      end

      it 'returns 404' do
        post_json api_v4_oauth_apps_url(@params), @payload do |response|
          expect(response.status).to eq(404)
        end
      end
    end

    it 'returns 422 if a required parameter is missing' do
      post_json api_v4_oauth_apps_url(@params), @payload.except(:name) do |response|
        expect(response.status).to eq(422)
        expect(response.body[:errors]).to eq ({ name: ["can't be blank"] })
      end
    end

    it 'returns 201 if everything is ok' do
      post_json api_v4_oauth_apps_url(@params), @payload do |response|
        expect(response.status).to eq(201)
        expect(response.body[:name]).to eq 'my app'
        expect(@carto_user1.reload.oauth_apps.size).to eq 1
      end
    end
  end

  describe 'update' do
    context 'regular users' do
      before(:all) do
        @app = create(:oauth_app, user_id: @user1.id)
        @params = { id: @app.id, api_key: @user1.api_key }
        @payload = { name: 'updated name' }
      end

      after(:all) do
        @app.destroy
      end

      before(:each) do
        Carto::OauthApp.any_instance.stubs(:sync_with_central?).returns(false)
        host! "#{@user1.username}.localhost.lan"
      end

      it 'returns 401 if there is no authenticated user' do
        put_json api_v4_oauth_app_url(id: @app.id), @payload do |response|
          expect(response.status).to eq(401)
        end
      end

      context 'with engine disabled' do
        before(:each) do
          @user1.engine_enabled = false
          @user1.save
        end

        after(:each) do
          @user1.engine_enabled = true
          @user1.save
        end

        it 'returns 404' do
          put_json api_v4_oauth_app_url(@params), @payload do |response|
            expect(response.status).to eq(404)
          end
        end
      end

      it 'returns 404 if the app is not found' do
        wrong_id = @user1.id

        put_json api_v4_oauth_app_url(@params.merge(id: wrong_id)), @payload do |response|
          expect(response.status).to eq(404)
          expect(response.body[:errors]).to eq 'Record not found'
        end
      end

      it 'returns 404 if the app is not owned' do
        other_app = create(:oauth_app, user_id: @user2.id)

        put_json api_v4_oauth_app_url(@params.merge(id: other_app.id)) do |response|
          expect(response.status).to eq(404)
        end

        other_app.destroy
      end

      it 'returns 200 if everything is ok' do
        put_json api_v4_oauth_app_url(@params), @payload do |response|
          expect(response.status).to eq(200)
          expect(response.body[:name]).to eq 'updated name'
          expect(@app.reload.name).to eq 'updated name'
        end
      end

      it 'ignores non-editable fields' do
        payload = { client_secret: 'secreto ibérico' }

        put_json api_v4_oauth_app_url(@params), payload do |response|
          expect(response.status).to eq(200)
          expect(@app.reload.client_secret).to_not eq 'secreto ibérico'
        end
      end
    end

    context 'organizational users' do
      before(:all) do
        @app = create(:oauth_app, user_id: @org_user_1.id)
        @params = { id: @app.id, api_key: @org_user_owner.api_key, user_domain: @org_user_owner.username }
        @payload = { name: 'updated name' }
      end

      after(:all) do
        @app.destroy
      end

      before(:each) do
        Carto::OauthApp.any_instance.stubs(:sync_with_central?).returns(false)
        host! "#{@organization.name}.localhost.lan"
      end

      it 'allows the admin to update any app from the organization' do
        put_json api_v4_oauth_app_url(@params), @payload do |response|
          expect(response.status).to eq(200)
          expect(response.body[:name]).to eq 'updated name'
          expect(@app.reload.name).to eq 'updated name'
        end
      end
    end
  end

  describe 'regenerate_secret' do
    before(:all) do
      @app = create(:oauth_app, user_id: @user1.id)
      @params = { id: @app.id, api_key: @user1.api_key }
    end

    after(:all) do
      @app.destroy
    end

    before(:each) do
      Carto::OauthApp.any_instance.stubs(:sync_with_central?).returns(false)
      host! "#{@user1.username}.localhost.lan"
    end

    it 'returns 401 if there is no authenticated user' do
      post_json api_v4_oauth_apps_regenerate_secret_url(id: @app.id) do |response|
        expect(response.status).to eq(401)
      end
    end

    context 'with engine disabled' do
      before(:each) do
        @user1.engine_enabled = false
        @user1.save
      end

      after(:each) do
        @user1.engine_enabled = true
        @user1.save
      end

      it 'returns 404' do
        post_json api_v4_oauth_apps_regenerate_secret_url(@params) do |response|
          expect(response.status).to eq(404)
        end
      end
    end

    it 'returns 404 if the app is not found' do
      wrong_id = @user1.id

      post_json api_v4_oauth_apps_regenerate_secret_url(@params.merge(id: wrong_id)) do |response|
        expect(response.status).to eq(404)
        expect(response.body[:errors]).to eq 'Record not found'
      end
    end

    it 'returns 404 if the app is not owned' do
      other_app = create(:oauth_app, user_id: @user2.id)

      post_json api_v4_oauth_apps_regenerate_secret_url(@params.merge(id: other_app.id)) do |response|
        expect(response.status).to eq(404)
      end

      other_app.destroy
    end

    it 'returns 200 if everything is ok' do
      original_secret = @app.client_secret

      post_json api_v4_oauth_apps_regenerate_secret_url(@params) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:client_secret]).to_not eq original_secret
        expect(@app.reload.client_secret).to_not eq original_secret
      end
    end
  end

  describe 'destroy' do
    before(:each) do
      Carto::OauthAppUser.any_instance.stubs(:reassign_owners).returns(true)
      Carto::OauthAppUser.any_instance.stubs(:drop_roles).returns(true)
      @app = create(:oauth_app, user_id: @user1.id)
      @params = { id: @app.id, api_key: @user1.api_key }
    end

    after(:each) do
      ::Resque.unstub(:enqueue)
      @app.try(:destroy)
      Carto::OauthAppUser.any_instance.unstub(:reassign_owners)
      Carto::OauthAppUser.any_instance.unstub(:drop_roles)
    end

    before(:each) do
      Carto::OauthApp.any_instance.stubs(:sync_with_central?).returns(false)
      host! "#{@user1.username}.localhost.lan"
    end

    it 'returns 401 if there is no authenticated user' do
      delete_json api_v4_oauth_app_url(id: @app.id) do |response|
        expect(response.status).to eq(401)
      end
    end

    context 'with engine disabled' do
      before(:each) do
        @user1.engine_enabled = false
        @user1.save
      end

      after(:each) do
        @user1.engine_enabled = true
        @user1.save
      end

      it 'returns 404' do
        delete_json api_v4_oauth_app_url(@params) do |response|
          expect(response.status).to eq(404)
        end
      end
    end

    it 'returns 404 if the app is not found' do
      wrong_id = @user1.id

      delete_json api_v4_oauth_app_url(@params.merge(id: wrong_id)) do |response|
        expect(response.status).to eq(404)
        expect(response.body[:errors]).to eq 'Record not found'
      end
    end

    it 'returns 404 if the app is not owned' do
      other_app = create(:oauth_app, user_id: @user2.id)

      delete_json api_v4_oauth_app_url(@params.merge(id: other_app.id)) do |response|
        expect(response.status).to eq(404)
      end

      other_app.destroy
    end

    it 'returns 204 if everything is ok' do
      delete_json api_v4_oauth_app_url(@params) do |response|
        expect(response.status).to eq(204)
        expect(@carto_user1.reload.oauth_apps.size).to eq 0
      end
    end

    it 'sends notification if everything is ok' do
      @app_user = Carto::OauthAppUser.create!(user_id: @app.user.id, oauth_app: @app)
      ::Resque.expects(:enqueue)
              .with(::Resque::UserJobs::Notifications::Send, [@app_user.user.id], anything)
              .once
      delete_json api_v4_oauth_app_url(@params) do |response|
        expect(response.status).to eq(204)
        expect(@carto_user1.reload.oauth_apps.size).to eq 0
      end
    end

    it 'does not send notification if no users' do
      ::Resque.expects(:enqueue)
              .with(::Resque::UserJobs::Notifications::Send, anything, anything)
              .never
      delete_json api_v4_oauth_app_url(@params) do |response|
        expect(response.status).to eq(204)
        expect(@carto_user1.reload.oauth_apps.size).to eq 0
      end
    end

    it 'returns server error on error in notification when destroying app with users' do
      @app_user = Carto::OauthAppUser.create!(user_id: @app.user.id, oauth_app: @app)
      ::Resque.stubs(:enqueue).raises('unknown error')
      delete_json api_v4_oauth_app_url(@params) do |response|
        expect(response.status).to eq(500)
        expect(@carto_user1.reload.oauth_apps.size).to eq 1
      end
    end
  end

  describe 'revoke' do
    before(:each) do
      @app = create(:oauth_app, user_id: @carto_org_user_2.id)
      @oauth_app_user = Carto::OauthAppUser.create!(user: @carto_org_user_1, oauth_app: @app)

      @params = { id: @app.id, api_key: @carto_org_user_1.api_key }
    end

    after(:each) do
      @app.try(:destroy)
    end

    before(:each) do
      Carto::OauthApp.any_instance.stubs(:sync_with_central?).returns(false)
      host! "#{@carto_org_user_1.username}.localhost.lan"
    end

    it 'returns 401 if there is no authenticated user' do
      post_json api_v4_oauth_apps_revoke_url(id: @app.id) do |response|
        expect(response.status).to eq(401)
      end
    end

    context 'with engine disabled' do
      before(:each) do
        @carto_org_user_1.engine_enabled = false
        @carto_org_user_1.save
      end

      after(:each) do
        @carto_org_user_1.engine_enabled = true
        @carto_org_user_1.save
      end

      it 'returns 404' do
        post_json api_v4_oauth_apps_revoke_url(@params) do |response|
          expect(response.status).to eq(404)
        end
      end
    end

    it 'returns 404 if the app is not found' do
      wrong_id = @user1.id

      post_json api_v4_oauth_apps_revoke_url(@params.merge(id: wrong_id)) do |response|
        expect(response.status).to eq(404)
        expect(response.body[:errors]).to eq 'Record not found'
      end
    end

    it 'returns 404 if the app is not granted' do
      @carto_org_user_1.granted_oauth_apps.each(&:destroy)

      post_json api_v4_oauth_apps_revoke_url(@params) do |response|
        expect(response.status).to eq(404)
        expect(response.body[:errors]).to eq 'Record not found'
      end
    end

    it 'returns 204 if role does not exist when reassigning' do
      Carto::OauthAppUser.any_instance.stubs(:dataset_role_name).returns('wrong')

      post_json api_v4_oauth_apps_revoke_url(@params) do |response|
        expect(response.status).to eq(204)
      end

      Carto::OauthAppUser.any_instance.unstub(:dataset_role_name)
    end

    it 'returns 500 role does not exist when reassigning' do
      mock = OpenStruct.new
      mock.stubs(:execute).raises(ActiveRecord::StatementInvalid, 'Error reassigning owners')
      Carto::User.any_instance.stubs(:in_database).returns(mock)

      post_json api_v4_oauth_apps_revoke_url(@params) do |response|
        expect(response.status).to eq(500)
        expect(response.body[:errors]).to include 'Error reassigning owners'
      end

      Carto::OauthAppUser.any_instance.unstub(:dataset_role_name)
      Carto::User.any_instance.unstub(:in_database)
    end

    it 'returns 204 if everything is ok' do
      expect(@carto_org_user_1.reload.granted_oauth_apps.size).to eq 1

      post_json api_v4_oauth_apps_revoke_url(@params) do |response|
        expect(response.status).to eq(204)
        expect(@carto_org_user_1.reload.granted_oauth_apps.size).to eq 0
      end
    end
  end
end

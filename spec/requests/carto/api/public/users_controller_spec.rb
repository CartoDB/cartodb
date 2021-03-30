require 'spec_helper_min'
require 'support/helpers'

describe Carto::Api::Public::UsersController do
  include Warden::Test::Helpers
  include HelperMethods

  before(:all) do
    @user = create(:valid_user)
    @org = create(:organization_with_users)
    @org_user = create(:valid_user, name: 'wa', last_name: 'dus', organization: @org)
  end

  before(:each) do
    host! "#{@user.username}.localhost.lan"
  end

  after(:all) do
    @user.destroy
    @org_user.destroy
    @org.destroy
  end

  describe '#me_public' do
    it 'works with master api_key' do
      get_json api_v4_users_me_url(api_key: @user.api_key) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:username]).to eq(@user.username)
      end
    end

    it 'works with regular api_key' do
      api_key = create(:oauth_api_key, user_id: @user.id)

      get_json api_v4_users_me_url(api_key: api_key.token) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:username]).to eq(@user.username)
      end
    end

    it 'return 401 without api_key' do
      get_json api_v4_users_me_url do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'return 401 with cookie auth' do
      login_as(@user, scope: @user.username)
      get_json api_v4_users_me_url do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns user public profile with user:profile grants' do
      host! "#{@org_user.username}.localhost.lan"
      api_key = create(:oauth_api_key_user_profile_grant, user_id: @org_user.id)

      get_json api_v4_users_me_url(api_key: api_key.token) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:username]).to eq(@org_user.username)
        expect(response.body[:organization][:name]).to eq(@org_user.organization.name)
        expect(response.body[:first_name]).to eq(@org_user.name)
        expect(response.body[:last_name]).to eq(@org_user.last_name)
        expect(response.body[:avatar_url]).to eq(@org_user.avatar_url)
        expect(response.body[:organization][:owner][:username]).to eq(@org_user.organization.owner.username)
      end
    end

    it 'does not return user public profile without user:profile grants' do
      host! "#{@org_user.username}.localhost.lan"
      api_key = create(:oauth_api_key, user_id: @org_user.id)

      get_json api_v4_users_me_url(api_key: api_key.token) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:username]).to eq(@org_user.username)
        expect(response.body[:organization][:name]).to eq(@org_user.organization.name)
        expect(response.body[:first_name]).to be_nil
        expect(response.body[:last_name]).to be_nil
        expect(response.body[:avatar_url]).to be_nil
        expect(response.body[:organization][:owner]).to be_nil
      end
    end
  end
end

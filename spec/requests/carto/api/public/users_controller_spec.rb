require 'spec_helper_min'
require 'support/helpers'

describe Carto::Api::Public::UsersController do
  include Warden::Test::Helpers
  include HelperMethods

  before(:all) do
    @user = FactoryGirl.create(:valid_user)
  end

  before(:each) do
    host! "#{@user.username}.localhost.lan"
  end

  after(:all) do
    @user.destroy
  end

  describe '#me_public' do
    it 'works with master api_key' do
      get_json api_v4_users_me_url(api_key: @user.api_key) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:username]).to eq(@user.username)
      end
    end

    it 'works with regular api_key' do
      api_key = FactoryGirl.create(:oauth_api_key, user_id: @user.id)

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
  end
end

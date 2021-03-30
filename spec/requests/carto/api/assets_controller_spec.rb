require_relative '../../../spec_helper'
require_relative '../../../../app/controllers/carto/api/assets_controller'

describe Carto::Api::AssetsController do
  describe '#show legacy tests' do
    before(:all) do
      @user = create_user
    end

    before(:each) do
      bypass_named_maps
      delete_user_data @user
      host! "#{@user.username}.localhost.lan"
    end

    after(:all) do
      bypass_named_maps
      @user.destroy
    end

    let(:params) { { api_key: @user.api_key } }

    it "gets all assets" do
      get_json(api_v1_users_assets_index_url(user_id: @user), params) do |response|
        response.status.should be_success
        response.body[:assets].size.should == 0
      end

      3.times { create(:asset, user_id: @user.id) }

      get_json(api_v1_users_assets_index_url(user_id: @user), params) do |response|
        response.status.should be_success
        response.body[:assets].size.should == 3
      end
    end
  end
end

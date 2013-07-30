# coding: UTF-8

require 'spec_helper'

describe "Assets API" do

  before(:all) do
    @user = create_user(:username => 'test', :email => "client@example.com", :password => "clientex")
    @user.set_map_key
    AWS.stub! # Live S3 requests tested on the model spec
  end

  before(:each) do
    delete_user_data @user
    host! 'test.localhost.lan'
  end

  let(:params) { { :api_key => @user.get_map_key } }

  it "creates a new asset" do
    post_json v1_user_assets_url(@user, params.merge(
      :file => Rack::Test::UploadedFile.new(Rails.root.join('spec/support/data/cartofante_blue.png'), 'image/png').path)
    ) do |response|
      response.status.should be_success
      @user.reload
      @user.assets.count.should == 1
      asset = @user.assets.first
      asset.public_url.should include("test/test/assets/cartofante_blue")
    end
  end

  it "gets all assets" do
    3.times { FactoryGirl.create(:asset, user_id: @user.id) }

    get_json v1_user_assets_url(@user, params) do |response|
      response.status.should be_success
      response.body[:assets].size.should == 3
    end
  end

  it "deletes an asset" do
    FactoryGirl.create(:asset, user_id: @user.id)
    @user.reload
    delete_json v1_user_asset_url(@user, @user.assets.first, params) do |response|
      response.status.should be_success
      @user.reload
      @user.assets.count.should == 0
    end
  end
end

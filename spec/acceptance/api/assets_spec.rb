# coding: UTF-8

require File.expand_path(File.dirname(__FILE__) + '/../acceptance_helper')

feature "API 1.0 assets management" do

  before(:all) do
    Capybara.current_driver = :rack_test
    @user  = create_user({:username => 'test'})
    AWS.stub! # Live S3 requests tested on the model spec
  end

  before(:each) do
    delete_user_data @user
  end

  scenario "Create a new asset" do
    post v1_user_assets_url(@user, host: 'test.localhost.lan'), 
      :file => Rack::Test::UploadedFile.new(Rails.root.join('db/fake_data/column_number_to_boolean.csv'), 'text/csv'), 
      :api_key => api_key

    response.status.should be_success
    @user.reload
    @user.assets.count.should == 1
    asset = @user.assets.first
    asset.public_url.should == "https://s3.amazonaws.com/tile_assets_devel/user/#{@user.id}/assets/column_number_to_boolean.csv"
  end

  scenario "Get all assets" do
    3.times { FactoryGirl.create(:asset, user_id: @user.id) }

    get_json v1_user_assets_url(@user, host: 'test.localhost.lan', api_key: api_key) do |response|
      response.status.should be_success
      response.body[:assets].size.should == 3
    end
  end

  scenario "Delete an asset" do
    FactoryGirl.create(:asset, user_id: @user.id)
    @user.reload
    delete_json v1_user_asset_url(@user, @user.assets.first, host: 'test.localhost.lan', api_key: api_key) do |response|
      response.status.should be_success
      @user.reload
      @user.assets.count.should == 0
    end
  end
end

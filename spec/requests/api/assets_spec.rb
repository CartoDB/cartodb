# coding: UTF-8

require 'spec_helper'

describe "Assets API" do

  before(:each) do
    @user = FactoryGirl.create(:valid_user)

    delete_user_data @user
    host! "#{@user.username}.localhost.lan"
  end

  after(:each) do
    @user.destroy
  end

  let(:params) { { :api_key => @user.api_key } }

  it 'creates a new asset' do
    Asset.any_instance.stubs('use_s3?').returns(false)

    file_path = Rails.root.join('spec', 'support', 'data', 'cartofante_blue.png')
    if File.exist?(file_path) && File.file?(file_path)
      uploaded_file = Rack::Test::UploadedFile.new(file_path, 'image/png')

      post_json(
        api_v1_users_assets_create_url(user_id: @user),
        params.merge(kind: 'wadus', filename: uploaded_file.path)
      ) do |response|
        response.status.should be_success
        response.body[:public_url].should =~ /\/test\/#{@user.username}\/assets\/\d+cartofante_blue/
        URI(response.body[:public_url]).should be_absolute
        response.body[:kind].should == 'wadus'
        @user.reload
        @user.assets.count.should == 1
        asset = @user.assets.first
        asset.public_url.should =~ /\/test\/#{@user.username}\/assets\/\d+cartofante_blue/
        asset.kind.should == 'wadus'
      end
    else
      pending("Required spec asset '#{file_path}' not found, test can't properly execute")
    end
  end

  it 'creates a new asset with spaces in name' do
    Asset.any_instance.stubs('use_s3?').returns(false)

    file_path = Rails.root.join('spec', 'support', 'data', 'cartofante blue.png')
    if File.exist?(file_path) && File.file?(file_path)
      uploaded_file = Rack::Test::UploadedFile.new(file_path, 'image/png')

      post_json(
        api_v1_users_assets_create_url(user_id: @user),
        params.merge(kind: 'wadus', filename: uploaded_file.path)
      ) do |response|
        response.status.should be_success
        response.body[:public_url].should =~ /\/test\/#{@user.username}\/assets\/\d+cartofante%20blue/
        URI(response.body[:public_url]).should be_absolute
        response.body[:kind].should == 'wadus'
        @user.reload
        @user.assets.count.should == 1
        asset = @user.assets.first
        asset.public_url.should =~ /\/test\/#{@user.username}\/assets\/\d+cartofante%20blue/
        asset.kind.should == 'wadus'
      end
    else
      pending("Required spec asset '#{file_path}' not found, test can't properly execute")
    end
  end

  it "returns some error message when the asset creation fails" do
    pending "Fix this test, sometimes fails"
    Asset.any_instance.stubs(:s3_bucket).raises("AWS exception")
    post_json(api_v1_users_assets_create_url(user_id: @user), params.merge(
      :filename => Rack::Test::UploadedFile.new(Rails.root.join('spec/support/data/cartofante_blue.png'), 'image/png').path)
    ) do |response|
      response.status.should == 400
      response.body[:error].should == ["AWS exception"]
    end
  end

  it "finds image file extension" do
    asset = FactoryGirl.create(:asset, user_id: @user.id)

    Asset::VALID_EXTENSIONS.each do |extension|
      asset_name = "cartofante" + extension
      asset.stubs(:asset_file).returns(asset_name)
      asset.asset_file_extension.should == extension
    end
  end

  it "detects incorrect image file extension" do
    asset = FactoryGirl.create(:asset, user_id: @user.id)
    asset.stubs(:asset_file).returns("cartofante.gifv")
    asset.asset_file_extension.should == nil
  end

  it "deletes an asset" do
    Asset.any_instance.stubs('use_s3?').returns(false)

    FactoryGirl.create(:asset, user_id: @user.id)
    @user.reload
    delete_json(api_v1_users_assets_destroy_url(user_id: @user.id, id: @user.assets.first.id), params) do |response|
      response.body.should == {}
      response.status.should be_success
      @user.reload
      @user.assets.count.should == 0
    end
  end

end

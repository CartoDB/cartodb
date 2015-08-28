# coding: UTF-8

require 'spec_helper'

describe "Assets API" do

  before(:all) do
    AWS.stub!
  end

  before(:each) do
    delete_user_data $user_1
    host! "#{$user_1.username}.localhost.lan"
  end

  let(:params) { { :api_key => $user_1.api_key } }

  it 'creates a new asset' do
    Asset.any_instance.stubs('use_s3?').returns(false)

    file_path = Rails.root.join('spec', 'support','data', 'cartofante_blue.png')
    if File.exist?(file_path) && File.file?(file_path)
      uploaded_file = Rack::Test::UploadedFile.new(file_path, 'image/png')

      post_json(api_v1_users_assets_create_url(user_id: $user_1), params.merge(
        kind: 'wadus',
        filename: uploaded_file.path)
      ) do |response|
        response.status.should be_success
        response.body[:public_url].should =~ /\/test\/#{$user_1.username}\/assets\/\d+cartofante_blue/
        response.body[:kind].should == 'wadus'
        $user_1.reload
        $user_1.assets.count.should == 1
        asset = $user_1.assets.first
        asset.public_url.should =~ /\/test\/#{$user_1.username}\/assets\/\d+cartofante_blue/
        asset.kind.should == 'wadus'
      end
    else
      pending("Required spec asset '#{file_path}' not found, test can't properly execute")
    end
  end

  it "returns some error message when the asset creation fails" do
    pending "Fix this test, sometimes fails"
    Asset.any_instance.stubs(:s3_bucket).raises("AWS exception")
    post_json(api_v1_users_assets_create_url(user_id: $user_1), params.merge(
      :filename => Rack::Test::UploadedFile.new(Rails.root.join('spec/support/data/cartofante_blue.png'), 'image/png').path)
    ) do |response|
      response.status.should == 400
      response.body[:error].should == ["AWS exception"]
    end
  end

  it "deletes an asset" do
    FactoryGirl.create(:asset, user_id: $user_1.id)
    $user_1.reload
    delete_json(api_v1_users_assets_destroy_url(user_id: $user_1.id, id: $user_1.assets.first.id), params) do |response|
      response.status.should be_success
      $user_1.reload
      $user_1.assets.count.should == 0
    end
  end

end

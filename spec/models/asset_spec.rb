require 'spec_helper'

describe Asset do
  before(:all) do
    @user = create_user(:username => 'test', :email => "client@example.com", :password => "clientex")
  end

  it 'should upload the asset_file to s3 passing a full path' do
    asset = Asset.create user_id: @user.id, asset_file: (Rails.root + 'db/fake_data/simple.json').to_s
    
    asset.public_url.should == "https://s3.amazonaws.com/tile_assets_devel/user/#{@user.id}/assets/simple.json"
    path = "#{asset.asset_path}simple.json"
    bucket = asset.s3_bucket
    bucket.objects[path].exists?.should == true
  end

  it 'should upload the asset_file to s3 passing an uploaded file' do
    asset = Asset.create user_id: @user.id, asset_file: Rack::Test::UploadedFile.new(Rails.root.join('db/fake_data/column_number_to_boolean.csv'), 'text/csv')
    
    asset.public_url.should == "https://s3.amazonaws.com/tile_assets_devel/user/#{@user.id}/assets/simple.json"
    path = "#{asset.asset_path}simple.json"
    bucket = asset.s3_bucket
    bucket.objects[path].exists?.should == true
  end

  it 'should remove attachments from s3 after deletion' do
    asset = Asset.create user_id: @user.id, asset_file: (Rails.root + 'db/fake_data/simple.json').to_s
    path = "#{asset.asset_path}simple.json"
    bucket = asset.s3_bucket

    bucket.objects[path].exists?.should == true
    asset.destroy
    expect { bucket.objects[path].exists? }.to raise_error(AWS::Errors::Base)
  end

  it 'should validate asset_file before saving' do
    asset = Asset.new user_id: @user.id, asset_file: (Rails.root + 'db/fake_data/i_dont_exist.json').to_s
    
    expect { asset.save }.to raise_error(Sequel::ValidationFailed)
    asset.errors.full_messages.should == ["asset_file is invalid"]
  end

  it 'should correctly return public values' do
    asset = Asset.new user_id: @user.id, asset_file: (Rails.root + 'db/fake_data/simple.json').to_s

    asset.public_values.should == { "public_url" => nil, "user_id" => @user.id, "id" => nil }
  end
end

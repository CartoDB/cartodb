#encoding: UTF-8

require 'spec_helper'

describe Asset do

  before(:all) do
    @user = create_user(:username => 'test', :email => "client@example.com", :password => "clientex")
  end

  it 'should upload the asset_file to s3 passing a full path' do
    asset = Asset.create user_id: @user.id, asset_file: (Rails.root + 'db/fake_data/simple.json').to_s
    
    asset.public_url.should =~ /.*test\/#{@user.username}\/assets\/\d+simple\.json.*/
    path = "#{asset.asset_path}simple.json"
    bucket = asset.s3_bucket
    bucket.objects[path].exists?.should == true
  end

  it 'should upload the asset_file to s3 passing an uploaded file' do
    asset = Asset.create user_id: @user.id, asset_file: Rack::Test::UploadedFile.new(Rails.root.join('db/fake_data/column_number_to_boolean.csv'), 'text/csv')
    
    asset.public_url.should =~ /.*test\/#{@user.username}\/assets\/\d+column_number_to_boolean.csv.*/
    path = "#{asset.asset_path}column_number_to_boolean.csv"
    bucket = asset.s3_bucket
    bucket.objects[path].exists?.should == true
  end

  it 'should save the public_url when specified' do
    file = Rails.root.join('spec/support/data/cartofante_blue.png')
    serve_file file do |url|
      asset = Asset.create(user_id: @user.id, public_url: url)
      
      asset.public_url.should == url
    end
  end

  it 'should download url contents and upload to S3' do
    file = Rails.root.join('spec/support/data/cartofante_blue.png')
    serve_file file do |url|
      asset = Asset.create(user_id: @user.id, url: url)
      
      asset.public_url.should =~ /\/test\/test\/assets\/\d+cartofante_blue\.png/
    end
  end

  it 'should return an error when trying to download an invalid url' do
    asset = Asset.new user_id: @user.id, url: "http://foo"
    
    expect { asset.save }.to raise_error(Sequel::ValidationFailed)
    asset.errors.full_messages.should == ["url is invalid"]
  end

  pending 'should remove attachments from s3 after deletion' do
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
    asset.errors.full_messages.should == ["file is invalid"]
  end

  it 'should correctly return public values' do
    asset = Asset.new user_id: @user.id, asset_file: (Rails.root + 'db/fake_data/simple.json').to_s

    asset.public_values.should == { "public_url" => nil, "user_id" => @user.id, "id" => nil, "kind" => nil }
  end

  it 'should not allow a user to upload files bigger than 5Mb' do
    asset = Asset.new user_id: @user.id, asset_file: (Rails.root + 'spec/support/data/GLOBAL_ELEVATION_SIMPLE.zip').to_s

    expect { asset.save }.to raise_error(Sequel::ValidationFailed)
    asset.errors.full_messages.should == ["file is too big, 5Mb max"]
  end
end

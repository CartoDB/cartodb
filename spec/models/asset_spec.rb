#encoding: UTF-8

require 'spec_helper'

describe Asset do

  before(:all) do 
    @user = create_user username: 'test'
  end

  after(:all) do
    stub_named_maps_calls
    @user.destroy
  end

  describe '#validate' do
    it 'validates user_id' do
      asset = Asset.new
      asset.valid?.should be_false
      asset.errors.full_messages.should include("user_id can't be blank")
    end

    it 'validates file existence' do
      asset = Asset.new user_id: @user.id, asset_file: (Rails.root + 'db/fake_data/i_dont_exist.json').to_s
      asset.valid?.should be_false
      asset.errors.full_messages.should include("file is invalid")
    end

    it 'validates file size' do
      asset = Asset.new user_id: @user.id, asset_file: (Rails.root + 'spec/support/data/GLOBAL_ELEVATION_SIMPLE.zip').to_s
      asset.valid?.should be_false
      asset.errors.full_messages.should include("file is too big, 5Mb max")
    end

    it 'validates file dimensions' do
      asset = Asset.new user_id: @user.id, asset_file: (Rails.root + 'spec/support/data/images/1025x1.jpg').to_s
      asset.valid?.should be_false
      asset.errors.full_messages.should include("file is too big, 1024x1024 max")
    end

    it 'validates urls' do
      asset = Asset.new user_id: @user.id, url: "http://foo"
      asset.valid?.should be_false      
      asset.errors.full_messages.should include("url is invalid")
    end
  end

  describe '#create' do
    describe 'on local filesystem' do
      before(:each) do
        Asset.any_instance.stubs("use_s3?").returns(false)
      end

      it 'should save the file when passing a full path as an argument' do
        asset = Asset.create user_id: @user.id, asset_file: (Rails.root + 'db/fake_data/simple.json').to_s
        local_url = asset.public_url.gsub(/http:\/\/#{CartoDB.account_host}/,'')
        File.exists?("#{Rails.root}/public#{local_url}").should be_true
        asset.public_url.should =~ /.*test\/#{@user.username}\/assets\/\d+simple\.json.*/
      end

      it 'should save the file when passing an UploadedFile as an argument' do
        asset = Asset.create user_id: @user.id, asset_file: Rack::Test::UploadedFile.new(Rails.root.join('db/fake_data/column_number_to_boolean.csv'), 'text/csv')
        local_url = asset.public_url.gsub(/http:\/\/#{CartoDB.account_host}/,'')
        File.exists?("#{Rails.root}/public#{local_url}").should be_true
        asset.public_url.should =~ /.*test\/#{@user.username}\/assets\/\d+column_number_to_boolean.csv.*/
      end

      it 'should save the public url when passing it as an argument' do
        file = Rails.root.join('spec/support/data/cartofante_blue.png')
        serve_file file do |url|
          asset = Asset.create(user_id: @user.id, public_url: url)
          asset.public_url.should == url
        end
      end

      it 'should download the file and move it to the public assets path when passing an url as an argument' do
        file = Rails.root.join('spec/support/data/cartofante_blue.png')
        serve_file file do |url|
          asset = Asset.create(user_id: @user.id, url: url)
          local_url = asset.public_url.gsub(/http:\/\/#{CartoDB.account_host}/,'')
          File.exists?("#{Rails.root}/public#{local_url}").should be_true
          asset.public_url.should =~ /\/test\/test\/assets\/\d+cartofante_blue\.png/
        end
      end

    end
  end

  describe '#destroy' do
    it 'removes the file from storage if needed' do
      Asset.any_instance.stubs("use_s3?").returns(false)
      asset = Asset.create user_id: @user.id, asset_file: (Rails.root + 'db/fake_data/simple.json').to_s
      local_url = asset.public_url.gsub(/http:\/\/#{CartoDB.account_host}/,'')
      path = "#{Rails.root}/public#{local_url}"
      File.exists?(path).should be_true
      asset.destroy
      File.exists?(path).should be_false
    end
  end

  describe '#public_values' do
    it 'returns the expected format' do
      asset = Asset.new user_id: @user.id, asset_file: (Rails.root + 'db/fake_data/simple.json').to_s

      asset.public_values.should == { "public_url" => nil, "user_id" => @user.id, "id" => nil, "kind" => nil }
    end
  end
end

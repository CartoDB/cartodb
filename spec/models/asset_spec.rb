# encoding: utf-8

require 'spec_helper'
require 'models/assets_shared_examples'

describe Asset do
  before(:all) do
    @user = create_user
  end

  after(:all) do
    bypass_named_maps
    @user.destroy
  end

  it_behaves_like 'Asset models' do
    let(:asset_class) { ::Asset }
  end

  def local_path(asset)
    local_url = asset.public_url.gsub(/http:\/\/#{CartoDB.account_host}\/uploads/,'')
    Carto::Conf.new.public_uploaded_assets_path + local_url
  end

  describe '#create' do
    describe 'on local filesystem' do
      before(:each) do
        Asset.any_instance.stubs("use_s3?").returns(false)
      end

      it 'should save the file when passing a full path as an argument' do
        asset = Asset.create user_id: @user.id, asset_file: (Rails.root + 'spec/support/data/cartofante_blue.png').to_s
        File.exists?(local_path(asset)).should be_true
        asset.public_url.should =~ /.*test\/#{@user.username}\/assets\/\d+cartofante_blue\.png.*/
      end

      it 'should save the file when passing an UploadedFile as an argument' do
        file_path = Rails.root.join('spec/support/data/cartofante_blue.png')

        asset = Asset.create(
          user_id: @user.id,
          asset_file: Rack::Test::UploadedFile.new(file_path, 'image/png'))
        local_url = asset.public_url.gsub(/http:\/\/#{CartoDB.account_host}\/uploads/, '')
        File.exists?(local_path(asset)).should be_true
        asset.public_url.should =~ /.*test\/#{@user.username}\/assets\/\d+cartofante_blue.png.*/
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
          File.exists?(local_path(asset)).should be_true
          asset.public_url.should =~ /\/test\/#{@user.username}\/assets\/\d+cartofante_blue\.png/
        end
      end

    end
  end

  describe '#destroy' do
    it 'removes the file from storage if needed' do
      Asset.any_instance.stubs("use_s3?").returns(false)
      asset = Asset.create user_id: @user.id, asset_file: (Rails.root + 'spec/support/data/cartofante_blue.png').to_s
      path = local_path(asset)
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

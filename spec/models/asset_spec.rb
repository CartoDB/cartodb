require 'spec_helper'

describe Asset do
  before(:all) do
    @user = create_user
  end

  after(:all) do
    bypass_named_maps
    @user.destroy
  end

  describe '#validate' do
    it 'validates user_id' do
      asset = Asset.new
      asset.valid?.should be_false
      asset.errors.full_messages.should include("user_id can't be blank")
    end

    it 'validates file existence' do
      asset = Asset.new user_id: @user.id, asset_file: (Rails.root + 'db/fake_data/i_dont_exist.png').to_s
      asset.valid?.should be_false
      asset.errors.full_messages.should include("file is invalid")
    end

    it 'validates file correct extension' do
      asset = Asset.new user_id: @user.id, asset_file: (Rails.root + 'db/fake_data/i_dont_exist.json').to_s
      asset.valid?.should be_false
      asset.errors.full_messages.should include("file has invalid format")
    end

    it 'validates file correct metadata' do
      asset = Asset.new user_id: @user.id, asset_file: (Rails.root + 'spec/support/data/fake_png.png').to_s
      asset.valid?.should be_false
      asset.errors.full_messages.should include("file doesn't appear to be an image")
    end

    it 'validates file size' do
      asset = Asset.new user_id: @user.id, asset_file: (Rails.root + 'spec/support/data/images/pattern.jpg').to_s

      asset.stubs(:max_size).returns(10)

      asset.valid?.should be_false
      asset.errors.full_messages.should include("file is too big, 0.0MB max")
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

  def local_path(asset)
    local_url = CGI.unescape(asset.public_url).gsub(/\/uploads/, '')
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

      it 'should import assets with spaces in their name' do
        asset = Asset.create user_id: @user.id, asset_file: (Rails.root + 'spec/support/data/cartofante blue.png').to_s
        File.exists?(local_path(asset)).should be_true
        asset.public_url.should =~ /\/test\/#{@user.username}\/assets\/\d+cartofante%20blue\.png/
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

    it 'removes the file with special characters from storage' do
      Asset.any_instance.stubs("use_s3?").returns(false)
      asset = Asset.create user_id: @user.id, asset_file: (Rails.root + 'spec/support/data/cartofante blue.png').to_s
      path = local_path(asset)
      File.exists?(path).should be_true
      asset.destroy
      File.exists?(path).should be_false
    end
  end

  describe '#presenter' do
    it 'returns the expected format' do
      asset = Asset.new user_id: @user.id, asset_file: (Rails.root + 'db/fake_data/simple.json').to_s

      Carto::Api::AssetPresenter.new(asset).to_hash.should == { public_url: nil, user_id: @user.id, id: nil, kind: nil }
    end
  end
end

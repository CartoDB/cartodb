require 'spec_helper_unit'
require 'helpers/storage_helper'
require 'helpers/subdomainless_helper'

describe Carto::Asset do
  # Needed so subdomainless_helper works
  def host!(_) end

  before do
    @organization = Carto::Organization.find(create(:organization).id)
    @user = create(:carto_user, factory_bot_context: { only_db_setup: true })
    @visualization = create(:carto_visualization, user: @user)
  end

  let(:storage_info) do
    {
      type: 's3',
      location: 'manolo_subfolder',
      identifier: 'could_be_a_manolo_hash_23as4g5sh6sd7hd8j9jfgk'
    }
  end

  let(:public_url) do
    'https://manolo.es/es/co/bar'
  end

  describe('#.for_organization') do
    include StorageHelper

    it 'should create a valid asset for organization and resource' do
      bypass_storage
      asset = Carto::Asset.for_organization(organization: @organization,
                                            resource: Tempfile.new(['manolo', '.jpg']))

      asset.valid?.should be_true
    end
  end

  describe('#destroy') do
    it 'doesn\'t try to remove from storage if no storage_info is present' do
      Carto::AssetsService.any_instance.expects(:remove).never
      Carto::Asset.create(user: @user).destroy
    end

    it 'removes asset from storage if storage_info is present' do
      Carto::AssetsService.any_instance.expects(:remove).once
      Carto::Asset.create(user: @user, storage_info: storage_info).destroy
    end
  end

  describe('#absolute_public_url') do
    let(:asset) { Carto::Asset.new(organization: @organization, public_url: '/uploads/wadus') }

    it 'preprends subdomain name in subdomainful' do
      stub_domainful(@organization.name)
      domain = "http://#{@organization.name}.localhost.lan#{CartoDB.http_port}"
      asset.absolute_public_url.should eq domain + asset.public_url
    end

    it 'preprends domain name in subdomainless' do
      stub_subdomainless
      domain = "http://localhost.lan#{CartoDB.http_port}"
      asset.absolute_public_url.should eq domain + asset.public_url
    end
  end

  describe('#validation') do
    it 'requires a user or an organization' do
      asset = Carto::Asset.new
      asset.valid?.should be_false
      asset.errors[:user].should_not be_empty
      asset.errors[:organization].should_not be_empty
      asset.errors[:visualization].should_not be_empty
    end

    it 'requires a public url' do
      asset = Carto::Asset.new(organization: @organization,
                               storage_info: storage_info)
      asset.valid?.should be_false
      asset.errors[:public_url].should_not be_empty
    end

    describe('#user asset') do
      it 'accepts good asset' do
        asset = Carto::Asset.new(user: @user, public_url: public_url)
        asset.valid?.should be_true
      end

      it 'accepts nil storage_info' do
        asset = Carto::Asset.new(user: @user, public_url: public_url)
        asset.valid?.should be_true
      end

      it 'rejects incomplete storage_info' do
        storage_info.delete(:type)
        asset = Carto::Asset.new(user: @user,
                                 storage_info: storage_info,
                                 public_url: public_url)
        asset.valid?.should be_false
        asset.errors[:storage_info].should_not be_empty
      end

      it 'rejects spammy storage_info' do
        storage_info[:great_idea] = 'to spam a json!'
        asset = Carto::Asset.new(user: @user,
                                 storage_info: storage_info,
                                 public_url: public_url)
        asset.valid?.should be_false
        asset.errors[:storage_info].should_not be_empty
      end
    end

    describe('#organization asset') do
      it 'accepts good asset' do
        asset = Carto::Asset.new(organization: @organization,
                                 storage_info: storage_info,
                                 public_url: public_url)
        asset.valid?.should be_true
      end

      it 'rejects nil storage_info' do
        asset = Carto::Asset.new(organization: @organization,
                                 public_url: public_url)
        asset.valid?.should be_false
        asset.errors[:storage_info].should_not be_empty
        asset.errors[:storage_info].should eq ["can't be blank"]
      end

      it 'rejects incomplete storage_info' do
        storage_info.delete(:type)
        asset = Carto::Asset.new(organization: @organization,
                                 storage_info: storage_info,
                                 public_url: public_url)
        asset.valid?.should be_false
        asset.errors[:storage_info].should_not be_empty
      end

      it 'rejects spammy storage_info' do
        storage_info[:great_idea] = 'to spam a json!'
        asset = Carto::Asset.new(organization: @organization,
                                 storage_info: storage_info,
                                 public_url: public_url)
        asset.valid?.should be_false
        asset.errors[:storage_info].should_not be_empty
      end
    end

    describe('#visualization asset') do
      it 'accepts good asset' do
        asset = Carto::Asset.new(visualization: @visualization,
                                 storage_info: storage_info,
                                 public_url: public_url)
        asset.valid?.should be_true
      end

      it 'rejects nil storage_info' do
        asset = Carto::Asset.new(visualization: @visualization,
                                 public_url: public_url)
        asset.valid?.should be_false
        asset.errors[:storage_info].should_not be_empty
        asset.errors[:storage_info].should eq ["can't be blank"]
      end

      it 'rejects incomplete storage_info' do
        storage_info.delete(:type)
        asset = Carto::Asset.new(visualization: @visualization,
                                 storage_info: storage_info,
                                 public_url: public_url)
        asset.valid?.should be_false
        asset.errors[:storage_info].should_not be_empty
      end

      it 'rejects spammy storage_info' do
        storage_info[:great_idea] = 'to spam a json!'
        asset = Carto::Asset.new(visualization: @visualization,
                                 storage_info: storage_info,
                                 public_url: public_url)
        asset.valid?.should be_false
        asset.errors[:storage_info].should_not be_empty
      end
    end
  end
end

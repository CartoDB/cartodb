# encoding: utf-8

require 'spec_helper_min'

describe Carto::Asset do
  before(:all) do
    @organization = FactoryGirl.create(:organization)
    @user = FactoryGirl.create(:carto_user)
  end

  after(:all) do
    @organization.destroy
    @user.destroy
  end

  let(:storage_info) do
    {
      type: 's3',
      location: 'manolo_subfolder',
      identifier: 'could_be_a_manolo_hash_23as4g5sh6sd7hd8j9jfgk'
    }
  end

  describe('#destroy') do
    describe('#user asset') do
      it 'should not try to remove asset from storage' do
        Carto::OrganizationAssetService.instance.expects(:remove).never
        Carto::Asset.create(user: @user).destroy
      end
    end

    describe('#organization asset') do
      it 'should not try to remove asset from storage' do
        Carto::OrganizationAssetService.instance.expects(:remove).once
        Carto::Asset.create(organization_id: @organization.id).destroy
      end
    end
  end

  describe('#validation') do
    describe('#user asset') do
      it 'accepts good asset' do
        asset = Carto::Asset.new(user: @user)
        asset.valid?.should be_true
      end

      it 'accepts nil storage_info' do
        asset = Carto::Asset.new(user: @user)
        asset.valid?.should be_true
      end

      it 'rejects incomplete storage_info' do
        storage_info.delete(:type)
        asset = Carto::Asset.new(user: @user, storage_info: storage_info)
        asset.valid?.should be_false
        asset.errors[:storage_info].should_not be_empty
      end

      it 'rejects spammy storage_info' do
        storage_info[:great_idea] = 'to spam a json!'
        asset = Carto::Asset.new(user: @user, storage_info: storage_info)
        asset.valid?.should be_false
        asset.errors[:storage_info].should_not be_empty
      end
    end

    describe('#organization asset') do
      it 'accepts good asset' do
        asset = Carto::Asset.new(organization_id: @organization.id,
                                 storage_info: storage_info)
        asset.valid?.should be_true
      end

      it 'rejects nil storage_info' do
        asset = Carto::Asset.new(organization_id: @organization.id)
        asset.valid?.should be_false
        asset.errors[:storage_info].should_not be_empty
        asset.errors[:storage_info].should eq ["can't be blank"]
      end

      it 'rejects incomplete storage_info' do
        storage_info.delete(:type)
        asset = Carto::Asset.new(organization_id: @organization.id,
                                 storage_info: storage_info)
        asset.valid?.should be_false
        asset.errors[:storage_info].should_not be_empty
      end

      it 'rejects spammy storage_info' do
        storage_info[:great_idea] = 'to spam a json!'
        asset = Carto::Asset.new(organization_id: @organization.id,
                                 storage_info: storage_info)
        asset.valid?.should be_false
        asset.errors[:storage_info].should_not be_empty
      end
    end
  end
end

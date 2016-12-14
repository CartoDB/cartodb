# encoding: utf-8

require 'spec_helper_min'

describe Carto::Asset do
  before(:all) do
    @organization = FactoryGirl.create(:organization)
  end

  after(:all) do
    @organization.destroy
  end

  let(:storage_info) do
    {
      type: 's3',
      location: 'manolo_subfolder',
      identifier: 'could_be_a_manolo_hash_23as4g5sh6sd7hd8j9jfgk'
    }
  end

  describe('#validation') do
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

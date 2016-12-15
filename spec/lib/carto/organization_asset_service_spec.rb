require 'helpers/storage_helper'
require 'spec_helper_min'

describe Carto::OrganizationAssetService do
  include StorageHelper

  before(:each) do
    bypass_storage
  end

  describe('#location') do
    after(:each) do
      Carto::OrganizationAssetService.instance.instance_variable_set(:@location, nil)
    end

    it 'uses bucket when available' do
      Cartodb.stubs(:get_config_if_present)
             .with(:assets, 'organization', 'bucket')
             .returns('manolo_bucket')

      Cartodb.stubs(:get_config_if_present)
             .with(:assets, 'organization', 'location')
             .returns('escobar_location')

      Carto::OrganizationAssetService.instance.location.should eq 'manolo_bucket'
    end

    it 'uses location when available if bucket is not' do
      Cartodb.stubs(:get_config_if_present)
             .with(:assets, 'organization', 'bucket')

      Cartodb.stubs(:get_config_if_present)
             .with(:assets, 'organization', 'location')
             .returns('escobar_location')

      Carto::OrganizationAssetService.instance.location.should eq 'escobar_location'
    end

    it 'uses default neither bucket nor location are available' do
      Cartodb.stubs(:get_config_if_present)
             .with(:assets, 'organization', 'bucket')

      Cartodb.stubs(:get_config_if_present)
             .with(:assets, 'organization', 'location')

      default_location = Carto::OrganizationAssetService::DEFAULT_LOCATION
      Carto::OrganizationAssetService.instance.location.should eq default_location
    end
  end
end

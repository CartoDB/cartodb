require 'spec_helper_min'

describe Carto::OrganizationAssetsService do
  describe('#location') do
    after(:each) do
      Carto::OrganizationAssetsService.instance.instance_variable_set(:@location, nil)
    end

    it 'uses bucket when available' do
      Cartodb.stubs(:get_config)
             .with(:assets, 'organization', 'bucket')
             .returns('manolo_bucket')

      Cartodb.stubs(:get_config)
             .with(:assets, 'organization', 'location')
             .returns('escobar_location')

      Carto::OrganizationAssetsService.instance.location.should eq 'manolo_bucket'
    end

    it 'uses location when available if bucket is not' do
      Cartodb.stubs(:get_config).with(:assets, 'organization', 'bucket')
      Cartodb.stubs(:get_config)
             .with(:assets, 'organization', 'location')
             .returns('escobar_location')

      Carto::OrganizationAssetsService.instance.location.should eq 'escobar_location'
    end

    it 'uses default when neither bucket nor location are available' do
      Cartodb.stubs(:get_config).with(:assets, 'organization', 'bucket')
      Cartodb.stubs(:get_config)
             .with(:assets, 'organization', 'location')

      default_location = Carto::OrganizationAssetsService::DEFAULT_LOCATION
      Carto::OrganizationAssetsService.instance.location.should eq default_location
    end
  end

  describe('#max_size_in_bytes') do
    after(:each) do
      Carto::OrganizationAssetsService.instance.instance_variable_set(:@max_size_in_bytes, nil)
    end

    it 'uses conf when available' do
      Cartodb.stubs(:get_config)
             .with(:assets, 'organization', 'max_size_in_bytes')
             .returns(123456789)

      Carto::OrganizationAssetsService.instance.max_size_in_bytes.should eq 123456789
    end

    it 'uses default when conf is not available' do
      Cartodb.stubs(:get_config).with(:assets, 'organization', 'max_size_in_bytes')

      default_max_size = Carto::AssetsService.new.max_size_in_bytes
      Carto::OrganizationAssetsService.instance.max_size_in_bytes.should eq default_max_size
    end
  end
end

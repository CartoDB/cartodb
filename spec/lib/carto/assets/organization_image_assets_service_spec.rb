require 'spec_helper_min'

describe Carto::OrganizationImageAssetsService do
  describe('#location') do
    after(:each) do
      Carto::OrganizationImageAssetsService.instance.instance_variable_set(:@location, nil)
    end

    it 'uses bucket when available' do
      allow(Cartodb).to receive(:get_config).with(:assets, 'organization', 'bucket').and_return('manolo_bucket')

      allow(Cartodb).to receive(:get_config).with(:assets, 'organization', 'location').and_return('escobar_location')

      Carto::OrganizationImageAssetsService.instance.location.should eq 'manolo_bucket'
    end

    it 'uses location when available if bucket is not' do
      allow(Cartodb).to receive(:get_config).with(:assets, 'organization', 'bucket')
      allow(Cartodb).to receive(:get_config).with(:assets, 'organization', 'location').and_return('escobar_location')

      Carto::OrganizationImageAssetsService.instance.location.should eq 'escobar_location'
    end

    it 'uses default when neither bucket nor location are available' do
      allow(Cartodb).to receive(:get_config).with(:assets, 'organization', 'bucket')
      allow(Cartodb).to receive(:get_config)
             .with(:assets, 'organization', 'location')

      default_location = Carto::OrganizationImageAssetsService::DEFAULT_LOCATION
      Carto::OrganizationImageAssetsService.instance.location.should eq default_location
    end
  end

  describe('#max_size_in_bytes') do
    after(:each) do
      Carto::OrganizationImageAssetsService.instance.instance_variable_set(:@max_size_in_bytes, nil)
    end

    it 'uses conf when available' do
      allow(Cartodb).to receive(:get_config).with(:assets, 'organization', 'max_size_in_bytes').and_return(123456789)

      Carto::OrganizationImageAssetsService.instance.max_size_in_bytes.should eq 123456789
    end

    it 'uses default when conf is not available' do
      allow(Cartodb).to receive(:get_config).with(:assets, 'organization', 'max_size_in_bytes')

      default_max_size = Carto::ImageAssetsService.new.max_size_in_bytes
      Carto::OrganizationImageAssetsService.instance.max_size_in_bytes.should eq default_max_size
    end
  end
end

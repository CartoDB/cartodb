require_relative '../../../spec/spec_helper'
require_relative '../lib/hires_geocoder_factory'
require_relative '../lib/geocoder_config'

describe CartoDB::HiresGeocoderFactory do

  after(:all) do
    # reset config
    CartoDB::GeocoderConfig.instance.set(nil)
  end

  before(:each) do
    @log = mock
    @log.stubs(:append)
    @log.stubs(:append_and_store)
    @geocoding_model = create(:geocoding, kind: 'high-resolution', formatter: '{street}')
  end

  describe '#get' do
    it 'returns a HiresGeocoder instance if the input file has less than N rows' do
      CartoDB::GeocoderConfig.instance.set({
          'non_batch_base_url' => 'http://api.example.com',
          'app_id' => 'dummy_app_id',
          'token' => 'dummy_token',
          'mailto' => 'dummy_mail_addr'
        })
      dummy_input_file = 'dummy_input_file.csv'
      working_dir = '/tmp/any_dir'
      input_rows = CartoDB::HiresGeocoderFactory::BATCH_FILES_OVER - 1
      CartoDB::HiresGeocoderFactory.expects(:input_rows).once.with(dummy_input_file).returns(input_rows)

      CartoDB::HiresGeocoderFactory.get(dummy_input_file, working_dir, @log, @geocoding_model).class.should == CartoDB::HiresGeocoder
    end

    it 'returns a HiresBatchGeocoder instance if the input file is above N rows' do
      CartoDB::GeocoderConfig.instance.set({
          'base_url' => 'http://api.example.com',
          'app_id' => 'dummy_app_id',
          'token' => 'dummy_token',
          'mailto' => 'dummy_mail_addr'
        })
      dummy_input_file = 'dummy_input_file.csv'
      working_dir = '/tmp/any_dir'
      input_rows = CartoDB::HiresGeocoderFactory::BATCH_FILES_OVER + 1
      CartoDB::HiresGeocoderFactory.expects(:input_rows).once.with(dummy_input_file).returns(input_rows)

      CartoDB::HiresGeocoderFactory.get(dummy_input_file, working_dir, @log, @geocoding_model).class.should == CartoDB::HiresBatchGeocoder
    end

    it 'returns a batch geocoder if config has force_batch set to true' do
      CartoDB::GeocoderConfig.instance.set({
          'force_batch' => true,
          'base_url' => 'http://api.example.com',
          'app_id' => 'dummy_app_id',
          'token' => 'dummy_token',
          'mailto' => 'dummy_mail_addr'
        })
      dummy_input_file = 'dummy_input_file.csv'
      working_dir = '/tmp/any_dir'
      CartoDB::HiresGeocoderFactory.expects(:input_rows).never

      CartoDB::HiresGeocoderFactory.get(dummy_input_file, working_dir, @log, @geocoding_model).class.should == CartoDB::HiresBatchGeocoder
    end

  end

end

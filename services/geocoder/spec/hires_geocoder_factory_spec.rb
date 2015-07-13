# encoding: utf-8
require_relative '../../../spec/rspec_configuration'
require_relative '../lib/hires_geocoder_factory'

describe CartoDB::HiresGeocoderFactory do

  before(:all) do
    # Allow stubbing of Cartodb module if it isn't already defined
    module Cartodb; end
  end

  describe '#get' do
    it 'returns a HiresGeocoder instance if the input file has less than N rows' do
      Cartodb.stubs(:config).returns({
          geocoder: {
            'non_batch_base_url' => 'http://api.example.com',
            'app_id' => 'dummy_app_id',
            'token' => 'dummy_token',
            'mailto' => 'dummy_mail_addr'
          }
        })
      dummy_input_file = 'dummy_input_file.csv'
      working_dir = '/tmp/any_dir'
      input_rows = CartoDB::HiresGeocoderFactory::BATCH_FILES_OVER - 1
      CartoDB::HiresGeocoderFactory.expects(:input_rows).once.with(dummy_input_file).returns(input_rows)

      CartoDB::HiresGeocoderFactory.get(dummy_input_file, working_dir).class.should == CartoDB::HiresGeocoder
    end

    it 'returns a HiresBatchGeocoder instance if the input file is above N rows' do
      Cartodb.stubs(:config).returns({
          geocoder: {
            'base_url' => 'http://api.example.com',
            'app_id' => 'dummy_app_id',
            'token' => 'dummy_token',
            'mailto' => 'dummy_mail_addr'
          }
        })
      dummy_input_file = 'dummy_input_file.csv'
      working_dir = '/tmp/any_dir'
      input_rows = CartoDB::HiresGeocoderFactory::BATCH_FILES_OVER + 1
      CartoDB::HiresGeocoderFactory.expects(:input_rows).once.with(dummy_input_file).returns(input_rows)

      CartoDB::HiresGeocoderFactory.get(dummy_input_file, working_dir).class.should == CartoDB::HiresBatchGeocoder
    end

    it 'returns a batch geocoder if config has force_batch set to true' do
      Cartodb.stubs(:config).returns({
          geocoder: {
            'force_batch' => true,
            'base_url' => 'http://api.example.com',
            'app_id' => 'dummy_app_id',
            'token' => 'dummy_token',
            'mailto' => 'dummy_mail_addr'
          }
        })
      dummy_input_file = 'dummy_input_file.csv'
      working_dir = '/tmp/any_dir'
      CartoDB::HiresGeocoderFactory.expects(:input_rows).never

      CartoDB::HiresGeocoderFactory.get(dummy_input_file, working_dir).class.should == CartoDB::HiresBatchGeocoder
    end

  end

end

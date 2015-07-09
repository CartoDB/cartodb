# encoding: utf-8
require 'tmpdir'
require 'fileutils'
require 'csv'
require_relative '../../../spec/rspec_configuration'
require_relative '../lib/hires_geocoder'


describe CartoDB::HiresGeocoder do

  MOCK_COORDINATES = [38.89037, -77.03196]

  RSpec.configure do |config|
    config.before :each do
      Typhoeus::Expectation.clear
    end
  end

  before(:each) do
    @working_dir = Dir.mktmpdir
    @input_csv_file = path_to '../../table-geocoder/spec/fixtures/nokia_input.csv'
    CartoDB::HiresGeocoder.any_instance.stubs(:config).returns({
        'non_batch_base_url' => 'batch.example.com',
        'app_id' => '',
        'token' => '',
        'mailto' => ''
      })
    @geocoder = CartoDB::HiresGeocoder.new(@input_csv_file, @working_dir)
  end

  after(:each) do
    FileUtils.rm_f @working_dir
  end

  describe '#run' do
    it 'takes every row from input and calss geocode_text on them' do
      rows_to_geocode = ::CSV.read(@input_csv_file, headers: true).length
      @geocoder.expects(:geocode_text).times(rows_to_geocode).returns(MOCK_COORDINATES)
      @geocoder.run
      @geocoder.status.should == 'completed'
    end
  end

  describe '#process_row' do
    it 'increments the number of processed rows by one when called' do
      output_csv_mock = mock
      output_csv_mock.expects(:add_row).once
      input_row = {'searchtext' => 'olakase'}
      @geocoder.expects(:geocode_text).once.returns(MOCK_COORDINATES)
      @geocoder.processed_rows.should == 0
      @geocoder.send(:process_row, input_row, output_csv_mock)
      @geocoder.processed_rows.should == 1
    end

    it 'adds a row with the expected format when success' do
      output_csv_mock = mock
      output_csv_mock.expects(:add_row).once.with ['olakase', 1, 1, MOCK_COORDINATES[0], MOCK_COORDINATES[1]]
      input_row = {'searchtext' => 'olakase'}
      @geocoder.expects(:geocode_text).once.returns(MOCK_COORDINATES)
      @geocoder.send(:process_row, input_row, output_csv_mock)
    end

    it 'does not add any row when it when geolocation fails' do
      output_csv_mock = mock
      output_csv_mock.expects(:add_row).never
      input_row = {'searchtext' => 'olakase'}
      @geocoder.expects(:geocode_text).once.returns([nil, nil])
      @geocoder.send(:process_row, input_row, output_csv_mock)
    end

  end

  def path_to(filepath = '')
    File.expand_path(
      File.join(File.dirname(__FILE__), "../fixtures/#{filepath}")
      )
  end

end

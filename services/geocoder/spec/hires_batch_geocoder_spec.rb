# encoding: utf-8
require 'tmpdir'
require 'fileutils'
require_relative '../../../spec/rspec_configuration.rb'
require_relative '../lib/hires_batch_geocoder'


describe CartoDB::HiresBatchGeocoder do

  RSpec.configure do |config|
    config.before :each do
      Typhoeus::Expectation.clear
    end
  end

  before(:each) do
    @working_dir = Dir.mktmpdir
    @input_csv_file = path_to '../../table-geocoder/spec/fixtures/nokia_input.csv'
    CartoDB::HiresBatchGeocoder.any_instance.stubs(:config).returns({
        'base_url' => 'batch.example.com',
        'app_id' => '',
        'token' => '',
        'mailto' => ''
      })
    @batch_geocoder = CartoDB::HiresBatchGeocoder.new(@input_csv_file, @working_dir)
  end

  after(:each) do
    FileUtils.rm_f @working_dir
  end

  describe '#run' do
    it 'uploads a file to the batch server' do
      @batch_geocoder.expects(:upload).once
      @batch_geocoder.expects(:update_status).once
      @batch_geocoder.expects(:status).once.returns('completed')
      @batch_geocoder.run
    end

    it 'times out if not finished before the DEFAULT_TIMEOUT' do
      @batch_geocoder.expects(:upload).once
      @batch_geocoder.expects(:update_status).once
      @batch_geocoder.expects(:cancel).once
      @batch_geocoder.stubs(:default_timeout).returns(-10) # make sure it times out
      @batch_geocoder.run
      @batch_geocoder.status.should == 'timeout'
    end
  end

  describe 'upload' do
    it 'uploads a file to the batch service' do
      url = @batch_geocoder.send(:api_url, CartoDB::HiresBatchGeocoder::UPLOAD_OPTIONS)
      expected_request_id = 'dummy_id'
      xml_response_body = "<Response><MetaInfo><RequestId>#{expected_request_id}</RequestId></MetaInfo></Response>"
      response = Typhoeus::Response.new(code: 200, body: xml_response_body)

      Typhoeus.stub(url, method: :post).and_return(response)
      @batch_geocoder.upload

      @batch_geocoder.request_id.should == expected_request_id
      @batch_geocoder.used_batch_request?.should == true
    end

    it 'raises an exception if the api returns != 200' do
      url = @batch_geocoder.send(:api_url, CartoDB::HiresBatchGeocoder::UPLOAD_OPTIONS)
      response = Typhoeus::Response.new(code: 401)
      Typhoeus.stub(url, method: :post).and_return(response)
      CartoDB.expects(:notify_exception).once

      expect {
        @batch_geocoder.upload
      }.to raise_error(RuntimeError, /Geocoding API communication failure/)
    end

    it 'raises an exception if the api does not return a RequestId' do
      url = @batch_geocoder.send(:api_url, CartoDB::HiresBatchGeocoder::UPLOAD_OPTIONS)
      response = Typhoeus::Response.new(code: 200)
      Typhoeus.stub(url, method: :post).and_return(response)
      CartoDB.expects(:notify_exception).once

      expect {
        @batch_geocoder.upload
      }.to raise_error(RuntimeError, /Could not get the request ID/)
    end

  end



  def path_to(filepath = '')
    File.expand_path(
      File.join(File.dirname(__FILE__), "../fixtures/#{filepath}")
      )
  end

end

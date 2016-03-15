# encoding: utf-8
require 'tmpdir'
require 'fileutils'
require_relative '../../../spec/rspec_configuration.rb'
require_relative '../../../spec/spec_helper.rb'
require_relative '../lib/hires_batch_geocoder'


describe CartoDB::HiresBatchGeocoder do

  RSpec.configure do |config|
    config.before :each do
      Typhoeus::Expectation.clear
    end
  end

  before(:each) do
    @log = mock
    @log.stubs(:append)
    @log.stubs(:append_and_store)
    @working_dir = Dir.mktmpdir
    @input_csv_file = path_to '../../table-geocoder/spec/fixtures/nokia_input.csv'
    CartoDB::HiresBatchGeocoder.any_instance.stubs(:config).returns({
        'base_url' => 'batch.example.com',
        'app_id' => '',
        'token' => '',
        'mailto' => ''
      })
    @geocoding_model = FactoryGirl.create(:geocoding, kind: 'high-resolution', formatter: '{street}' )
    @batch_geocoder = CartoDB::HiresBatchGeocoder.new(@input_csv_file, @working_dir, @log, @geocoding_model)
  end

  after(:each) do
    FileUtils.rm_f @working_dir
  end

  describe '#run' do
    it 'uploads a file to the batch server' do
      @batch_geocoder.expects(:upload).once
      @batch_geocoder.expects(:update_status).twice
      @batch_geocoder.run
      assert @geocoding_model.state == 'completed'
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

  describe '#upload' do
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

  describe '#cancel' do
    it 'sends a cancel put request and gets the status, processed and total rows' do
      request_id = 'dummy_request_id'
      @geocoding_model.remote_id = request_id
      @geocoding_model.save
      @batch_geocoder.stubs(:request_id).returns(request_id)
      url = @batch_geocoder.send(:api_url, action: 'cancel')
      url.should match(%r'/#{request_id}/')
      url.should match(%r'action=cancel')

      expected_status = 'cancelled'
      expected_processed_rows = 20
      expected_success_rows = 17
      expected_failed_rows = 0
      expected_empty_rows = 3 
      expected_total_rows = 30

      response_body = <<END_XML
<Response>
  <Status>#{expected_status}</Status>
  <ProcessedCount>#{expected_processed_rows}</ProcessedCount>
  <SuccessCount>#{expected_success_rows}</SuccessCount>
  <ErrorCount>#{expected_failed_rows}</ErrorCount>
  <InvalidCount>#{expected_empty_rows}</InvalidCount>
  <TotalCount>#{expected_total_rows}</TotalCount>
</Response>
END_XML

      response = Typhoeus::Response.new(code: 200, body: response_body)
      Typhoeus.stub(url, method: :put).and_return(response)
      @batch_geocoder.cancel
      @batch_geocoder.status.should == expected_status
      @batch_geocoder.processed_rows.should == expected_processed_rows
      @batch_geocoder.total_rows.should == expected_total_rows
    end
  end

  describe '#update' do
    it 'gets the status, processed and total rows by sending a get request' do
      request_id = 'dummy_request_id'
      @geocoding_model.remote_id = request_id
      @geocoding_model.save
      @batch_geocoder.stubs(:request_id).returns(request_id)
      url = @batch_geocoder.send(:api_url, action: 'status')
      url.should match(%r'/#{request_id}/')
      url.should match(%r'action=status')

      expected_status = 'running'
      expected_processed_rows = 20
      expected_success_rows = 17
      expected_failed_rows = 0
      expected_empty_rows = 3 
      expected_total_rows = 30

      response_body = <<END_XML
<Response>
  <Status>#{expected_status}</Status>
  <ProcessedCount>#{expected_processed_rows}</ProcessedCount>
  <SuccessCount>#{expected_success_rows}</SuccessCount>
  <ErrorCount>#{expected_failed_rows}</ErrorCount>
  <InvalidCount>#{expected_empty_rows}</InvalidCount>
  <TotalCount>#{expected_total_rows}</TotalCount>
</Response>
END_XML

      response = Typhoeus::Response.new(code: 200, body: response_body)
      Typhoeus.stub(url, method: :get).and_return(response)
      @batch_geocoder.update_status
      @batch_geocoder.status.should == expected_status
      @batch_geocoder.processed_rows.should == expected_processed_rows
      @batch_geocoder.total_rows.should == expected_total_rows
    end
  end

  describe '#result' do
    it "raises an exception if there's no request_id from a previous upload" do
      expect {
        @batch_geocoder.result
      }.to raise_error(RuntimeError, /No request_id provided/)
    end

    it 'downloads the result file from the remote server' do
      request_id = 'dummy_request_id'
      @batch_geocoder.stubs(:request_id).returns(request_id)
      expected_response_body = 'dummy result file contents'
      url = @batch_geocoder.send(:api_url, {}, 'result')
      response = Typhoeus::Response.new(code: 200, body: expected_response_body)
      Typhoeus.stub(url, method: :get).and_return(response)

      result_file = @batch_geocoder.result
      File.open(result_file).read.should == expected_response_body

      # it also "memoizes" the result file and avoids further downloads
      @batch_geocoder.expects(:http_client).never
      @batch_geocoder.result.should == result_file
    end

    it 'raises an exception if cannot get a result file' do
      request_id = 'dummy_request_id'
      @batch_geocoder.stubs(:request_id).returns(request_id)
      expected_response_body = 'dummy result file contents'
      url = @batch_geocoder.send(:api_url, {}, 'result')
      response = Typhoeus::Response.new(code: 400)
      Typhoeus.stub(url, method: :get).and_return(response)

      expect {
        @batch_geocoder.result
      }.to raise_error(RuntimeError, /Download request failed/)
    end
  end


  def path_to(filepath = '')
    File.expand_path(
      File.join(File.dirname(__FILE__), "../fixtures/#{filepath}")
      )
  end

end

# encoding: utf-8
require_relative '../../../spec/spec_helper'
require_relative '../../../spec/rspec_configuration.rb'
require_relative '../lib/hires_batch_geocoder'

# TODO rename to hires_batch_geocoder_spec.rb or split into batch/non-batch

describe CartoDB::HiresBatchGeocoder do

  before(:each) do
    @log = mock
    @log.stubs(:append)
    @log.stubs(:append_and_store)
    CartoDB::HiresBatchGeocoder.any_instance.stubs(:config).returns({
        'base_url' => 'http://wadus.nokia.com',
        'app_id' => '',
        'token' => '',
        'mailto' => ''
      })
    @working_dir = Dir.mktmpdir
    @geocoding_model = FactoryGirl.create(:geocoding, kind: 'high-resolution', formatter: '{street}',
                                          remote_id: 'wadus')
  end

  after(:each) do
    FileUtils.remove_entry_secure @working_dir
  end

  describe '#upload' do
    it 'returns rec_id on success' do
      stub_api_request 200, 'response_example.xml'
      filepath = path_to 'without_country.csv'
      rec_id = CartoDB::HiresBatchGeocoder.new(filepath, @working_dir, @log, @geocoding_model).upload
      rec_id.should eq "K8DmCWzsZGh4gbawxOuMv2BUcZsIkt7v"
    end

    it 'raises error on failure' do
      stub_api_request 400, 'response_failure.xml'
      filepath = path_to 'without_country.csv'
      expect {
        CartoDB::HiresBatchGeocoder.new(filepath, @working_dir, @log, @geocoding_model).upload
      }.to raise_error('Geocoding API communication failure: Input parameter validation failed. JobId: 9rFyj7kbGMmpF50ZUFAkRnroEiOpDOEZ Email Address is missing!')
    end
  end

  describe '#update_status' do
    before {
      stub_api_request(200, 'response_status.xml')
      CartoDB::HiresBatchGeocoder.any_instance.stubs(:request_id).returns('wadus')
    }
    let(:geocoder) { CartoDB::HiresBatchGeocoder.new('/tmp/dummy_input_file.csv', @working_dir, @log, @geocoding_model) }

    it "updates status" do
      expect { geocoder.update_status }.to change(geocoder, :status).from(nil).to('completed')
    end
    it "updates processed rows" do
      expect { geocoder.update_status }.to change(geocoder, :processed_rows).from(nil).to(2)
    end
    it "updates total rows" do
      expect { geocoder.update_status }.to change(geocoder, :total_rows).from(nil).to(3)
    end
  end

  describe '#result' do
    it "saves result file on working directory" do
      pending 'move to non-batch suite' # TODO
      filepath = path_to 'without_country.csv'
      stub_api_request 200, 'response_example_non_batch.json'
      geocoder = CartoDB::Geocoder.new(default_params.merge(input_file: filepath, force_batch: false))
      geocoder.upload
      geocoder.status.should eq 'completed'
      result_file = geocoder.result
      File.file?(result_file).should be true
      File.dirname(result_file).should eq geocoder.dir
    end
  end

  describe '#cancel' do
    before {
      stub_api_request(200, 'response_cancel.xml')
      @geocoding_model.remote_id = 'wadus'
      @geocoding_model.save
      CartoDB::HiresBatchGeocoder.any_instance.stubs(:request_id).returns('wadus')
    }
    let(:geocoder) { CartoDB::HiresBatchGeocoder.new('dummy_input_file.csv', @working_dir, @log, @geocoding_model) }

    it "updates the status" do
      geocoder.cancel
      @geocoding_model.state.should eq 'cancelled'
    end
  end

  describe '#extract_response_field' do
    let(:geocoder) { CartoDB::HiresBatchGeocoder.new('dummy_input.csv', @working_dir, @log, @geocoding_model) }
    let(:response) { File.open(path_to('response_example.xml')).read }

    it 'returns specified element value' do
      geocoder.send(:extract_response_field, response, '//Response/Status').should == 'submitted'
    end

    it 'returns nil for missing elements' do
      CartoDB.expects(:notify_exception).once
      geocoder.send(:extract_response_field, response, 'MissingField').should == nil
    end
  end

  describe '#api_url' do
    # TODO move to common place for both geocoders
    before(:each) {
      CartoDB::HiresBatchGeocoder.any_instance.stubs(:config).returns({
        'base_url' => '',
        'app_id' => 'a',
        'token' => 'b',
        'mailto' => 'c'
        })
      @geocoder =  CartoDB::HiresBatchGeocoder.new('dummy_input.csv', @working_dir, @log, @geocoding_model)
    }

    it 'returns base url by default' do
      @geocoder.send(:api_url, {}).should == "/wadus/?app_id=a&token=b&mailto=c"
    end

    it 'allows for api method specification' do
      @geocoder.send(:api_url, {}, 'all').should == "/wadus/all/?app_id=a&token=b&mailto=c"
    end

    it 'allows for api attributes specification' do
      @geocoder.send(:api_url, {attr: 'wadus'}, 'all').should == "/wadus/all/?attr=wadus&app_id=a&token=b&mailto=c"
    end
  end

  describe '#geocode_text' do
    it 'returns lat/lon on success' do
      pending 'move to non-batched suite' # TODO
      stub_api_request 200, 'response_example_non_batch.json'
      g = CartoDB::Geocoder.new(default_params)
      g.geocode_text("United States").should eq [38.89037, -77.03196]
    end
  end

  describe '#used_batch_request?' do
    it 'returns true if sent a request to hi-res batch api' do
      pending 'move these to the factory tests' # TODO
      stub_api_request 200, 'response_example.xml'
      filepath = path_to 'without_country.csv'
      geocoder = CartoDB::Geocoder.new(default_params.merge(input_file: filepath))
      geocoder.used_batch_request?.should eq true
    end

    it 'returns false if sent the request was non-batched' do
      pending 'move these to the factory tests' # TODO
      stub_api_request 200, 'response_example_non_batch.json'
      filepath = path_to 'without_country.csv'
      g = CartoDB::Geocoder.new(default_params.merge(force_batch: false, input_file: filepath))
      g.upload
      g.used_batch_request?.should eq false
    end
  end

  def path_to(filepath)
    File.expand_path(
      File.join(File.dirname(__FILE__), "../spec/fixtures/#{filepath}")
    )
  end #path_to

  def stub_api_request(code, response_file)
    response = File.open(path_to(response_file)).read
    Typhoeus.stub(/.*nokia.com/).and_return(
      Typhoeus::Response.new(code: code, body: response)
    )
  end
end # CartoDB::Geocoder

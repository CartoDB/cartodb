# encoding: utf-8
require_relative '../../../spec/rspec_configuration.rb'
require_relative '../lib/hires_batch_geocoder'


# TODO rename to hires_batch_geocoder_spec.rb or split into batch/non-batch

describe CartoDB::HiresBatchGeocoder do

  before(:each) do
    CartoDB::HiresBatchGeocoder.any_instance.stubs(:config).returns({
        'base_url' => 'http://wadus.nokia.com',
        'app_id' => '',
        'token' => '',
        'mailto' => ''
      })
  end

  describe '#upload' do
    it 'returns rec_id on success' do
      stub_api_request 200, 'response_example.xml'
      filepath = path_to 'without_country.csv'
      Dir.mktmpdir do |working_dir|
        rec_id = CartoDB::HiresBatchGeocoder.new(filepath, working_dir).upload
        rec_id.should eq "K8DmCWzsZGh4gbawxOuMv2BUcZsIkt7v"
      end
    end

    it 'raises error on failure' do
      stub_api_request 400, 'response_failure.xml'
      filepath = path_to 'without_country.csv'
      expect { 
        CartoDB::Geocoder.new(default_params.merge(input_file: filepath)).upload 
      }.to raise_error('Geocoding API communication failure: Input parameter validation failed. JobId: 9rFyj7kbGMmpF50ZUFAkRnroEiOpDOEZ Email Address is missing!')
    end
  end

  describe '#update_status' do
    before { stub_api_request(200, 'response_status.xml') }
    let(:geocoder) { CartoDB::Geocoder.new(default_params.merge(request_id: 'wadus')) }

    it "updates status" do
      expect { geocoder.update_status }.to change(geocoder, :status).from(nil).to('completed')
    end
    it "updates processed rows" do
      expect { geocoder.update_status }.to change(geocoder, :processed_rows).from(nil).to("2")
    end
    it "updates total rows" do
      expect { geocoder.update_status }.to change(geocoder, :total_rows).from(nil).to("3")
    end
  end

  describe '#result' do
    it "saves result file on working directory" do
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
    before { stub_api_request(200, 'response_cancel.xml') }
    let(:geocoder) { CartoDB::Geocoder.new(default_params.merge(request_id: 'wadus')) }

    it "updates the status" do
      expect { geocoder.cancel }.to change(geocoder, :status).from(nil).to('cancelled')
    end
  end

  describe '#extract_response_field' do
    let(:geocoder) { CartoDB::Geocoder.new(default_params) }
    let(:response) { File.open(path_to('response_example.xml')).read }

    it 'extracts response_id by default' do
      geocoder.extract_response_field(response).should == 'K8DmCWzsZGh4gbawxOuMv2BUcZsIkt7v'
    end

    it 'returns specified element value' do
      geocoder.extract_response_field(response, '//Response/Status').should == 'submitted'
    end

    it 'returns nil for missing elements' do
      geocoder.extract_response_field(response, 'MissingField').should == nil
    end
  end

  describe '#api_url' do
    let(:geocoder) { CartoDB::Geocoder.new(app_id: 'a', token: 'b', mailto: 'c') }

    it 'returns base url by default' do
      geocoder.api_url({}).should == "/?app_id=a&token=b&mailto=c"
    end

    it 'allows for api method specification' do
      geocoder.api_url({}, 'all').should == "/all/?app_id=a&token=b&mailto=c"
    end

    it 'allows for api attributes specification' do
      geocoder.api_url({attr: 'wadus'}, 'all').should == "/all/?attr=wadus&app_id=a&token=b&mailto=c"
    end
  end

  describe '#geocode_text' do
    it 'returns lat/lon on success' do
      stub_api_request 200, 'response_example_non_batch.json'
      g = CartoDB::Geocoder.new(default_params)
      g.geocode_text("United States").should eq [38.89037, -77.03196]
    end
  end

  describe '#used_batch_request?' do
    it 'returns true if sent a request to hi-res batch api' do
      stub_api_request 200, 'response_example.xml'
      filepath = path_to 'without_country.csv'
      geocoder = CartoDB::Geocoder.new(default_params.merge(input_file: filepath))
      rec_id = geocoder.upload
      geocoder.used_batch_request?.should eq true
    end

    it 'returns false if sent the request was non-batched' do
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

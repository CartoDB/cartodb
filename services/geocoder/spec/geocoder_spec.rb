# encoding: utf-8
require_relative '../lib/geocoder.rb'

describe CartoDB::Geocoder do
  let(:default_params) { {app_id: '', token: '', mailto: ''} }

  describe '#upload' do
    it "returns rec_id on success" do
      filepath = path_to 'without_country.csv'
      response = File.open(path_to('response_example.xml')).read
      Typhoeus.stub(/.*nokia.com/).and_return(
        Typhoeus::Response.new(code: 200, body: response)
      )
      rec_id = CartoDB::Geocoder.new(default_params.merge(input_file: filepath)).upload
      rec_id.should eq "K8DmCWzsZGh4gbawxOuMv2BUcZsIkt7v"
    end
  end

  describe '#update_status' do
    before do
      response = File.open(path_to('response_status.xml')).read
      Typhoeus.stub(/.*nokia.com/).and_return(
        Typhoeus::Response.new(code: 200, body: response)
      )
    end
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
    pending "saves result file on working directory" do
      filepath = path_to 'without_country.csv'
      geocoder = CartoDB::Geocoder.new(default_params.merge(input_file: filepath))
      geocoder.upload
      until geocoder.status == 'completed' do
        geocoder.update_status
        sleep(1)
      end
      geocoder.result.should eq 'qqq'
    end
  end

  describe '#extract_response_field' do
    let(:geocoder) { CartoDB::Geocoder.new(default_params) }
    let(:response) { File.open(path_to('response_example.xml')).read }

    it 'extracts response_id by default' do
      geocoder.extract_response_field(response).should == 'K8DmCWzsZGh4gbawxOuMv2BUcZsIkt7v'
    end

    it 'returns specified element value' do
      geocoder.extract_response_field(response, 'Status').should == 'submitted'
    end

    it 'returns nil for missing elements' do
      geocoder.extract_response_field(response, 'MissingField').should == nil
    end
  end

  describe '#api_url' do
    let(:geocoder) { CartoDB::Geocoder.new(app_id: 'a', token: 'b', mailto: 'c') }

    it 'returns base url by default' do
      geocoder.api_url({}).should == "http://batch.geo.st.nlp.nokia.com/search-batch/6.2/jobs/?app_id=a&token=b&mailto=c"
    end

    it 'allows for api method specification' do
      geocoder.api_url({}, 'all').should == "http://batch.geo.st.nlp.nokia.com/search-batch/6.2/jobs/all/?app_id=a&token=b&mailto=c"
    end

    it 'allows for api attributes specification' do
      geocoder.api_url({attr: 'wadus'}, 'all').should == "http://batch.geo.st.nlp.nokia.com/search-batch/6.2/jobs/all/?attr=wadus&app_id=a&token=b&mailto=c"
    end
  end

  def path_to(filepath)
    File.expand_path(
      File.join(File.dirname(__FILE__), "../spec/fixtures/#{filepath}")
    )
  end #path_to
end # CartoDB::Geocoder

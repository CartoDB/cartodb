# encoding: utf-8

require_relative '../../lib/datasources'

include CartoDB::Datasources

describe Url::PublicUrl do

  describe '#basic_tests' do
    it 'Some basic download flows of this file provider, including error handling' do
      url_provider = Url::PublicUrl.get_new

      file_url = 'http://cartodb.com/'
      invalid_url = 'http://cartodb.com/non_existant_page'

      data = url_provider.get_resource(file_url)
      data.empty?.should eq false

      expect {
        url_provider.get_resource(invalid_url)
      }.to raise_exception DataDownloadError

      url_provider.fetch_headers(file_url)
      url_provider.etag_header.empty?.should eq false

      url_provider.fetch_headers(invalid_url).should == {}

      url_provider.etag_header.should be_empty

      url_provider.last_modified_header.should be_empty

      # puts data
    end
  end

end

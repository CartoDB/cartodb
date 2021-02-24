require 'spec_helper_min'
require_relative '../../lib/datasources'
require_relative '../../../../spec/helpers/file_server_helper'

include CartoDB::Datasources
include FileServerHelper

describe Url::PublicUrl do

  describe '#basic_tests' do
    it 'Some basic download flows of this file provider, including error handling' do
      url_provider = Url::PublicUrl.get_new

      serve_file 'spec/support/data/cartofante_blue.png' do |url|
        invalid_url = url + 'invalid'

        data = url_provider.get_resource(url)
        data.empty?.should eq false
        expect {
          url_provider.get_resource(invalid_url)
        }.to raise_exception DataDownloadError

        url_provider.fetch_headers(url)
        url_provider.etag_header.empty?.should eq false

        url_provider.fetch_headers(invalid_url).should == {}

        url_provider.etag_header.should be_empty

        url_provider.last_modified_header.should be_empty

        # puts data
      end
    end
  end

end

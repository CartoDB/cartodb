# encoding: utf-8

require_relative '../../lib/synchronizer/file-providers/public_url_provider'

include CartoDB::Synchronizer::FileProviders

describe PublicUrlProvider do

  describe '#basic_tests' do
    it 'Some basic download flows of this file provider, including error handling' do
      url_provider = PublicUrlProvider.get_new()

      file_url = 'http://cartodb.com/'
      invalid_url = 'http://cartodb.com/non_existant_page'

      data = url_provider.download_file(file_url)
      data.empty?.should eq false

      expect {
        url_provider.download_file(invalid_url)
      }.to raise_exception DownloadError

      url_provider.fetch_headers(file_url)
      url_provider.etag_header.empty?.should eq false

      expect {
        url_provider.fetch_headers(invalid_url)
      }.to raise_exception DownloadError

      expect {
        url_provider.etag_header
      }.to raise_exception UninitializedError

      expect {
        url_provider.last_modified_header
      }.to raise_exception UninitializedError

      #puts data
    end
  end

end


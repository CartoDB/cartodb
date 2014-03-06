# encoding: utf-8

require_relative '../../lib/synchronizer/file-providers/dropbox_provider'

include CartoDB::Synchronizer::FileProviders

describe DropboxProvider do

  def get_config
    {
      app_key: '',
      app_secret: ''
    }
  end #get_config

  describe '#filters' do
    it 'test that filter options work correctly' do
      dropbox_provider = DropboxProvider.get_new(get_config)

      # No filter = all formats allowed
      expected_formats = []
      DropboxProvider::FORMATS_TO_SEARCH_QUERIES.each do |id, search_queries|
        search_queries.each do |search_query|
          expected_formats = expected_formats.push(search_query)
        end
      end
      dropbox_provider.setup_formats_filter()
      dropbox_provider.formats.should eq expected_formats

      # Filter to 'documents'
      expected_formats = []
      format_ids = [ DropboxProvider::FORMAT_CSV, DropboxProvider::FORMAT_EXCEL ]
      DropboxProvider::FORMATS_TO_SEARCH_QUERIES.each do |id, search_queries|
        if format_ids.include?(id)
          search_queries.each do |search_query|
            expected_formats = expected_formats.push(search_query)
          end
        end
      end
      dropbox_provider.setup_formats_filter(format_ids)
      dropbox_provider.formats.should eq expected_formats
    end
  end #run

end


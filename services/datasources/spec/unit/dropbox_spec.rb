require 'spec_helper_min'
require_relative '../../lib/datasources'
require_relative '../doubles/user'

include CartoDB::Datasources

describe Url::Dropbox do

  def get_config
    {
      'app_key' => '',
      'app_secret' => '',
      'callback_url' => ''
    }
  end #get_config

  describe '#filters' do
    it 'test that filter options work correctly' do
      user_mock = CartoDB::Datasources::Doubles::User.new

      dropbox_provider = Url::Dropbox.get_new(get_config, user_mock)

      # No filter = all formats allowed
      filter = []
      Url::Dropbox::FORMATS_TO_SEARCH_QUERIES.each do |id, search_queries|
        search_queries.each do |search_query|
          filter = filter.push(search_query)
        end
      end
      dropbox_provider.filter.should eq filter

      # Filter to 'documents'
      filter = []
      format_ids = [ Url::Dropbox::FORMAT_CSV, Url::Dropbox::FORMAT_EXCEL ]
      Url::Dropbox::FORMATS_TO_SEARCH_QUERIES.each do |id, search_queries|
        if format_ids.include?(id)
          search_queries.each do |search_query|
            filter = filter.push(search_query)
          end
        end
      end
      dropbox_provider.filter = format_ids
      dropbox_provider.filter.should eq filter
    end
  end #run

end

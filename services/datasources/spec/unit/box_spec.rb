require 'spec_helper_min'
require_relative '../../lib/datasources'
require_relative '../doubles/user'

include CartoDB::Datasources

describe Url::Box do
  def get_config
    {
      'box_host' => '',
      'application_name' => '',
      'client_id' => '',
      'client_secret' => '',
      'callback_url' => ''
    }
  end

  describe '#filters' do
    it 'test that filter sets correctly' do
      user_mock = CartoDB::Datasources::Doubles::User.new

      box_provider = Url::Box.get_new(get_config, user_mock)

      box_provider.filter.should eq nil

      # Filter to 'documents'
      formats = ['csv', 'xls']
      box_provider.filter = formats
      box_provider.filter.should eq formats
    end
  end
end

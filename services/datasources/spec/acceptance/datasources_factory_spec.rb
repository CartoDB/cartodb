# encoding: utf-8

require 'yaml'
require_relative '../../../../spec/rspec_configuration'

require_relative '../../lib/datasources'
require_relative '../doubles/user'

include CartoDB::Datasources

describe DatasourcesFactory do

  def get_config
    @config ||= YAML.load_file("#{File.dirname(__FILE__)}/../../../../config/app_config.yml")['defaults']
  end

  describe '#provider_instantiations' do
    it 'tests all available provider instantiations' do
      user_mock = CartoDB::Datasources::Doubles::User.new
      DatasourcesFactory.set_config(get_config)

      dropbox_provider = DatasourcesFactory.get_datasource(Url::Dropbox::DATASOURCE_NAME, user_mock)
      dropbox_provider.is_a?(Url::Dropbox).should eq true

      dropbox_provider = DatasourcesFactory.get_datasource(Url::Box::DATASOURCE_NAME, user_mock)
      dropbox_provider.is_a?(Url::Box).should eq true

      # Stubs Google Drive client for connectionless testing
      Google::APIClient.any_instance.stubs(:discovered_api)
      gdrive_provider = DatasourcesFactory.get_datasource(Url::GDrive::DATASOURCE_NAME, user_mock)
      gdrive_provider.is_a?(Url::GDrive).should eq true

      url_provider = DatasourcesFactory.get_datasource(Url::PublicUrl::DATASOURCE_NAME, user_mock)
      url_provider.is_a?(Url::PublicUrl).should eq true

      twitter_provider = DatasourcesFactory.get_datasource(Search::Twitter::DATASOURCE_NAME, user_mock)
      twitter_provider.is_a?(Search::Twitter).should eq true

      nil_provider = DatasourcesFactory.get_datasource(nil, user_mock)
      nil_provider.nil?.should eq true

      expect {
        DatasourcesFactory.get_datasource('blablabla...', user_mock)
      }.to raise_exception MissingConfigurationError
    end
  end

end

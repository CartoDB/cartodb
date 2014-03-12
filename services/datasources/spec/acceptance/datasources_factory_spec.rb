# encoding: utf-8

require 'yaml'

require_relative '../../lib/datasources'

include CartoDB::Datasources

describe DatasourcesFactory do

  def get_config
    @config ||= YAML.load_file("#{File.dirname(__FILE__)}/../../../../config/app_config.yml")['defaults']['oauth']
  end #get_config

  describe '#provider_instantiations' do
    it 'tests all available provider instantiations' do
      DatasourcesFactory.set_config(get_config)

      dropbox_provider = DatasourcesFactory.get_datasource(Url::Dropbox::DATASOURCE_NAME)
      dropbox_provider.kind_of?(Url::Dropbox).should eq true

      gdrive_provider = DatasourcesFactory.get_datasource(Url::GDrive::DATASOURCE_NAME)
      gdrive_provider.kind_of?(Url::GDrive).should eq true

      gdrive_provider = DatasourcesFactory.get_datasource(Url::PublicUrl::DATASOURCE_NAME)
      gdrive_provider.kind_of?(Url::PublicUrl).should eq true

      expect {
        DatasourcesFactory.get_datasource('blablabla...')
      }.to raise_exception ConfigurationError

    end
  end

end


# encoding: utf-8

require_relative '../../lib/synchronizer/file-providers/provider_factory'
require 'yaml'

include CartoDB::Synchronizer::FileProviders

describe ProviderFactory do

  def get_config
    @config ||= YAML.load_file("#{File.dirname(__FILE__)}/../../../../config/app_config.yml")['defaults']['oauth']
  end #get_config

  describe '#provider_instantiations' do
    it 'tests all available provider instantiations' do
      ProviderFactory.set_providers_config(get_config)

      dropbox_provider = ProviderFactory.get_provider(DropboxProvider::SERVICE)
      dropbox_provider.kind_of?(DropboxProvider).should eq true

      gdrive_provider = ProviderFactory.get_provider(GDriveProvider::SERVICE)
      gdrive_provider.kind_of?(GDriveProvider).should eq true

      gdrive_provider = ProviderFactory.get_provider(PublicUrlProvider::SERVICE)
      gdrive_provider.kind_of?(PublicUrlProvider).should eq true

      expect {
        ProviderFactory.get_provider('blablabla...')
      }.to raise_exception ConfigurationError

    end
  end

end


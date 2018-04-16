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
      user = FactoryGirl.build(:user)
      user.stubs('has_feature_flag?').with('gnip_v2').returns(false)
      DatasourcesFactory.set_config(get_config)

      dropbox_provider = DatasourcesFactory.get_datasource(Url::Dropbox::DATASOURCE_NAME, user)
      dropbox_provider.is_a?(Url::Dropbox).should eq true

      dropbox_provider = DatasourcesFactory.get_datasource(Url::Box::DATASOURCE_NAME, user)
      dropbox_provider.is_a?(Url::Box).should eq true

      # Stubs Google Drive client for connectionless testing
      Google::APIClient.any_instance.stubs(:discovered_api)
      gdrive_provider = DatasourcesFactory.get_datasource(Url::GDrive::DATASOURCE_NAME, user)
      gdrive_provider.is_a?(Url::GDrive).should eq true

      url_provider = DatasourcesFactory.get_datasource(Url::PublicUrl::DATASOURCE_NAME, user)
      url_provider.is_a?(Url::PublicUrl).should eq true

      twitter_provider = DatasourcesFactory.get_datasource(Search::Twitter::DATASOURCE_NAME, user)
      twitter_provider.is_a?(Search::Twitter).should eq true

      nil_provider = DatasourcesFactory.get_datasource(nil, user)
      nil_provider.nil?.should eq true

      expect {
        DatasourcesFactory.get_datasource('blablabla...', user)
      }.to raise_exception MissingConfigurationError
    end
  end

  describe '#customized_config?' do
    let(:twitter_datasource) { CartoDB::Datasources::Search::Twitter::DATASOURCE_NAME }

    before(:each) do
      @config = get_config
    end

    it 'returns false for a random user' do
      user = FactoryGirl.build(:carto_user, username: 'wadus')
      DatasourcesFactory.customized_config?(twitter_datasource, user).should be_false
    end

    it 'returns true for a user with custom config' do
      user = FactoryGirl.build(:carto_user, username: 'wadus')
      @config['datasource_search']['twitter_search']['customized_user_list'] = [user.username]
      DatasourcesFactory.set_config(@config)

      DatasourcesFactory.customized_config?(twitter_datasource, user).should be_true
    end

    it 'returns true for a user in an organization with custom config' do
      organization = FactoryGirl.build(:organization, name: 'wadus-org')
      user = FactoryGirl.build(:carto_user, username: 'nowadus', organization: organization)
      @config['datasource_search']['twitter_search']['customized_orgs_list'] = [organization.name]
      DatasourcesFactory.set_config(@config)

      DatasourcesFactory.customized_config?(twitter_datasource, user).should be_true
    end
  end
end

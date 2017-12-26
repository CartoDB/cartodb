require 'spec_helper_min'
require 'support/helpers'

describe Carto::Api::ConnectorsController do
  include HelperMethods
  include_context 'organization with users helper'

  before(:all) do
    FactoryGirl.create(:carto_feature_flag, name: 'carto-connectors', restricted: false)
    @user = FactoryGirl.create(:carto_user)
    @connector_provider_postgres = FactoryGirl.create(:connector_provider, name: 'postgres')
    @connector_provider_hive = FactoryGirl.create(:connector_provider, name: 'hive')
    @connector_config_user = FactoryGirl.create(:connector_configuration,
                                                 user_id: @user.id,
                                                 connector_provider_id: @connector_provider_postgres.id,
                                                 enabled: true,
                                                 max_rows: 100)
    @connector_config_org_user = FactoryGirl.create(:connector_configuration,
                                                     user_id: @org_user_1.id,
                                                     connector_provider_id: @connector_provider_hive.id,
                                                     enabled: false,
                                                     max_rows: 100)
    @connector_config_org = FactoryGirl.create(:connector_configuration,
                                                organization_id: @organization.id,
                                                connector_provider_id: @connector_provider_hive.id,
                                                enabled: true,
                                                max_rows: 100)
  end

  after(:all) do
    Carto::FeatureFlag.destroy_all
    @user.destroy
    @connector_config_user.destroy
    @connector_config_org_user.destroy
    @connector_config_org.destroy
    @connector_provider_postgres.destroy
    @connector_provider_hive.destroy
  end

  describe '#index' do
    it 'returns provider enabled for regular user' do
      get_json api_v1_connectors_index_url(user_domain: @user.username, api_key: @user.api_key), {}, @headers do |response|
        response.status.should be_success
        response.body[:postgres][:name].should eq "PostgreSQL"
        response.body[:postgres][:enabled].should eq true
      end
    end

    it 'returns provider false for organization user' do
      get_json api_v1_connectors_index_url(user_domain: @org_user_1.username,
                                           api_key: @org_user_1.api_key), {}, @headers do |response|
        response.status.should be_success
        response.body[:hive][:name].should eq "Hive"
        response.body[:hive][:enabled].should eq false
      end
    end

    it 'returns provider true for organization' do
      get_json api_v1_connectors_index_url(user_domain: @org_user_2.username,
                                           api_key: @org_user_2.api_key), {}, @headers do |response|
        response.status.should be_success
        response.body[:hive][:name].should eq "Hive"
        response.body[:hive][:enabled].should eq true
      end
    end
  end

  describe '#show' do
    it 'returns provider information for regular user' do
      get_json api_v1_connectors_show_url(provider_id: 'postgres', user_domain: @user.username, api_key: @user.api_key), {}, @headers do |response|
        response.status.should be_success
        response.body[:features][:sql_queries].should eq true
        response.body[:features][:list_tables].should eq true
        response.body[:parameters][:table][:required].should eq true
        response.body[:parameters][:connection][:database][:required].should eq true
        response.body[:parameters][:connection][:username][:required].should eq true
        response.body[:parameters][:connection][:port][:required].should eq false
      end
    end
    it 'returns 422 if provider doesn\'t exists' do
      get_json api_v1_connectors_show_url(provider_id: 'unknown', user_domain: @user.username, api_key: @user.api_key), {}, @headers do |response|
        response.status.should eq 422
      end
    end
  end

  describe '#tables' do
    before(:each) do
      pending "Provision odbc_fdw in CI server"
    end
    it 'returns connector tables list' do
      get_json api_v1_connectors_tables_url(provider_id: 'postgres', user_domain: @user.username, api_key: @user.api_key, server: 'localhost', port: '5432', database: 'carto_db_test', username: 'postgres'), {}, @headers do |response|
        response.status.should be_success
        response.body[0]["schema"].should eq "public"
        response.body[0]["name"].blank?.should eq false
      end
    end
  end

  describe '#connect' do
    before(:each) do
      pending "Provision odbc_fdw in CI server"
    end
    it 'returns true if connection went ok' do
      get_json api_v1_connectors_connect_url(provider_id: 'postgres', user_domain: @user.username, api_key: @user.api_key, server: 'localhost', port: '5432', database: 'carto_db_test', username: 'postgres'), {}, @headers do |response|
        response.status.should be_success
        response.body[:connected].should eq true
      end
    end
    it 'returns 400 if connection went ko' do
      get_json api_v1_connectors_connect_url(provider_id: 'postgres', user_domain: @user.username, api_key: @user.api_key, server: 'localhost', port: '5432', database: 'unknown_db', username: 'postgres'), {}, @headers do |response|
        response.status.should be 400
        response.body[:errors].present?.should eq true
      end
    end
  end
end

require 'spec_helper_min'
require 'support/helpers'
require_relative '../../../../services/importer/spec/doubles/connector'

describe Carto::Api::ConnectorsController do
  include HelperMethods
  include_context 'organization with users helper'

  before(:all) do
    create(:feature_flag, name: 'carto-connectors', restricted: false)
    @user = create(:carto_user)

    @previous_providers = replace_connector_providers(
      dummy_connector_provider_with_id('postgres', 'PostgreSQL'),
      dummy_connector_provider_with_id('hive', 'Hive'),
      dummy_connector_provider_with_id(
        'bigquery', 'BigQuery',
        'sql_queries': false,
        'list_databases': true,
        'list_tables': true,
        'preview_table': true,
        'dry_run': true,
        'list_projects': true
      )
    )

    @connector_provider_postgres = Carto::ConnectorProvider.find_by(name: 'postgres')
    @connector_provider_hive = Carto::ConnectorProvider.find_by(name: 'hive')

    @connector_config_user = create(:connector_configuration,
                                                 user_id: @user.id,
                                                 connector_provider_id: @connector_provider_postgres.id,
                                                 enabled: true,
                                                 max_rows: 100)
    @connector_config_org_user = create(:connector_configuration,
                                                     user_id: @org_user_1.id,
                                                     connector_provider_id: @connector_provider_hive.id,
                                                     enabled: false,
                                                     max_rows: 100)
    @connector_config_org = create(:connector_configuration,
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
    restore_connector_providers(@previous_providers)
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
        response.body[:features][:sql_queries].should eq false
        response.body[:features][:list_tables].should eq true
        response.body[:parameters][:table][:required].should eq true
        response.body[:parameters][:req1][:required].should eq true
        response.body[:parameters][:req2][:required].should eq true
        response.body[:parameters][:opt1][:required].should eq false
        response.body[:parameters][:opt2][:required].should eq false
      end
    end
    it 'returns 422 if provider doesn\'t exists' do
      get_json api_v1_connectors_show_url(provider_id: 'unknown', user_domain: @user.username, api_key: @user.api_key), {}, @headers do |response|
        response.status.should eq 422
      end
    end
  end

  describe '#tables' do
    it 'returns connector tables list' do
      get_json api_v1_connectors_tables_url(provider_id: 'postgres', user_domain: @user.username, api_key: @user.api_key), {}, @headers do |response|
        response.status.should be_success
        response.body[0]["schema"].should eq "s1"
        response.body[0]["name"].blank?.should eq false
      end
    end
    it 'returns 422 if provider doesn\'t exists' do
      get_json api_v1_connectors_tables_url(provider_id: 'unknown', user_domain: @user.username, api_key: @user.api_key), {}, @headers do |response|
        response.status.should eq 422
      end
    end
  end

  describe '#connect' do
    it 'returns true if connection went ok' do
      get_json api_v1_connectors_connect_url(provider_id: 'postgres', user_domain: @user.username, api_key: @user.api_key), {}, @headers do |response|
        response.status.should be_success
        response.body[:connected].should eq true
      end
    end
    it 'returns 422 if provider doesn\'t exists' do
      get_json api_v1_connectors_connect_url(provider_id: 'unknown', user_domain: @user.username, api_key: @user.api_key), {}, @headers do |response|
        response.status.should eq 422
      end
    end
    it 'returns false if connection went ko' do
      Carto::Connector.provider_class('postgres').failing_with('CONNECTION PROBLEM') do
        get_json api_v1_connectors_connect_url(provider_id: 'postgres', user_domain: @user.username, api_key: @user.api_key), {}, @headers do |response|
          response.body[:connected].should eq false
        end
      end
    end
  end

  describe '#dryrun' do
    it 'returns 422 if not supported' do
      post_json api_v1_connectors_dryrun_url(provider_id: 'postgres', user_domain: @user.username, api_key: @user.api_key), {}  do |response|
        response.status.should eq 422
      end
    end

    it 'returns dry-run information' do
      post_json api_v1_connectors_dryrun_url(provider_id: 'bigquery', user_domain: @user.username, api_key: @user.api_key), {} do |response|
        response.status.should be_success
        response.body.keys.should include(:dry_run_results)
      end
    end

    it 'returns 400 in case of failure' do
      Carto::Connector.provider_class('bigquery').failing_with('BIG PROBLEM') do
        post_json api_v1_connectors_dryrun_url(provider_id: 'bigquery', user_domain: @user.username, api_key: @user.api_key), {} do |response|
          response.status.should be 400
          response.body[:errors].present?.should eq true
          response.body[:errors].should match /BIG PROBLEM/m
        end
      end
    end
  end

  describe '#projects' do
    it 'returns 422 if not supported' do
      get_json api_v1_connectors_projects_url(provider_id: 'postgres', user_domain: @user.username, api_key: @user.api_key), {}, @headers do |response|
        response.status.should eq 422
      end
    end

    it 'returns connector projects list' do
      get_json api_v1_connectors_projects_url(provider_id: 'bigquery', user_domain: @user.username, api_key: @user.api_key), {}, @headers do |response|
        response.status.should be_success
        response.body.should eq [
          { 'id' => 'project-1', 'friendly_name' => "Project 1" },
          { 'id' => 'project-2', 'friendly_name' => "Project 2" }
        ]
      end
    end

    it 'returns 422 if provider doesn\'t exists' do
      get_json api_v1_connectors_projects_url(provider_id: 'unknown', user_domain: @user.username, api_key: @user.api_key), {}, @headers do |response|
        response.status.should eq 422
      end
    end
  end

  describe '#project_datasets' do
    it 'returns 422 if not supported' do
      get_json api_v1_connectors_project_datasets_url(provider_id: 'postgres', user_domain: @user.username, api_key: @user.api_key, project_id: 'my-project', server: 'localhost', port: '5432', database: 'carto_db_test', username: 'postgres'), {}, @headers do |response|
        response.status.should eq 422
      end
    end

    it 'returns connector project datasets list' do
      get_json api_v1_connectors_project_datasets_url(provider_id: 'bigquery', user_domain: @user.username, api_key: @user.api_key, project_id: 'my-project'), {}, @headers do |response|
        response.status.should be_success
        response.body.should eq [
          { 'id' => 'data-1', 'qualified_name' => "my-project.data-1" },
          { 'id' => 'data-2', 'qualified_name' => "my-project.data-2" }
        ]
      end
    end

    it 'returns 422 if provider doesn\'t exists' do
      get_json api_v1_connectors_project_datasets_url(provider_id: 'unknown', user_domain: @user.username, api_key: @user.api_key, project_id: 'my-project'), {}, @headers do |response|
        response.status.should eq 422
      end
    end
  end

  describe '#project_dataset_tables' do
    it 'returns 422 if not supported' do
      get_json api_v1_connectors_project_dataset_tables_url(provider_id: 'postgres', user_domain: @user.username, api_key: @user.api_key, project_id: 'my-project', dataset_id: 'my-dataset', server: 'localhost', port: '5432', database: 'carto_db_test', username: 'postgres'), {}, @headers do |response|
        response.status.should eq 422
      end
    end

    it 'returns connector project dataset tables list' do
      get_json api_v1_connectors_project_dataset_tables_url(provider_id: 'bigquery', user_domain: @user.username, api_key: @user.api_key, project_id: 'my-project', dataset_id: 'my-dataset'), {}, @headers do |response|
        response.status.should be_success
        response.body.should eq [
          { 'id' => 't-1', 'qualified_name' => "my-project.my-dataset.t-1" },
          { 'id' => 't-2', 'qualified_name' => "my-project.my-dataset.t-2" }
        ]
      end
    end

    it 'returns 422 if provider doesn\'t exists' do
      get_json api_v1_connectors_project_dataset_tables_url(provider_id: 'unknown', user_domain: @user.username, api_key: @user.api_key, project_id: 'my-project', dataset_id: 'my-dataset'), {}, @headers do |response|
        response.status.should eq 422
      end
    end
  end
end

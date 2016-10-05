# encoding: utf-8
require_relative '../../../../spec/spec_helper'
require_relative '../../lib/importer/connector_runner'
require_relative '../../lib/importer/job'

require_relative '../doubles/importer_stats'
require_relative '../doubles/loader'
require_relative '../doubles/log'
require_relative '../doubles/indexer'
require_relative '../factories/pg_connection'
require_relative '../doubles/user'
require_relative '../doubles/input_file_size_limit'
require_relative '../doubles/table_row_count_limit'
require_relative '../../../../spec/helpers/feature_flag_helper'

describe CartoDB::Importer2::ConnectorRunner do
  before(:all) do
    @user = create_user
    @user.save
    @pg_options = @user.db_service.db_configuration_for
    @feature_flag = FactoryGirl.create(:feature_flag, name: 'carto-connectors', restricted: true)
    @fake_log = CartoDB::Importer2::Doubles::Log.new(@user)
    @providers = %w(mysql postgres sqlserver hive)
    @fake_log.clear
    Carto::Connector.providers(all: true).keys.each do |provider_name|
      Carto::ConnectorProvider.create! name: provider_name
    end
  end

  before(:each) do
    CartoDB::Stats::Aggregator.stubs(:read_config).returns({})
    @fake_log.clear
  end

  after(:all) do
    @user.destroy
    @feature_flag.destroy
    Carto::Connector.providers(all: true).keys.each do |provider_name|
      Carto::ConnectorProvider.find_by_name(provider_name).destroy
    end
  end

  include FeatureFlagHelper

  describe 'with working connectors' do
    before(:all) do
      # Simulate connector success by ignoring all db opeartions
      Carto::Connector::Context.any_instance.stubs(:execute_as_superuser).returns(nil)
      Carto::Connector::Context.any_instance.stubs(:execute).returns(nil)
    end

    it "Succeeds if parameters are correct" do
      with_feature_flag @user, 'carto-connectors', true do
        parameters = {
          connection: {
            server:   'theserver',
            username: 'theuser',
            password: 'thepassword',
            database: 'thedatabase'
          },
          table:    'thetable',
          encoding: 'theencoding'
        }
        options = {
          pg:   @pg_options,
          log:  @fake_log,
          user: @user
        }
        @providers.each do |provider|
          config = { provider => { 'enabled' => true } }
          Cartodb.with_config connectors: config do
            connector = CartoDB::Importer2::ConnectorRunner.new(parameters.merge(provider: provider).to_json, options)
            connector.run
            connector.success?.should be true
            connector.provider_name.should eq provider
          end
        end
      end
    end

    it "Fails if parameters are invalid" do
      with_feature_flag @user, 'carto-connectors', true do
        parameters = {
          connection: {
            server:   'theserver',
            username: 'theuser',
            password: 'thepassword',
            database: 'thedatabase'
          },
          table:    'thetable',
          encoding: 'theencoding',
          invalid_parameter: 'xyz'
        }
        options = {
          pg:   @pg_options,
          log:  @fake_log,
          user: @user
        }
        @providers.each do |provider|
          config = { provider => { 'enabled' => true } }
          Cartodb.with_config connectors: config do
            connector = CartoDB::Importer2::ConnectorRunner.new(parameters.merge(provider: provider).to_json, options)
            connector.run
            connector.success?.should be false
            connector.provider_name.should eq provider
            @fake_log.to_s.should match /Invalid parameters: invalid_parameter/m
          end
        end
      end
    end

    it "Fails without the feature flag" do
      with_feature_flag @user, 'carto-connectors', false do
        parameters = {
          connection: {
            server:   'theserver',
            username: 'theuser',
            password: 'thepassword',
            database: 'thedatabase'
          },
          table:    'thetable',
          encoding: 'theencoding'
        }
        options = {
          pg:   @pg_options,
          log:  @fake_log,
          user: @user
        }
        @providers.each do |provider|
          config = { provider => { 'enabled' => true } }
          Cartodb.with_config connectors: config do
            expect {
              connector = CartoDB::Importer2::ConnectorRunner.new(parameters.merge(provider: provider).to_json, options)
              connector.run
            }.to raise_error(Carto::Connector::ConnectorsDisabledError)
          end
        end
      end
    end

    it "Fails if provider is not available" do
      with_feature_flag @user, 'carto-connectors', true do
        parameters = {
          connection: {
            server:   'theserver',
            username: 'theuser',
            password: 'thepassword',
            database: 'thedatabase'
          },
          table:    'thetable',
          encoding: 'theencoding'
        }
        options = {
          pg:   @pg_options,
          log:  @fake_log,
          user: @user
        }
        @providers.each do |provider|
          config = { provider => { 'enabled' => false } }
          Cartodb.with_config connectors: config do
            expect {
              connector = CartoDB::Importer2::ConnectorRunner.new(parameters.merge(provider: provider).to_json, options)
              connector.run
            }.to raise_error(Carto::Connector::ConnectorsDisabledError)
          end
        end
      end
    end
  end

  describe 'with failing connectors' do
    before(:all) do
      # Simulate connector success when executing non-privileged SQL
      Carto::Connector::Context.any_instance.stubs(:execute_as_superuser).returns(nil)
      Carto::Connector::Context.any_instance.stubs(:execute).raises("SQL EXECUTION ERROR")
    end

    it "Always fails" do
      with_feature_flag @user, 'carto-connectors', true do
        parameters = {
          connection: {
            server:   'theserver',
            username: 'theuser',
            password: 'thepassword',
            database: 'thedatabase'
          },
          table:    'thetable',
          encoding: 'theencoding'
        }
        options = {
          pg:   @pg_options,
          log:  @fake_log,
          user: @user
        }
        @providers.each do |provider|
          config = { provider => { 'enabled' => true } }
          Cartodb.with_config connectors: config do
            connector = CartoDB::Importer2::ConnectorRunner.new(parameters.merge(provider: provider).to_json, options)
            connector.run
            connector.success?.should be false
            connector.provider_name.should eq provider
            @fake_log.to_s.should match /SQL EXECUTION ERROR/m
          end
        end
      end
    end
  end

  describe 'with invalid provider' do
    Carto::Connector::Context.any_instance.stubs(:execute_as_superuser).returns(nil)
    Carto::Connector::Context.any_instance.stubs(:execute).returns(nil)

    it "Fails at creation" do
      with_feature_flag @user, 'carto-connectors', true do
        parameters = {
          provider: 'invalid_provider',
          connection: {
            server:   'theserver',
            username: 'theuser',
            password: 'thepassword',
            database: 'thedatabase'
          },
          table:    'thetable',
          encoding: 'theencoding'
        }
        options = {
          pg:   @pg_options,
          log:  @fake_log,
          user: @user
        }
        expect {
          CartoDB::Importer2::ConnectorRunner.new(parameters.to_json, options)
        }.to raise_error(Carto::Connector::InvalidParametersError)
      end
    end
  end

  it "Fails if provider is not available for the user" do

    @providers.each do |provider|
      connector_provider = Carto::ConnectorProvider.find_by_name(provider)
      Carto::ConnectorConfiguration.create!(
        connector_provider_id: connector_provider.id,
        user_id: @user.id,
        enabled: false
      )
    end

    with_feature_flag @user, 'carto-connectors', true do
      parameters = {
        connection: {
          server:   'theserver',
          username: 'theuser',
          password: 'thepassword',
          database: 'thedatabase'
        },
        table:    'thetable',
        encoding: 'theencoding'
      }
      options = {
        pg:   @pg_options,
        log:  @fake_log,
        user: @user
      }
      @providers.each do |provider|
        config = { provider => { 'enabled' => true } }

        Cartodb.with_config connectors: config do
          expect {
            connector = CartoDB::Importer2::ConnectorRunner.new(parameters.merge(provider: provider).to_json, options)
            connector.run
          }.to raise_error(Carto::Connector::ConnectorsDisabledError)
        end
      end
    end

    Carto::ConnectorConfiguration.where(user_id: @user.id).destroy_all
  end

  # TODO: check Runner compatibility
end

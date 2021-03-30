require_relative '../../../../spec/spec_helper'
require_relative '../../lib/importer/connector_runner'
require_relative '../../lib/importer/job'

require_relative '../doubles/importer_stats'
require_relative '../doubles/loader'
require_relative '../doubles/log'
require_relative '../doubles/indexer'
require_relative '../factories/pg_connection'
require_relative '../doubles/user'
require_relative '../../../../spec/helpers/feature_flag_helper'
require_relative '../doubles/connector'

describe CartoDB::Importer2::ConnectorRunner do
  before(:all) do
    @user = create_user
    @user.save
    @pg_options = @user.db_service.db_configuration_for
    @feature_flag = create(:feature_flag, name: 'carto-connectors', restricted: true)
    @fake_log = CartoDB::Importer2::Doubles::Log.new(@user)
    @providers = %w(dummy)
    @fake_log.clear
    @previous_providers = replace_connector_providers(DummyConnectorProvider, DummyConnectorProviderWithModifiedDate)
  end

  before(:each) do
    CartoDB::Stats::Aggregator.stubs(:read_config).returns({})
    @fake_log.clear
  end

  after(:all) do
    @user.destroy
    @feature_flag.destroy
    restore_connector_providers(@previous_providers)
  end

  after(:each) do
    DummyConnectorProvider.copies.clear
    DummyConnectorProviderWithModifiedDate.copies.clear
  end

  include FeatureFlagHelper

  describe 'with working connectors' do
    it "Succeeds if parameters are correct" do
      with_feature_flag @user, 'carto-connectors', true do
        parameters = {
          table:    'thetable',
          req1: 'a',
          req2: 'b',
          opt1: 'c'
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
        DummyConnectorProvider.copies.size.should eq 1
        DummyConnectorProvider.copies[0][0].should eq 'cdb_importer'
        DummyConnectorProvider.copies[0][1].should match /\Aimporter_/
      end
    end

    it "Fails if parameters are invalid" do
      with_feature_flag @user, 'carto-connectors', true do
        parameters = {
          table:    'thetable',
          req1: 'a',
          req2: 'b',
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

    it "Fails if parameters are missing" do
      with_feature_flag @user, 'carto-connectors', true do
        parameters = {
          table:    'thetable',
          req1: 'a',
          opt1: 'c'
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
            @fake_log.to_s.should match /Error Missing required parameters req2/m
          end
        end
      end
    end

    it "Fails without the feature flag" do
      with_feature_flag @user, 'carto-connectors', false do
        parameters = {
          table:    'thetable',
          req1: 'a',
          req2: 'b'
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
          table:    'thetable',
          req1: 'a',
          req2: 'b',
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
    it "Always fails" do
      with_feature_flag @user, 'carto-connectors', true do
        parameters = {
          table:    'thetable',
          req1: 'a',
          req2: 'b'
        }
        options = {
          pg:   @pg_options,
          log:  @fake_log,
          user: @user
        }
        @providers.each do |provider|
          Carto::Connector.provider_class(provider).failing_with('COPY ERROR') do
            config = { provider => { 'enabled' => true } }
            Cartodb.with_config connectors: config do
              connector = CartoDB::Importer2::ConnectorRunner.new(parameters.merge(provider: provider).to_json, options)
              connector.run
              connector.success?.should be false
              connector.provider_name.should eq provider
              @fake_log.to_s.should match /COPY ERROR/m
            end
          end
        end
      end
    end
  end

  describe 'with invalid provider' do

    it "Fails when accessing the connector" do
      with_feature_flag @user, 'carto-connectors', true do
        parameters = {
          provider: 'invalid_provider',
          table:    'thetable',
          req1: 'a',
          req2: 'b'
        }
        options = {
          pg:   @pg_options,
          log:  @fake_log,
          user: @user
        }
        expect {
          runner = CartoDB::Importer2::ConnectorRunner.new(parameters.to_json, options)
          runner.connector
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
        table:    'thetable',
        req1: 'a',
        req2: 'b'
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

  it "Passes global configuration limits to the provider" do
    with_feature_flag @user, 'carto-connectors', true do
      parameters = {
        table:    'thetable',
        req1: 'a',
        req2: 'b',
        opt1: 'c'
      }
      options = {
        pg:   @pg_options,
        log:  @fake_log,
        user: @user
      }
      @providers.each do |provider|
        config = { provider => { 'enabled' => true, 'max_rows' => 10 } }
        Cartodb.with_config connectors: config do
          connector = CartoDB::Importer2::ConnectorRunner.new(parameters.merge(provider: provider).to_json, options)
          connector.run
        end
      end
      DummyConnectorProvider.copies.map(&:last).uniq.should eq [{enabled: true, max_rows: 10}]
    end
  end

  it "Avoids copying data that hasn't changed" do
    with_feature_flag @user, 'carto-connectors', true do
      parameters = {
        table:    'thetable',
        req1: 'a',
        req2: 'b',
        opt1: 'c'
      }
      provider = DummyConnectorProviderWithModifiedDate.provider_id
      date_the_data_was_modified = DummyConnectorProviderWithModifiedDate::LAST_MODIFIED
      date_the_data_was_last_copied = date_the_data_was_modified
      options = {
        pg:   @pg_options,
        log:  @fake_log,
        user: @user,
        previous_last_modified: date_the_data_was_last_copied
      }
      config = { provider => { 'enabled' => true } }
      Cartodb.with_config connectors: config do
        connector = CartoDB::Importer2::ConnectorRunner.new(parameters.merge(provider: provider).to_json, options)
        connector.run
        connector.success?.should be true
        connector.provider_name.should eq provider
      end
      DummyConnectorProviderWithModifiedDate.copies.size.should eq 0
    end
  end

  it "Copies data that has changed" do
    with_feature_flag @user, 'carto-connectors', true do
      parameters = {
        table:    'thetable',
        req1: 'a',
        req2: 'b',
        opt1: 'c'
      }
      options = {
        pg:   @pg_options,
        log:  @fake_log,
        user: @user
      }
      provider = DummyConnectorProviderWithModifiedDate.provider_id
      date_the_data_was_modified = DummyConnectorProviderWithModifiedDate::LAST_MODIFIED
      date_the_data_was_last_copied = date_the_data_was_modified - 1
      config = { provider => { 'enabled' => true }, previous_last_modified: date_the_data_was_last_copied }
      Cartodb.with_config connectors: config do
        connector = CartoDB::Importer2::ConnectorRunner.new(parameters.merge(provider: provider).to_json, options)
        connector.run
        connector.success?.should be true
        connector.provider_name.should eq provider
      end
      DummyConnectorProviderWithModifiedDate.copies.size.should eq 1
      DummyConnectorProviderWithModifiedDate.copies[0][0].should eq 'cdb_importer'
      DummyConnectorProviderWithModifiedDate.copies[0][1].should match /\Aimporter_/
    end
  end
end

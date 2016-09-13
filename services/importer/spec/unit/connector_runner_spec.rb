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

require_relative 'sql_helper'

def expect_executed_command(cmd, expected = {})
  if expected
    mode, sql, user = cmd
    mode.should eq expected[:mode] if expected.key?(:mode)
    user.should eq expected[:user] if expected.key?(:user)
    expect_sql sql, expected[:sql] if expected.key?(:sql)
  end
end

def expect_executed_commands(executed_commands, *expected_commands)
  executed_commands.zip(expected_commands).each do |executed_command, expected_command|
    expect_executed_command executed_command, expected_command
  end
end

describe CartoDB::Importer2::ConnectorRunner do
  before(:all) do
    @user = create_user
    @user.save
    @pg_options = @user.db_service.db_configuration_for

    @fake_log = CartoDB::Importer2::Doubles::Log.new(@user)
  end

  before(:each) do
    CartoDB::Stats::Aggregator.stubs(:read_config).returns({})
    @providers = %w(mysql postgres sqlserver hive)
    @fake_log.clear
  end

  after(:all) do
    @user.destroy
  end

  describe 'with working connectors' do
    before(:all) do
      # Simulate connector success by ignoring all db opeartions
      Carto::Connector.any_instance.stubs(:execute_as_superuser).returns(nil)
      Carto::Connector.any_instance.stubs(:execute).returns(nil)
    end

    it "Succeeds if parameters are correct" do
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
        connector = CartoDB::Importer2::ConnectorRunner.new(parameters.merge(provider: provider).to_json, options)
        connector.run
        connector.success?.should be true
        connector.connector_name.should eq provider
      end
    end

    it "Fails if parameters are invalid" do
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
        connector = CartoDB::Importer2::ConnectorRunner.new(parameters.merge(provider: provider).to_json, options)
        connector.run
        connector.success?.should be false
        connector.connector_name.should eq provider
        @fake_log.to_s.should match /Invalid parameters: invalid_parameter/m
      end
    end

  end

  describe 'with failing connectors' do
    before(:all) do
      # Simulate connector success when executing non-privileged SQL
      Carto::Connector.any_instance.stubs(:execute_as_superuser).returns(nil)
      Carto::Connector.any_instance.stubs(:execute).raises("SQL EXECUTION ERROR")
    end

    it "Always fails" do
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
        connector = CartoDB::Importer2::ConnectorRunner.new(parameters.merge(provider: provider).to_json, options)
        connector.run
        connector.success?.should be false
        connector.connector_name.should eq provider
        @fake_log.to_s.should match /SQL EXECUTION ERROR/m
      end
    end
  end

  describe 'with invalid provider' do
    Carto::Connector.any_instance.stubs(:execute_as_superuser).returns(nil)
    Carto::Connector.any_instance.stubs(:execute).returns(nil)

    it "Fails at creation" do
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

  # TODO: check Runner compatibility

end

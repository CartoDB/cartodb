# encoding: utf-8
require_relative '../../../../spec/spec_helper'
require_relative '../../lib/importer/connector'
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

class TestConnector < CartoDB::Importer2::Connector
  def execute_as_superuser(command)
    @executed_commands ||= []
    @executed_commands << [:superuser, command, @user.username]
  end

  def execute(command)
    @executed_commands ||= []
    @executed_commands << [:user, command, @user.username]
  end

  attr_reader :executed_commands
end

def expect_executed_command(cmd, expected = {})
  mode, sql, user = cmd
  mode.should eq expected[:mode] if expected.has_key?(:mode)
  user.should eq expected[:user] if expected.has_key?(:user)
  expect_sql sql, expected[:sql] if expected.has_key?(:sql)
end


describe CartoDB::Importer2::Connector do
  before(:all) do
    @user = create_user
    @user.save
    @pg_options = @user.db_service.db_configuration_for

    @fake_log = CartoDB::Importer2::Doubles::Log.new(@user)
  end

  before(:each) do
    CartoDB::Stats::Aggregator.stubs(:read_config).returns({})
  end

  after(:all) do
    @user.destroy
  end

  # describe '#initialize' do
  #   it 'requires postgres options and json connector configuration' do
  #     expect {
  #       CartoDB::Importer2::Runner.new(nil, { log: @fake_log })
  #     }.to raise_error KeyError
  #     expect {
  #       CartoDB::Importer2::Runner.new('"connector":{}'{ log: @fake_log, pg: nil })
  #     }.to raise_error KeyError
  #   end
  # end




  describe 'mysql' do
    it 'Executes expected odbc_fdw SQL commands' do
      parameters = {
        provider: 'mysql',
        server:   'theserver',
        username: 'theuser',
        password: 'thepassword',
        database: 'thedatabase',
        table:    'thetable',
        encoding: 'theencoding'
      }.to_json
      options = {
        pg:   @pg_options,
        log:  @fake_log,
        user: @user
      }
      connector = TestConnector.new(parameters, options)
      connector.run

      connector.executed_commands.size.should eq 6

      expect_executed_command(
        connector.executed_commands[0],
        mode: :superuser,
        sql: [{
          command: :create_server,
          server_name: /\Aconnector_/,
          fdw_name: 'odbc_fdw'
        }]
      )
      server_name = match_sql_command(connector.executed_commands[0][1])[:server_name]

      expect_executed_command(
        connector.executed_commands[1],
        mode: :superuser,
        sql: [{
          command: :create_user_mapping,
          server_name: server_name,
          user_name: @user.database_username,
          options: { 'odbc_uid' => "'theuser'", 'odbc_pwd' => "'thepassword'" }
        }, {
          command: :create_user_mapping,
          server_name: server_name,
          user_name: 'postgres',
          options: { 'odbc_uid' => "'theuser'", 'odbc_pwd' => "'thepassword'" }
        }]
      )

      # TODO: (WIP)

    end
  end

  # TODO: check valid/invalid parameters, required, parameters, check all providers, check Runner compatibility

end

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

class FailingTestConnector < TestConnector
  def execute(command)
    if match_sql(command).first[:command] == :create_table_as_select
      raise "SQL EXECUTION ERROR"
    end
    super
  end
end

def expect_executed_command(cmd, expected = {})
  if expected
    mode, sql, user = cmd
    mode.should eq expected[:mode] if expected.has_key?(:mode)
    user.should eq expected[:user] if expected.has_key?(:user)
    expect_sql sql, expected[:sql] if expected.has_key?(:sql)
  end
end

def expect_executed_commands(executed_commands, *expected_commands)
  executed_commands.zip(expected_commands).each do |executed_command, expected_command|
    expect_executed_command executed_command, expected_command
  end
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

  describe 'mysql' do
    it 'Executes expected odbc_fdw SQL commands' do
      parameters = {
        provider: 'mysql',
        connection: {
          server:   'theserver',
          username: 'theuser',
          password: 'thepassword',
          database: 'thedatabase'
        },
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

      connector.success?.should be true

      connector.executed_commands.size.should eq 6
      server_name = match_sql_command(connector.executed_commands[0][1])[:server_name]
      foreign_table_name = %{"cdb_importer"."#{server_name}_thetable"}
      user_name = @user.username
      user_role = @user.database_username

      expect_executed_commands(
        connector.executed_commands,
        {
          # CREATE SERVER
          mode: :superuser,
          sql: [{
            command: :create_server,
            server_name: /\Aconnector_/,
            fdw_name: 'odbc_fdw',
            options: {
              'odbc_Driver' => 'MySQL',
              'odbc_server' => 'theserver',
              'odbc_database' => 'thedatabase',
              'odbc_port' => '3306'
            }
          }]
        }, {
          # CREATE USER MAPPING
          mode: :superuser,
          sql: [{
            command: :create_user_mapping,
            server_name: server_name,
            user_name: user_role,
            options: { 'odbc_uid' => 'theuser', 'odbc_pwd' => 'thepassword' }
          }, {
            command: :create_user_mapping,
            server_name: server_name,
            user_name: 'postgres',
            options: { 'odbc_uid' => 'theuser', 'odbc_pwd' => 'thepassword' }
          }]
        }, {
          # IMPORT FOREIGH SCHEMA; GRANT SELECT
          mode: :superuser,
          sql: [{
            command: :import_foreign_schema,
            server_name: server_name,
            schema_name: 'cdb_importer',
            options: {
              "odbc_option" => '0',
              "odbc_prefetch" => '0',
              "odbc_no_ssps" => '0',
              "odbc_can_handle_exp_pwd" => '0',
              "schema" => 'thedatabase',
              "table" => 'thetable',
              "encoding" => 'theencoding',
              "prefix" => "#{server_name}_"
            }
          }, {
            command: :grant_select,
            table_name: foreign_table_name,
            user_name: user_role
          }]
        }, {
          # CREATE TABLE AS SELECT
          mode: :user,
          user: user_name,
          sql: [{
            command: :create_table_as_select,
            table_name: /\A"cdb_importer"\.\"importer_/,
            select: /\s*\*\s+FROM\s+#{Regexp.escape foreign_table_name}/
          }]
        }, {
          # DROP FOREIGN TABLE
          mode: :superuser,
          sql: [{
            command: :drop_foreign_table_if_exists,
            table_name: foreign_table_name,
            cascade: /CASCADE/i
          }]
        }, {
          # DROP SERVER
          mode: :superuser,
          sql: [{
            command: :drop_server_if_exists,
            server_name: server_name,
            cascade: /CASCADE/i
          }]
        }
      )
    end

    it 'Fails when parameters are not valid' do
      parameters = {
        provider: 'mysql',
        connection: {
          server:   'theserver',
          username: 'theuser',
          password: 'thepassword',
          database: 'thedatabase'
        },
        table:    'thetable',
        encoding: 'theencoding',
        invalid_parameter: 'xyz'
      }.to_json
      options = {
        pg:   @pg_options,
        log:  @fake_log,
        user: @user
      }
      expect {
        TestConnector.new(parameters, options)
      }.to raise_error(CartoDB::Importer2::Connector::InvalidParametersError)
    end

    it 'Fails gracefully when copy errs' do
      parameters = {
        provider: 'mysql',
        connection: {
          server:   'theserver',
          username: 'theuser',
          password: 'thepassword',
          database: 'thedatabase'
        },
        table:    'thetable',
        encoding: 'theencoding'
      }.to_json
      options = {
        pg:   @pg_options,
        log:  @fake_log,
        user: @user
      }
      connector = FailingTestConnector.new(parameters, options)
      connector.run

      connector.success?.should be false

      # CHECK Server, foreign table, etc was cleaned up properly
      connector.executed_commands.size.should eq 5
      server_name = match_sql_command(connector.executed_commands[0][1])[:server_name]
      foreign_table_name = %{"cdb_importer"."#{server_name}_thetable"}
      user_role = @user.database_username

      expect_executed_commands(
        connector.executed_commands,
        {
          # CREATE SERVER
          mode: :superuser,
          sql: [{
            command: :create_server,
            server_name: /\Aconnector_/,
            fdw_name: 'odbc_fdw',
            options: {
              'odbc_Driver' => 'MySQL',
              'odbc_server' => 'theserver',
              'odbc_database' => 'thedatabase',
              'odbc_port' => '3306'
            }
          }]
        }, {
          # CREATE USER MAPPING
          mode: :superuser,
          sql: [{
            command: :create_user_mapping,
            server_name: server_name,
            user_name: user_role,
            options: { 'odbc_uid' => 'theuser', 'odbc_pwd' => 'thepassword' }
          }, {
            command: :create_user_mapping,
            server_name: server_name,
            user_name: 'postgres',
            options: { 'odbc_uid' => 'theuser', 'odbc_pwd' => 'thepassword' }
          }]
        }, {
          # IMPORT FOREIGH SCHEMA; GRANT SELECT
          mode: :superuser,
          sql: [{
            command: :import_foreign_schema,
            server_name: server_name,
            schema_name: 'cdb_importer',
            options: {
              "odbc_option" => '0',
              "odbc_prefetch" => '0',
              "odbc_no_ssps" => '0',
              "odbc_can_handle_exp_pwd" => '0',
              "schema" => 'thedatabase',
              "table" => 'thetable',
              "encoding" => 'theencoding',
              "prefix" => "#{server_name}_"
            }
          }, {
            command: :grant_select,
            table_name: foreign_table_name,
            user_name: user_role
          }]
        }, {
          # DROP FOREIGN TABLE
          mode: :superuser,
          sql: [{
            command: :drop_foreign_table_if_exists,
            table_name: foreign_table_name,
            cascade: /CASCADE/i
          }]
        }, {
          # DROP SERVER
          mode: :superuser,
          sql: [{
            command: :drop_server_if_exists,
            server_name: server_name,
            cascade: /CASCADE/i
          }]
        }
      )
    end
  end

  describe 'postgresql' do
    it 'Executes expected odbc_fdw SQL commands' do
      parameters = {
        provider: 'postgres',
        connection: {
          server:   'theserver',
          username: 'theuser',
          password: 'thepassword',
          database: 'thedatabase'
        },
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

      connector.success?.should be true

      connector.executed_commands.size.should eq 6
      server_name = match_sql_command(connector.executed_commands[0][1])[:server_name]
      foreign_table_name = %{"cdb_importer"."#{server_name}_thetable"}
      user_name = @user.username
      user_role = @user.database_username

      expect_executed_commands(
        connector.executed_commands,
        {
          # CREATE SERVER
          mode: :superuser,
          sql: [{
            command: :create_server,
            server_name: /\Aconnector_/,
            fdw_name: 'odbc_fdw',
            options: {
              'odbc_Driver' => 'PostgreSQL Unicode',
              'odbc_Server' => 'theserver',
              'odbc_Port' => '5432',
              'odbc_Database' => 'thedatabase'
            }
          }]
        }, {
          # CREATE USER MAPPING
          mode: :superuser,
          sql: [{
            command: :create_user_mapping,
            server_name: server_name,
            user_name: user_role,
            options: { 'odbc_UID' => 'theuser', 'odbc_PWD' => 'thepassword' }
          }, {
            command: :create_user_mapping,
            server_name: server_name,
            user_name: 'postgres',
            options: { 'odbc_UID' => 'theuser', 'odbc_PWD' => 'thepassword' }
          }]
        }, {
          # IMPORT FOREIGH SCHEMA; GRANT SELECT
          mode: :superuser,
          sql: [{
            command: :import_foreign_schema,
            remote_schema_name: 'public',
            server_name: server_name,
            schema_name: 'cdb_importer',
            options: {
              "odbc_BoolAsChar" => '0',
              "odbc_ByteaAsLongVarBinary" => '1',
              "odbc_MaxVarcharSize" => '256',
              "table" => 'thetable',
              "encoding" => 'theencoding',
              "prefix" => "#{server_name}_"
            }
          }, {
            command: :grant_select,
            table_name: foreign_table_name,
            user_name: user_role
          }]
        }, {
          # CREATE TABLE AS SELECT
          mode: :user,
          user: user_name,
          sql: [{
            command: :create_table_as_select,
            table_name: /\A"cdb_importer"\.\"importer_/,
            select: /\s*\*\s+FROM\s+#{Regexp.escape foreign_table_name}/
          }]
        }, {
          # DROP FOREIGN TABLE
          mode: :superuser,
          sql: [{
            command: :drop_foreign_table_if_exists,
            table_name: foreign_table_name,
            cascade: /CASCADE/i
          }]
        }, {
          # DROP SERVER
          mode: :superuser,
          sql: [{
            command: :drop_server_if_exists,
            server_name: server_name,
            cascade: /CASCADE/i
          }]
        }
      )
    end
  end

  describe 'sqlserver' do
    it 'Executes expected odbc_fdw SQL commands' do
      parameters = {
        provider: 'sqlserver',
        connection: {
          server:   'theserver',
          username: 'theuser',
          password: 'thepassword',
          database: 'thedatabase'
        },
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
      server_name = match_sql_command(connector.executed_commands[0][1])[:server_name]
      foreign_table_name = %{"cdb_importer"."#{server_name}_thetabl"}
      user_name = @user.username
      user_role = @user.database_username

      connector.success?.should be true

      expect_executed_commands(
        connector.executed_commands,
        {
          # CREATE SERVER
          mode: :superuser,
          sql: [{
            command: :create_server,
            server_name: /\Aconnector_/,
            fdw_name: 'odbc_fdw',
            options: {
              'odbc_Driver' => 'FreeTDS',
              'odbc_Address' => 'theserver',
              'odbc_Port' => '1433',
              'odbc_Database' => 'thedatabase'
            }
          }]
        }, {
          # CREATE USER MAPPING
          mode: :superuser,
          sql: [{
            command: :create_user_mapping,
            server_name: server_name,
            user_name: user_role,
            options: { 'odbc_UID' => 'theuser', 'odbc_PWD' => 'thepassword' }
          }, {
            command: :create_user_mapping,
            server_name: server_name,
            user_name: 'postgres',
            options: { 'odbc_UID' => 'theuser', 'odbc_PWD' => 'thepassword' }
          }]
        }, {
          # IMPORT FOREIGH SCHEMA; GRANT SELECT
          mode: :superuser,
          sql: [{
            command: :import_foreign_schema,
            remote_schema_name: 'public',
            server_name: server_name,
            schema_name: 'cdb_importer',
            options: {
              "odbc_AppicationIntent" => 'ReadOnly',
              "table" => 'thetable',
              "encoding" => 'theencoding',
              "prefix" => "#{server_name}_"
            }
          }, {
            command: :grant_select,
            table_name: foreign_table_name,
            user_name: user_role
          }]
        }, {
          # CREATE TABLE AS SELECT
          mode: :user,
          user: user_name,
          sql: [{
            command: :create_table_as_select,
            table_name: /\A"cdb_importer"\.\"importer_/,
            select: /\s*\*\s+FROM\s+#{Regexp.escape foreign_table_name}/
          }]
        }, {
          # DROP FOREIGN TABLE
          mode: :superuser,
          sql: [{
            command: :drop_foreign_table_if_exists,
            table_name: foreign_table_name,
            cascade: /CASCADE/i
          }]
        }, {
          # DROP SERVER
          mode: :superuser,
          sql: [{
            command: :drop_server_if_exists,
            server_name: server_name,
            cascade: /CASCADE/i
          }]
        }
      )
    end
  end

  describe 'hive' do
    it 'Executes expected odbc_fdw SQL commands' do
      parameters = {
        provider: 'hive',
        connection: {
          server:   'theserver',
          username: 'theuser',
          password: 'thepassword'
        },
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

      connector.success?.should be true

      connector.executed_commands.size.should eq 6
      server_name = match_sql_command(connector.executed_commands[0][1])[:server_name]
      foreign_table_name = %{"cdb_importer"."#{server_name}_thetable"}
      user_name = @user.username
      user_role = @user.database_username

      expect_executed_commands(
        connector.executed_commands,
        {
          # CREATE SERVER
          mode: :superuser,
          sql: [{
            command: :create_server,
            server_name: /\Aconnector_/,
            fdw_name: 'odbc_fdw',
            options: {
              'odbc_Driver' => 'Hortonworks Hive ODBC Driver (64-bit)',
              'odbc_HOST' => 'theserver',
              'odbc_PORT' => '10000'
            }
          }]
        }, {
          # CREATE USER MAPPING
          mode: :superuser,
          sql: [{
            command: :create_user_mapping,
            server_name: server_name,
            user_name: user_role,
            options: { 'odbc_UID' => 'theuser', 'odbc_PWD' => 'thepassword' }
          }, {
            command: :create_user_mapping,
            server_name: server_name,
            user_name: 'postgres',
            options: { 'odbc_UID' => 'theuser', 'odbc_PWD' => 'thepassword' }
          }]
        }, {
          # IMPORT FOREIGH SCHEMA; GRANT SELECT
          mode: :superuser,
          sql: [{
            command: :import_foreign_schema,
            remote_schema_name: 'public',
            server_name: server_name,
            schema_name: 'cdb_importer',
            options: {
              "odbc_AuthMech" => '0',
              "odbc_schema" => '',
              "schema" => '',
              "table" => 'thetable',
              "encoding" => 'theencoding',
              "prefix" => "#{server_name}_"
            }
          }, {
            command: :grant_select,
            table_name: foreign_table_name,
            user_name: user_role
          }]
        }, {
          # CREATE TABLE AS SELECT
          mode: :user,
          user: user_name,
          sql: [{
            command: :create_table_as_select,
            table_name: /\A"cdb_importer"\.\"importer_/,
            select: /\s*\*\s+FROM\s+#{Regexp.escape foreign_table_name}/
          }]
        }, {
          # DROP FOREIGN TABLE
          mode: :superuser,
          sql: [{
            command: :drop_foreign_table_if_exists,
            table_name: foreign_table_name,
            cascade: /CASCADE/i
          }]
        }, {
          # DROP SERVER
          mode: :superuser,
          sql: [{
            command: :drop_server_if_exists,
            server_name: server_name,
            cascade: /CASCADE/i
          }]
        }
      )
    end
  end

  describe 'invalid_provider' do
    it 'Fails' do
      parameters = {
        provider: 'not_a_provider',
        connection: {
          server:   'theserver',
          username: 'theuser',
          password: 'thepassword',
          database: 'thedatabase'
        },
        table:    'thetable',
        encoding: 'theencoding'
      }.to_json
      options = {
        pg:   @pg_options,
        log:  @fake_log,
        user: @user
      }
      expect {
        TestConnector.new(parameters, options)
      }.to raise_error(CartoDB::Importer2::Connector::InvalidParametersError)
    end
  end

  describe 'generic odbc provider' do
    it 'Executes expected odbc_fdw SQL commands' do
      parameters = {
        provider: 'odbc',
        connection: {
          driver:   'thedriver',
          server:   'theserver',
          uid: 'theuser',
          pwd: 'thepassword',
          database: 'thedatabase',
          # anything can actually go here
          aaa: 'aaa_value',
          bbb: 'bbb_value',
          ccc: 'ccc_value'
        },
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

      connector.success?.should be true

      connector.executed_commands.size.should eq 6
      server_name = match_sql_command(connector.executed_commands[0][1])[:server_name]
      foreign_table_name = %{"cdb_importer"."#{server_name}_thetable"}
      user_name = @user.username
      user_role = @user.database_username

      expect_executed_commands(
        connector.executed_commands,
        {
          # CREATE SERVER
          mode: :superuser,
          sql: [{
            command: :create_server,
            server_name: /\Aconnector_/,
            fdw_name: 'odbc_fdw',
            options: {
              'odbc_driver' => 'thedriver',
              'odbc_server' => 'theserver',
              'odbc_database' => 'thedatabase'
            }
          }]
        }, {
          # CREATE USER MAPPING
          mode: :superuser,
          sql: [{
            command: :create_user_mapping,
            server_name: server_name,
            user_name: user_role,
            options: { 'odbc_uid' => 'theuser', 'odbc_pwd' => 'thepassword' }
          }, {
            command: :create_user_mapping,
            server_name: server_name,
            user_name: 'postgres',
            options: { 'odbc_uid' => 'theuser', 'odbc_pwd' => 'thepassword' }
          }]
        }, {
          # IMPORT FOREIGH SCHEMA; GRANT SELECT
          mode: :superuser,
          sql: [{
            command: :import_foreign_schema,
            server_name: server_name,
            schema_name: 'cdb_importer',
            options: {
              "odbc_aaa" => 'aaa_value',
              "odbc_bbb" => 'bbb_value',
              "odbc_ccc" => 'ccc_value',
              "table" => 'thetable',
              "encoding" => 'theencoding',
              "prefix" => "#{server_name}_"
            }
          }, {
            command: :grant_select,
            table_name: foreign_table_name,
            user_name: user_role
          }]
        }, {
          # CREATE TABLE AS SELECT
          mode: :user,
          user: user_name,
          sql: [{
            command: :create_table_as_select,
            table_name: /\A"cdb_importer"\.\"importer_/,
            select: /\s*\*\s+FROM\s+#{Regexp.escape foreign_table_name}/
          }]
        }, {
          # DROP FOREIGN TABLE
          mode: :superuser,
          sql: [{
            command: :drop_foreign_table_if_exists,
            table_name: foreign_table_name,
            cascade: /CASCADE/i
          }]
        }, {
          # DROP SERVER
          mode: :superuser,
          sql: [{
            command: :drop_server_if_exists,
            server_name: server_name,
            cascade: /CASCADE/i
          }]
        }
      )
    end
  end

  describe 'Non odbc provider' do
    before(:each) do
      CartoDB::Importer2::Connector::PROVIDERS['pg'] = CartoDB::Importer2::Connector::PgFdwProvider
    end

    after(:each) do
      CartoDB::Importer2::Connector::PROVIDERS['pg'] = nil
    end

    it 'Executes expected odbc_fdw SQL commands' do
      parameters = {
        provider: 'pg',
        server:   'theserver',
        username: 'theuser',
        password: 'thepassword',
        database: 'thedatabase',
        table:    'thetable'
      }.to_json
      options = {
        pg:   @pg_options,
        log:  @fake_log,
        user: @user
      }
      connector = TestConnector.new(parameters, options)
      connector.run

      connector.success?.should be true

      connector.executed_commands.size.should eq 6
      server_name = match_sql_command(connector.executed_commands[0][1])[:server_name]
      unqualified_foreign_table_name = %{"#{server_name}_thetable"}
      foreign_table_name = %{"cdb_importer".#{unqualified_foreign_table_name}}
      user_name = @user.username
      user_role = @user.database_username

      expect_executed_commands(
        connector.executed_commands,
        {
          # CREATE SERVER
          mode: :superuser,
          sql: [{
            command: :create_server,
            server_name: /\Aconnector_/,
            fdw_name: 'postgres_fdw',
            options: {
              'host' => 'theserver',
              'dbname' => 'thedatabase'
            }
          }]
        }, {
          # CREATE USER MAPPING
          mode: :superuser,
          sql: [{
            command: :create_user_mapping,
            server_name: server_name,
            user_name: user_role,
            options: { 'user' => 'theuser', 'password' => 'thepassword' }
          }, {
            command: :create_user_mapping,
            server_name: server_name,
            user_name: 'postgres',
            options: { 'user' => 'theuser', 'password' => 'thepassword' }
          }]
        }, {
          # IMPORT FOREIGH SCHEMA; GRANT SELECT
          mode: :superuser,
          sql: [{
            command: :import_foreign_schema_limited,
            server_name: server_name,
            limited_to: 'thetable',
            schema_name: 'cdb_importer',
            remote_schema_name: 'public'
          }, {
            command: :rename_foreign_table,
            table_name: %{"cdb_importer"."thetable"},
            new_name: unqualified_foreign_table_name
          }, {
            command: :grant_select,
            table_name: foreign_table_name,
            user_name: user_role
          }]
        }, {
          # CREATE TABLE AS SELECT
          mode: :user,
          user: user_name,
          sql: [{
            command: :create_table_as_select,
            table_name: /\A"cdb_importer"\.\"importer_/,
            select: /\s*\*\s+FROM\s+#{Regexp.escape foreign_table_name}/
          }]
        }, {
          # DROP FOREIGN TABLE
          mode: :superuser,
          sql: [{
            command: :drop_foreign_table_if_exists,
            table_name: foreign_table_name,
            cascade: /CASCADE/i
          }]
        }, {
          # DROP SERVER
          mode: :superuser,
          sql: [{
            command: :drop_server_if_exists,
            server_name: server_name,
            cascade: /CASCADE/i
          }]
        }
      )
    end

    it 'Fails when parameters are not valid' do
      parameters = {
        provider: 'pg',
        server:   'theserver',
        username: 'theuser',
        password: 'thepassword',
        database: 'thedatabase',
        table:    'thetable',
        invalid_param: 'xyz'
      }.to_json
      options = {
        pg:   @pg_options,
        log:  @fake_log,
        user: @user
      }
      expect {
        TestConnector.new(parameters, options)
      }.to raise_error(CartoDB::Importer2::Connector::InvalidParametersError)
    end

    it 'Fails gracefully when copy errs' do
      parameters = {
        provider: 'pg',
        server:   'theserver',
        username: 'theuser',
        password: 'thepassword',
        database: 'thedatabase',
        table:    'thetable'
      }.to_json
      options = {
        pg:   @pg_options,
        log:  @fake_log,
        user: @user
      }
      connector = FailingTestConnector.new(parameters, options)
      connector.run

      connector.success?.should be false

      # CHECK Server, foreign table, etc was cleaned up properly
      connector.executed_commands.size.should eq 5
      server_name = match_sql_command(connector.executed_commands[0][1])[:server_name]
      unqualified_foreign_table_name = %{"#{server_name}_thetable"}
      foreign_table_name = %{"cdb_importer".#{unqualified_foreign_table_name}}
      user_role = @user.database_username

      expect_executed_commands(
        connector.executed_commands,
        {
          # CREATE SERVER
          mode: :superuser,
          sql: [{
            command: :create_server,
            server_name: /\Aconnector_/,
            fdw_name: 'postgres_fdw',
            options: {
              'host' => 'theserver',
              'dbname' => 'thedatabase'
            }
          }]
        }, {
          # CREATE USER MAPPING
          mode: :superuser,
          sql: [{
            command: :create_user_mapping,
            server_name: server_name,
            user_name: user_role,
            options: { 'user' => 'theuser', 'password' => 'thepassword' }
          }, {
            command: :create_user_mapping,
            server_name: server_name,
            user_name: 'postgres',
            options: { 'user' => 'theuser', 'password' => 'thepassword' }
          }]
        }, {
          # IMPORT FOREIGH SCHEMA; GRANT SELECT
          mode: :superuser,
          sql: [{
            command: :import_foreign_schema_limited,
            server_name: server_name,
            limited_to: 'thetable',
            schema_name: 'cdb_importer',
            remote_schema_name: 'public'
          }, {
            command: :rename_foreign_table,
            table_name: %{"cdb_importer"."thetable"},
            new_name: unqualified_foreign_table_name
          }, {
            command: :grant_select,
            table_name: foreign_table_name,
            user_name: user_role
          }]
        }, {
          # DROP FOREIGN TABLE
          mode: :superuser,
          sql: [{
            command: :drop_foreign_table_if_exists,
            table_name: foreign_table_name,
            cascade: /CASCADE/i
          }]
        }, {
          # DROP SERVER
          mode: :superuser,
          sql: [{
            command: :drop_server_if_exists,
            server_name: server_name,
            cascade: /CASCADE/i
          }]
        }
      )
    end
  end

  # TODO: check Runner compatibility

end

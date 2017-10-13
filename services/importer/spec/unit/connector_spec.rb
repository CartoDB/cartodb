# encoding: utf-8
require 'carto/connector'
require_relative '../../../../spec/spec_helper'

require_relative '../doubles/importer_stats'
require_relative '../doubles/loader'
require_relative '../doubles/log'
require_relative '../doubles/indexer'
require_relative '../factories/pg_connection'
require_relative '../doubles/user'
require_relative '../doubles/input_file_size_limit'
require_relative '../doubles/table_row_count_limit'

require_relative 'sql_helper'

class TestConnectorContext < Carto::Connector::Context
  def initialize(executed_commands, options)
    @executed_commands = executed_commands
    super options
  end

  def execute_as_superuser(command)
    @executed_commands << [:superuser, command, @user.username]
    execute_results command
  end

  def execute(command)
    @executed_commands << [:user, command, @user.username]
    execute_results command
  end

  private

  def execute_results(command)
    if command =~ /\A\s*SELECT\s+\*\s+FROM\s+ODBCTablesList/mi
      [{ schema: 'abc', name: 'xyz' }]
    elsif command =~ /SELECT\s+n.nspname\s+AS\s+schema,\s*c.relname\s+AS\s+name/mi
      [{ schema: 'def', name: 'uvw' }]
    else
      []
    end
  end
end

class FailingTestConnectorContext < TestConnectorContext
  def execute(command)
    if match_sql(command).first[:command] == :create_table_as_select
      raise "SQL EXECUTION ERROR"
    end
    super
  end
end

class TestCountConnectorContext < TestConnectorContext
  def initialize(count, *args)
    @test_count = count
    super *args
  end

  def execute(command)
    if command =~ /\A\s*SELECT\s+count\(\*\)\s+AS\s+num_rows/mi
      [{ 'num_rows' => @test_count }]
    else
      super
    end
  end
end

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

# Multiple hashes are passed to `expect_executed_commands`
# and omiting the braces of the last one is would be inconvenient, so:
# rubocop:disable Style/BracesAroundHashParameters

describe Carto::Connector do
  before(:all) do
    @user = create_user
    @user.save
    @fake_log = CartoDB::Importer2::Doubles::Log.new(@user)
    Carto::Connector.providers.keys.each do |provider_name|
      Carto::ConnectorProvider.create! name: provider_name
    end
  end

  before(:each) do
    CartoDB::Stats::Aggregator.stubs(:read_config).returns({})
    @executed_commands = []
  end

  around(:each) do |example|
    Cartodb.with_config(connectors: {}, &example)
  end

  after(:all) do
    @user.destroy
    Carto::Connector.providers.keys.each do |provider_name|
      Carto::ConnectorProvider.find_by_name(provider_name).destroy
    end
  end

  it "Should list providers available for a user with default configuration" do
    default_config = { 'mysql' => { 'enabled' => true }, 'postgres' => { 'enabled' => false } }
    Cartodb.with_config connectors: default_config do
      Carto::Connector.providers(user: @user).should eq(
        "postgres"  => { name: "PostgreSQL", enabled: false, description: nil },
        "mysql"     => { name: "MySQL",      enabled: true,  description: nil },
        "sqlserver" => { name: "Microsoft SQL Server", enabled: false, description: nil },
        "hive"      => { name: "Hive", enabled: false, description: nil }
      )
    end
  end

  it "Should list providers available for a user with specific configuration" do
    default_config = { 'mysql' => { 'enabled' => true }, 'postgres' => { 'enabled' => false } }
    postgres = Carto::ConnectorProvider.find_by_name('postgres')
    user_config = Carto::ConnectorConfiguration.create!(
      connector_provider_id: postgres.id,
      user_id: @user.id,
      enabled: true
    )
    Cartodb.with_config connectors: default_config do
      Carto::Connector.providers(user: @user).should eq(
        "postgres"  => { name: "PostgreSQL", enabled: true, description: nil },
        "mysql"     => { name: "MySQL",      enabled: true,  description: nil },
        "sqlserver" => { name: "Microsoft SQL Server", enabled: false, description: nil },
        "hive"      => { name: "Hive", enabled: false, description: nil }
      )
    end
    user_config.destroy
  end

  describe 'mysql' do
    it 'Executes expected odbc_fdw SQL commands to copy a table' do
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
      }
      options = {
        logger:  @fake_log,
        user: @user
      }
      context = TestConnectorContext.new(@executed_commands = [], options)
      connector = Carto::Connector.new(parameters, context)
      connector.copy_table schema_name: 'xyz', table_name: 'abc'

      @executed_commands.size.should eq 9
      server_name = match_sql_command(@executed_commands[0][1])[:server_name]
      foreign_table_name = %{"cdb_importer"."#{server_name}_thetable"}
      user_name = @user.username
      user_role = @user.database_username

      expect_executed_commands(
        @executed_commands,
        {
          # CREATE SERVER
          mode: :superuser,
          sql: [{
            command: :create_server,
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
          }]
        }, {
          # CREATE USER MAPPING
          mode: :superuser,
          sql: [{
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
            table_name: %{"xyz"."abc"},
            select: /\s*\*\s+FROM\s+#{Regexp.escape foreign_table_name}/
          }]
        }, {
          # DROP FOREIGN TABLE
          mode: :superuser,
          sql: [{
            command: :drop_foreign_table_if_exists,
            table_name: foreign_table_name
          }]
        }, {
          # DROP USER MAPPING
          mode: :superuser,
          sql: [{
            command: :drop_usermapping_if_exists,
            server_name: server_name,
            user_name: 'postgres'
          }]
        }, {
          # DROP USER MAPPING
          mode: :superuser,
          sql: [{
            command: :drop_usermapping_if_exists,
            server_name: server_name,
            user_name: user_role
          }]
        }, {
          # DROP SERVER
          mode: :superuser,
          sql: [{
            command: :drop_server_if_exists,
            server_name: server_name
          }]
        }
      )
    end

    it 'Should quote ODBC paremeters that require it' do
      parameters = {
        provider: 'mysql',
        connection: {
          server:   'the;server',
          username: 'theuser',
          password: 'the;password',
          database: 'thedatabase'
        },
        table:    'thetable',
        encoding: 'theencoding'
      }
      options = {
        logger:  @fake_log,
        user: @user
      }
      context = TestConnectorContext.new(@executed_commands = [], options)
      connector = Carto::Connector.new(parameters, context)
      connector.copy_table schema_name: 'xyz', table_name: 'abc'

      @executed_commands.size.should eq 9
      server_name = match_sql_command(@executed_commands[0][1])[:server_name]
      user_role = @user.database_username

      expect_executed_commands(
        @executed_commands,
        {
          # CREATE SERVER
          mode: :superuser,
          sql: [{
            command: :create_server,
            fdw_name: 'odbc_fdw',
            options: {
              'odbc_Driver' => 'MySQL',
              'odbc_server' => '{the;server}',
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
            options: { 'odbc_uid' => 'theuser', 'odbc_pwd' => '{the;password}' }
          }, {
            command: :create_user_mapping,
            server_name: server_name,
            user_name: 'postgres',
            options: { 'odbc_uid' => 'theuser', 'odbc_pwd' => '{the;password}' }
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
      }
      options = {
        logger:  @fake_log,
        user: @user
      }
      context = TestConnectorContext.new(@executed_commands = [], options)
      connector = Carto::Connector.new(parameters, context)
      expect {
        connector.copy_table schema_name: 'xyz', table_name: 'abc'
      }.to raise_error(Carto::Connector::InvalidParametersError)

      # When parameters are not valid nothing should be executed in the database
      @executed_commands.should be_empty
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
      }
      options = {
        logger:  @fake_log,
        user: @user
      }
      context = FailingTestConnectorContext.new(@executed_commands = [], options)
      connector = Carto::Connector.new(parameters, context)
      expect {
        connector.copy_table schema_name: 'xyz', table_name: 'abc'
      }.to raise_error('SQL EXECUTION ERROR')

      # When something fails during table copy the foreign table, user mappings and server should be cleaned up
      @executed_commands.size.should eq 8
      server_name = match_sql_command(@executed_commands[0][1])[:server_name]
      foreign_table_name = %{"cdb_importer"."#{server_name}_thetable"}
      user_role = @user.database_username

      expect_executed_commands(
        @executed_commands,
        {
          # CREATE SERVER
          mode: :superuser,
          sql: [{
            command: :create_server,
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
          }]
        }, {
          # CREATE USER MAPPING
          mode: :superuser,
          sql: [{
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
            table_name: foreign_table_name
          }]
        }, {
          # DROP USER MAPPING
          mode: :superuser,
          sql: [{
            command: :drop_usermapping_if_exists,
            server_name: server_name,
            user_name: 'postgres'
          }]
        }, {
          # DROP USER MAPPING
          mode: :superuser,
          sql: [{
            command: :drop_usermapping_if_exists,
            server_name: server_name,
            user_name: user_role
          }]
        }, {
          # DROP SERVER
          mode: :superuser,
          sql: [{
            command: :drop_server_if_exists,
            server_name: server_name
          }]
        }
      )
    end

    it 'Limits the number of rows copied from a table' do
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
      }
      options = {
        logger:  @fake_log,
        user: @user
      }
      config = { 'mysql' => { 'enabled' => true, 'max_rows' => 10 } }
      Cartodb.with_config connectors: config do
        context = TestCountConnectorContext.new(5, @executed_commands = [], options)
        connector = Carto::Connector.new(parameters, context)
        result = connector.copy_table schema_name: 'xyz', table_name: 'abc'
        result.should be_empty

        @executed_commands.size.should eq 9
        server_name = match_sql_command(@executed_commands[0][1])[:server_name]
        foreign_table_name = %{"cdb_importer"."#{server_name}_thetable"}
        user_name = @user.username
        user_role = @user.database_username

        expect_executed_commands(
          @executed_commands,
          {
            # CREATE SERVER
            mode: :superuser,
            sql: [{
              command: :create_server,
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
            }]
          }, {
            # CREATE USER MAPPING
            mode: :superuser,
            sql: [{
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
              table_name: %{"xyz"."abc"},
              select: /\s*\*\s+FROM\s+#{Regexp.escape foreign_table_name}/,
              limit: '10'
            }]
          }, {
            # DROP FOREIGN TABLE
            mode: :superuser,
            sql: [{
              command: :drop_foreign_table_if_exists,
              table_name: foreign_table_name
            }]
          }, {
            # DROP USER MAPPING
            mode: :superuser,
            sql: [{
              command: :drop_usermapping_if_exists,
              server_name: server_name,
              user_name: 'postgres'
            }]
          }, {
            # DROP USER MAPPING
            mode: :superuser,
            sql: [{
              command: :drop_usermapping_if_exists,
              server_name: server_name,
              user_name: user_role
            }]
          }, {
            # DROP SERVER
            mode: :superuser,
            sql: [{
              command: :drop_server_if_exists,
              server_name: server_name
            }]
          }
        )
      end
    end

    it 'Limits the number of rows and warns if limit is reached' do
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
      }
      options = {
        logger:  @fake_log,
        user: @user
      }
      config = { 'mysql' => { 'enabled' => true, 'max_rows' => 10 } }
      Cartodb.with_config connectors: config do
        context = TestCountConnectorContext.new(10, @executed_commands = [], options)
        connector = Carto::Connector.new(parameters, context)
        result = connector.copy_table schema_name: 'xyz', table_name: 'abc'
        result[:max_rows_per_connection].should eq 10

        @executed_commands.size.should eq 9
        server_name = match_sql_command(@executed_commands[0][1])[:server_name]
        foreign_table_name = %{"cdb_importer"."#{server_name}_thetable"}
        user_name = @user.username
        user_role = @user.database_username

        expect_executed_commands(
          @executed_commands,
          {
            # CREATE SERVER
            mode: :superuser,
            sql: [{
              command: :create_server,
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
            }]
          }, {
            # CREATE USER MAPPING
            mode: :superuser,
            sql: [{
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
              table_name: %{"xyz"."abc"},
              select: /\s*\*\s+FROM\s+#{Regexp.escape foreign_table_name}/,
              limit: '10'
            }]
          }, {
            # DROP FOREIGN TABLE
            mode: :superuser,
            sql: [{
              command: :drop_foreign_table_if_exists,
              table_name: foreign_table_name
            }]
          }, {
            # DROP USER MAPPING
            mode: :superuser,
            sql: [{
              command: :drop_usermapping_if_exists,
              server_name: server_name,
              user_name: 'postgres'
            }]
          }, {
            # DROP USER MAPPING
            mode: :superuser,
            sql: [{
              command: :drop_usermapping_if_exists,
              server_name: server_name,
              user_name: user_role
            }]
          }, {
            # DROP SERVER
            mode: :superuser,
            sql: [{
              command: :drop_server_if_exists,
              server_name: server_name
            }]
          }
        )
      end
    end

    it 'Executes expected odbc_fdw SQL commands to list tables' do
      parameters = {
        provider: 'mysql',
        connection: {
          server:   'theserver',
          username: 'theuser',
          password: 'thepassword',
          database: 'thedatabase'
        }
      }
      options = {
        logger: @fake_log,
        user: @user
      }
      context = TestConnectorContext.new(@executed_commands = [], options)
      connector = Carto::Connector.new(parameters, context)
      tables = connector.list_tables

      tables.should eq [{ schema: 'abc', name: 'xyz' }]

      @executed_commands.size.should eq 7

      server_name = match_sql_command(@executed_commands[0][1])[:server_name]
      user_name = @user.username
      user_role = @user.database_username

      expect_executed_commands(
        @executed_commands,
        {
          # CREATE SERVER
          mode: :superuser,
          sql: [{
            command: :create_server,
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
          }]
        }, {
          # CREATE USER MAPPING
          mode: :superuser,
          sql: [{
            command: :create_user_mapping,
            server_name: server_name,
            user_name: 'postgres',
            options: { 'odbc_uid' => 'theuser', 'odbc_pwd' => 'thepassword' }
          }]
        }, {
          # FETCH TABLES LIST
          mode: :user,
          user: user_name,
          sql: [{
            command: :select_all,
            from: /ODBCTablesList\('#{Regexp.escape server_name}'\s*,\d+\s*\)/
          }]
        }, {
          # DROP USER MAPPING
          mode: :superuser,
          sql: [{
            command: :drop_usermapping_if_exists,
            server_name: server_name,
            user_name: 'postgres'
          }]
        }, {
          # DROP USER MAPPING
          mode: :superuser,
          sql: [{
            command: :drop_usermapping_if_exists,
            server_name: server_name,
            user_name: user_role
          }]
        }, {
          # DROP SERVER
          mode: :superuser,
          sql: [{
            command: :drop_server_if_exists,
            server_name: server_name
          }]
        }
      )
    end

    it 'requires connection parameters in order to list tables' do
      parameters = {
        provider: 'mysql'
      }
      options = {
        logger: @fake_log,
        user: @user
      }
      context = TestConnectorContext.new(@executed_commands = [], options)
      connector = Carto::Connector.new(parameters, context)
      expect {
        connector.copy_table schema_name: 'xyz', table_name: 'abc'
      }.to raise_error(Carto::Connector::InvalidParametersError)

      # When parameters are not valid nothing should be executed in the database
      @executed_commands.should be_empty
    end

    it 'checks connection paramters in order to list tables' do
      parameters = {
        provider: 'mysql',
        connection: {
          # missing server
          username: 'theuser',
          password: 'thepassword',
          database: 'thedatabase'
        }
      }
      options = {
        logger: @fake_log,
        user: @user
      }
      context = TestConnectorContext.new(@executed_commands = [], options)
      connector = Carto::Connector.new(parameters, context)
      expect {
        connector.copy_table schema_name: 'xyz', table_name: 'abc'
      }.to raise_error(Carto::Connector::InvalidParametersError)

      # When parameters are not valid nothing should be executed in the database
      @executed_commands.should be_empty
    end

    it 'Should provide connector metadata' do
      Carto::Connector.information('mysql').should eq(
        features: {
          'list_tables':    true,
          'list_databases': false,
          'sql_queries':    true,
          'preview_table':  false
        },
        parameters: {
          'connection' => {
            'username' => { required: true  },
            'password' => { required: true  },
            'server'   => { required: true  },
            'port'     => { required: false },
            'database' => { required: false }
          },
          'table'      => { required: true  },
          'schema'     => { required: false },
          'sql_query'  => { required: false },
          'sql_count'  => { required: false },
          'encoding'   => { required: false },
          'columns'    => { required: false }
        }
      )
    end
  end

  describe 'postgresql' do
    it 'Executes expected odbc_fdw SQL commands to copy a table' do
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
      }
      options = {
        logger:  @fake_log,
        user: @user
      }
      context = TestConnectorContext.new(@executed_commands = [], options)
      connector = Carto::Connector.new(parameters, context)
      connector.copy_table schema_name: 'xyz', table_name: 'abc'

      @executed_commands.size.should eq 9
      server_name = match_sql_command(@executed_commands[0][1])[:server_name]
      foreign_table_name = %{"cdb_importer"."#{server_name}_thetable"}
      user_name = @user.username
      user_role = @user.database_username

      expect_executed_commands(
        @executed_commands,
        {
          # CREATE SERVER
          mode: :superuser,
          sql: [{
            command: :create_server,
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
          }]
        }, {
          # CREATE USER MAPPING
          mode: :superuser,
          sql: [{
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
              "odbc_BoolsAsChar" => '0',
              "odbc_ByteaAsLongVarBinary" => '1',
              "odbc_MaxVarcharSize" => '256',
              "odbc_SSLmode" => 'require',
              "schema" => 'public',
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
            table_name: %{"xyz"."abc"},
            select: /\s*\*\s+FROM\s+#{Regexp.escape foreign_table_name}/
          }]
        }, {
          # DROP FOREIGN TABLE
          mode: :superuser,
          sql: [{
            command: :drop_foreign_table_if_exists,
            table_name: foreign_table_name
          }]
        }, {
          # DROP USER MAPPING
          mode: :superuser,
          sql: [{
            command: :drop_usermapping_if_exists,
            server_name: server_name,
            user_name: 'postgres'
          }]
        }, {
          # DROP USER MAPPING
          mode: :superuser,
          sql: [{
            command: :drop_usermapping_if_exists,
            server_name: server_name,
            user_name: user_role
          }]
        }, {
          # DROP SERVER
          mode: :superuser,
          sql: [{
            command: :drop_server_if_exists,
            server_name: server_name
          }]
        }
      )
    end

    it 'Should provide connector metadata' do
      Carto::Connector.information('postgres').should eq(
        features: {
          'list_tables':    true,
          'list_databases': false,
          'sql_queries':    true,
          'preview_table':  false
        },
        parameters: {
          'connection' => {
            'username' => { required: true  },
            'password' => { required: false },
            'server'   => { required: true  },
            'port'     => { required: false },
            'database' => { required: true  },
            'sslmode'  => { required: false }
          },
          'table'      => { required: true  },
          'schema'     => { required: false },
          'sql_query'  => { required: false },
          'sql_count'  => { required: false },
          'encoding'   => { required: false },
          'columns'    => { required: false }
        }
      )
    end
  end

  describe 'sqlserver' do
    it 'Executes expected odbc_fdw SQL commands to copy a table' do
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
      }
      options = {
        logger:  @fake_log,
        user: @user
      }
      context = TestConnectorContext.new(@executed_commands = [], options)
      connector = Carto::Connector.new(parameters, context)
      connector.copy_table schema_name: 'xyz', table_name: 'abc'

      @executed_commands.size.should eq 9
      server_name = match_sql_command(@executed_commands[0][1])[:server_name]
      foreign_table_name = %{"cdb_importer"."#{server_name}_thetable"}
      user_name = @user.username
      user_role = @user.database_username

      expect_executed_commands(
        @executed_commands,
        {
          # CREATE SERVER
          mode: :superuser,
          sql: [{
            command: :create_server,
            fdw_name: 'odbc_fdw',
            options: {
              'odbc_Driver' => 'FreeTDS',
              'odbc_Server' => 'theserver',
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
          }]
        }, {
          # CREATE USER MAPPING
          mode: :superuser,
          sql: [{
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
            remote_schema_name: 'dbo',
            server_name: server_name,
            schema_name: 'cdb_importer',
            options: {
              "odbc_AppicationIntent" => 'ReadOnly',
              "schema" => 'dbo',
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
            table_name: %{"xyz"."abc"},
            select: /\s*\*\s+FROM\s+#{Regexp.escape foreign_table_name}/
          }]
        }, {
          # DROP FOREIGN TABLE
          mode: :superuser,
          sql: [{
            command: :drop_foreign_table_if_exists,
            table_name: foreign_table_name
          }]
        }, {
          # DROP USER MAPPING
          mode: :superuser,
          sql: [{
            command: :drop_usermapping_if_exists,
            server_name: server_name,
            user_name: 'postgres'
          }]
        }, {
          # DROP USER MAPPING
          mode: :superuser,
          sql: [{
            command: :drop_usermapping_if_exists,
            server_name: server_name,
            user_name: user_role
          }]
        }, {
          # DROP SERVER
          mode: :superuser,
          sql: [{
            command: :drop_server_if_exists,
            server_name: server_name
          }]
        }
      )
    end

    it 'Should provide connector metadata' do
      Carto::Connector.information('sqlserver').should eq(
        features: {
          'list_tables':    true,
          'list_databases': false,
          'sql_queries':    true,
          'preview_table':  false
        },
        parameters: {
          'connection' => {
            'username' => { required: true  },
            'password' => { required: true  },
            'server'   => { required: true  },
            'port'     => { required: false },
            'database' => { required: true  }
          },
          'table'      => { required: true  },
          'schema'     => { required: false },
          'sql_query'  => { required: false },
          'sql_count'  => { required: false },
          'encoding'   => { required: false },
          'columns'    => { required: false }
        }
      )
    end
  end

  describe 'hive' do
    it 'Executes expected odbc_fdw SQL commands to copy a table' do
      parameters = {
        provider: 'hive',
        connection: {
          server:   'theserver',
          username: 'theuser',
          password: 'thepassword'
        },
        table:    'thetable',
        encoding: 'theencoding'
      }
      options = {
        logger:  @fake_log,
        user: @user
      }
      context = TestConnectorContext.new(@executed_commands = [], options)
      connector = Carto::Connector.new(parameters, context)
      connector.copy_table schema_name: 'xyz', table_name: 'abc'

      @executed_commands.size.should eq 9
      server_name = match_sql_command(@executed_commands[0][1])[:server_name]
      foreign_table_name = %{"cdb_importer"."#{server_name}_thetable"}
      user_name = @user.username
      user_role = @user.database_username

      expect_executed_commands(
        @executed_commands,
        {
          # CREATE SERVER
          mode: :superuser,
          sql: [{
            command: :create_server,
            fdw_name: 'odbc_fdw',
            options: {
              'odbc_Driver' => 'Hortonworks Hive ODBC Driver 64-bit',
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
          }]
        }, {
          # CREATE USER MAPPING
          mode: :superuser,
          sql: [{
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
            remote_schema_name: 'default',
            server_name: server_name,
            schema_name: 'cdb_importer',
            options: {
              "odbc_Schema" => 'default',
              "schema" => 'default',
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
            table_name: %{"xyz"."abc"},
            select: /\s*\*\s+FROM\s+#{Regexp.escape foreign_table_name}/
          }]
        }, {
          # DROP FOREIGN TABLE
          mode: :superuser,
          sql: [{
            command: :drop_foreign_table_if_exists,
            table_name: foreign_table_name
          }]
        }, {
          # DROP USER MAPPING
          mode: :superuser,
          sql: [{
            command: :drop_usermapping_if_exists,
            server_name: server_name,
            user_name: 'postgres'
          }]
        }, {
          # DROP USER MAPPING
          mode: :superuser,
          sql: [{
            command: :drop_usermapping_if_exists,
            server_name: server_name,
            user_name: user_role
          }]
        }, {
          # DROP SERVER
          mode: :superuser,
          sql: [{
            command: :drop_server_if_exists,
            server_name: server_name
          }]
        }
      )
    end

    it 'Should provide connector metadata' do
      Carto::Connector.information('hive').should eq(
        features: {
          'list_tables':    true,
          'list_databases': false,
          'sql_queries':    true,
          'preview_table':  false
        },
        parameters: {
          'connection' => {
            'username' => { required: false },
            'password' => { required: false },
            'server'   => { required: true  },
            'port'     => { required: false },
            'database' => { required: false }
          },
          'table'      => { required: true  },
          'schema'     => { required: false },
          'sql_query'  => { required: false },
          'sql_count'  => { required: false },
          'encoding'   => { required: false },
          'columns'    => { required: false }
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
      }
      options = {
        logger:  @fake_log,
        user: @user
      }
      expect {
        Carto::Connector.new(parameters, options)
      }.to raise_error(Carto::Connector::InvalidParametersError)
    end

    it 'Should not provide metadata' do
      expect {
        Carto::Connector.information('not_a_provider')
      }.to raise_error(Carto::Connector::InvalidParametersError)
    end
  end

  describe 'generic odbc provider' do
    it 'Executes expected odbc_fdw SQL commands to copy a table' do
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
      }
      options = {
        logger:  @fake_log,
        user: @user
      }
      context = TestConnectorContext.new(@executed_commands = [], options)
      connector = Carto::Connector.new(parameters, context)
      connector.copy_table schema_name: 'xyz', table_name: 'abc'

      @executed_commands.size.should eq 9
      server_name = match_sql_command(@executed_commands[0][1])[:server_name]
      foreign_table_name = %{"cdb_importer"."#{server_name}_thetable"}
      user_name = @user.username
      user_role = @user.database_username

      expect_executed_commands(
        @executed_commands,
        {
          # CREATE SERVER
          mode: :superuser,
          sql: [{
            command: :create_server,
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
          }]
        }, {
          # CREATE USER MAPPING
          mode: :superuser,
          sql: [{
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
            table_name: %{"xyz"."abc"},
            select: /\s*\*\s+FROM\s+#{Regexp.escape foreign_table_name}/
          }]
        }, {
          # DROP FOREIGN TABLE
          mode: :superuser,
          sql: [{
            command: :drop_foreign_table_if_exists,
            table_name: foreign_table_name
          }]
        }, {
          # DROP USER MAPPING
          mode: :superuser,
          sql: [{
            command: :drop_usermapping_if_exists,
            server_name: server_name,
            user_name: 'postgres'
          }]
        }, {
          # DROP USER MAPPING
          mode: :superuser,
          sql: [{
            command: :drop_usermapping_if_exists,
            server_name: server_name,
            user_name: user_role
          }]
        }, {
          # DROP SERVER
          mode: :superuser,
          sql: [{
            command: :drop_server_if_exists,
            server_name: server_name
          }]
        }
      )
    end

    it 'Should admit quoted parameters' do
      parameters = {
        provider: 'odbc',
        connection: {
          driver:   'thedriver',
          server:   '{the;server}',
          uid: 'theuser',
          pwd: '{the;password}',
          database: 'thedatabase',
          # anything can actually go here
          aaa: 'aaa_value',
          bbb: 'bbb_value',
          ccc: 'ccc_value'
        },
        table:    'thetable',
        encoding: 'theencoding'
      }
      options = {
        logger:  @fake_log,
        user: @user
      }
      context = TestConnectorContext.new(@executed_commands = [], options)
      connector = Carto::Connector.new(parameters, context)
      connector.copy_table schema_name: 'xyz', table_name: 'abc'

      @executed_commands.size.should eq 9
      server_name = match_sql_command(@executed_commands[0][1])[:server_name]
      foreign_table_name = %{"cdb_importer"."#{server_name}_thetable"}
      user_name = @user.username
      user_role = @user.database_username

      expect_executed_commands(
        @executed_commands,
        {
          # CREATE SERVER
          mode: :superuser,
          sql: [{
            command: :create_server,
            fdw_name: 'odbc_fdw',
            options: {
              'odbc_driver' => 'thedriver',
              'odbc_server' => '{the;server}',
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
            options: { 'odbc_uid' => 'theuser', 'odbc_pwd' => '{the;password}' }
          }]
        }, {
          # CREATE USER MAPPING
          mode: :superuser,
          sql: [{
            command: :create_user_mapping,
            server_name: server_name,
            user_name: 'postgres',
            options: { 'odbc_uid' => 'theuser', 'odbc_pwd' => '{the;password}' }
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
            table_name: %{"xyz"."abc"},
            select: /\s*\*\s+FROM\s+#{Regexp.escape foreign_table_name}/
          }]
        }, {
          # DROP FOREIGN TABLE
          mode: :superuser,
          sql: [{
            command: :drop_foreign_table_if_exists,
            table_name: foreign_table_name
          }]
        }, {
          # DROP USER MAPPING
          mode: :superuser,
          sql: [{
            command: :drop_usermapping_if_exists,
            server_name: server_name,
            user_name: 'postgres'
          }]
        }, {
          # DROP USER MAPPING
          mode: :superuser,
          sql: [{
            command: :drop_usermapping_if_exists,
            server_name: server_name,
            user_name: user_role
          }]
        }, {
          # DROP SERVER
          mode: :superuser,
          sql: [{
            command: :drop_server_if_exists,
            server_name: server_name
          }]
        }
      )
    end
  end

  describe 'Non odbc provider' do
    before(:each) do
      Carto::Connector::PROVIDERS['pg'] = {
        class: Carto::Connector::PgFdwProvider,
        name:  'PostgreSQL FDW',
        public: true
      }
    end

    after(:each) do
      Carto::Connector::PROVIDERS['pg'] = nil
    end

    it 'Executes expected odbc_fdw SQL commands to copy a table' do
      parameters = {
        provider: 'pg',
        server:   'theserver',
        username: 'theuser',
        password: 'thepassword',
        database: 'thedatabase',
        table:    'thetable'
      }
      options = {
        logger:  @fake_log,
        user: @user
      }
      context = TestConnectorContext.new(@executed_commands = [], options)
      connector = Carto::Connector.new(parameters, context)
      connector.copy_table schema_name: 'xyz', table_name: 'abc'

      @executed_commands.size.should eq 9
      server_name = match_sql_command(@executed_commands[0][1])[:server_name]
      unqualified_foreign_table_name = %{"#{server_name}_thetable"}
      foreign_table_name = %{"cdb_importer".#{unqualified_foreign_table_name}}
      user_name = @user.username
      user_role = @user.database_username

      expect_executed_commands(
        @executed_commands,
        {
          # CREATE SERVER
          mode: :superuser,
          sql: [{
            command: :create_server,
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
          }]
        }, {
          # CREATE USER MAPPING
          mode: :superuser,
          sql: [{
            command: :create_user_mapping,
            server_name: server_name,
            user_name: 'postgres',
            options: { 'user' => 'theuser', 'password' => 'thepassword' }
          }]
        }, {
          # IMPORT FOREIGN SCHEMA; GRANT SELECT
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
            table_name: %{"xyz"."abc"},
            select: /\s*\*\s+FROM\s+#{Regexp.escape foreign_table_name}/
          }]
        }, {
          # DROP FOREIGN TABLE
          mode: :superuser,
          sql: [{
            command: :drop_foreign_table_if_exists,
            table_name: foreign_table_name
          }]
        }, {
          # DROP USER MAPPING
          mode: :superuser,
          sql: [{
            command: :drop_usermapping_if_exists,
            server_name: server_name,
            user_name: 'postgres'
          }]
        }, {
          # DROP USER MAPPING
          mode: :superuser,
          sql: [{
            command: :drop_usermapping_if_exists,
            server_name: server_name,
            user_name: user_role
          }]
        }, {
          # DROP SERVER
          mode: :superuser,
          sql: [{
            command: :drop_server_if_exists,
            server_name: server_name
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
      }
      options = {
        logger:  @fake_log,
        user: @user
      }
      context = TestConnectorContext.new(@executed_commands = [], options)
      connector = Carto::Connector.new(parameters, context)
      expect {
        connector.copy_table schema_name: 'xyz', table_name: 'abc'
      }.to raise_error(Carto::Connector::InvalidParametersError)

      # When parameters are not valid nothing should be executed in the database
      @executed_commands.should be_empty
    end

    it 'Fails gracefully when copy errs' do
      parameters = {
        provider: 'pg',
        server:   'theserver',
        username: 'theuser',
        password: 'thepassword',
        database: 'thedatabase',
        table:    'thetable'
      }
      options = {
        logger:  @fake_log,
        user: @user
      }
      context = FailingTestConnectorContext.new(@executed_commands = [], options)
      connector = Carto::Connector.new(parameters, context)
      expect {
        connector.copy_table schema_name: 'xyz', table_name: 'abc'
      }.to raise_error('SQL EXECUTION ERROR')

      # When something fails during table copy the foreign table, user mappings and server should be cleaned up
      @executed_commands.size.should eq 8
      server_name = match_sql_command(@executed_commands[0][1])[:server_name]
      unqualified_foreign_table_name = %{"#{server_name}_thetable"}
      foreign_table_name = %{"cdb_importer".#{unqualified_foreign_table_name}}
      user_role = @user.database_username

      expect_executed_commands(
        @executed_commands,
        {
          # CREATE SERVER
          mode: :superuser,
          sql: [{
            command: :create_server,
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
          }]
        }, {
          # CREATE USER MAPPING
          mode: :superuser,
          sql: [{
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
            table_name: foreign_table_name
          }]
        }, {
          # DROP USER MAPPING
          mode: :superuser,
          sql: [{
            command: :drop_usermapping_if_exists,
            server_name: server_name,
            user_name: 'postgres'
          }]
        }, {
          # DROP USER MAPPING
          mode: :superuser,
          sql: [{
            command: :drop_usermapping_if_exists,
            server_name: server_name,
            user_name: user_role
          }]
        }, {
          # DROP SERVER
          mode: :superuser,
          sql: [{
            command: :drop_server_if_exists,
            server_name: server_name
          }]
        }
      )
    end

    it 'Should provide connector metadata' do
      Carto::Connector.information('pg').should eq(
        features: {
          'list_tables':    true,
          'list_databases': false,
          'sql_queries':    false,
          'preview_table':  false
        },
        parameters: {
          'table'      => { required: true  },
          'schema'     => { required: false },
          'username'   => { required: true  },
          'password'   => { required: true },
          'server'     => { required: true  },
          'port'       => { required: false },
          'database'   => { required: true  }
        }
      )
    end
  end
end

# rubocop:enable Style/BracesAroundHashParameters

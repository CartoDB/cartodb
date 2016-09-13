# encoding: utf-8

require_relative 'providers/generic_odbc'
require_relative 'providers/mysql'
require_relative 'providers/postgresql'
require_relative 'providers/sqlserver'
require_relative 'providers/hive'
require_relative 'providers/pg_fdw'

module Carto
  class Connector
    PROVIDERS = {
      'odbc'      => GenericOdbcProvider, # Intended for internal development/tests
      'postgres'  => PostgreSQLProvider,
      'mysql'     => MySqlProvider,
      'sqlserver' => SqlServerProvider,
      'hive'      => HiveProvider
    }

    DEFAULT_PROVIDER = nil # No default provider
  end
end

require_relative 'providers/fdw/odbc/generic_odbc'
require_relative 'providers/fdw/odbc/mysql'
require_relative 'providers/fdw/odbc/postgresql'
require_relative 'providers/fdw/odbc/sqlserver'
require_relative 'providers/fdw/odbc/hive'
require_relative 'providers/fdw/pg_fdw'

module Carto
  class Connector
    PROVIDERS = [
      GenericOdbcProvider,
      PostgreSQLProvider,
      MySqlProvider,
      SqlServerProvider,
      HiveProvider
    ]

    puts "-"*80
    puts "-"*80
    puts "PROVIDERS INITIALIZED #{PROVIDERS.size}"
    puts "-"*80
    puts "-"*80

    DEFAULT_PROVIDER = nil # No default provider

    class << self
      def provider_class(provider_id)
        provider_data provider_id
      end

      def provider_public?(provider_id)
        provider_item provider_id, :public?
      end

      def provider_name(provider_id)
        provider_item provider_id, :name
      end

      def provider_ids
        PROVIDERS.map &:id
      end

      private

      def provider_data(provider_id)
        provider_id ||= DEFAULT_PROVIDER
        PROVIDERS.find{|p| p.id == provider_id}
      end

      def provider_item(provider_id, item)
        data = provider_data(provider_id)
        data&.send item.to_sym
      end
    end

  end
end

# encoding: utf-8

require_relative 'providers/generic_odbc'
require_relative 'providers/mysql'
require_relative 'providers/postgresql'
require_relative 'providers/sqlserver'
require_relative 'providers/hive'
require_relative 'providers/pg_fdw'
require_relative 'providers/bigquery'

module Carto
  class Connector

    # Here we map provider identifiers (as used in APIs, etc.) to the Provider class and basic attributes.
    # `name` is the human-readable name
    # `public` means that the provider is publicly announced (so it is accessible through UI, visible in lists of
    # providers, etc.) A provider may be available or not (see Connector.limits) independently of its public status,
    # so that a public provider may not be available for all users, and non-public providers may be available to
    # some users (e.g. 'odbc' provider for tests)
    PROVIDERS = [
      GenericOdbcProvider,
      PostgreSQLProvider,
      MySqlProvider,
      SqlServerProvider,
      HiveProvider,
      BigQueryProvider
    ]

    DEFAULT_PROVIDER = nil # No default provider

    class << self
      def provider_class(provider_id)
        provider_item provider_id, :class
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

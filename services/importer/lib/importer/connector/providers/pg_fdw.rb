# encoding: utf-8

require_relative './base'

module CartoDB
  module Importer2
    class Connector

      # PostgreSQL provider using Postgres-FDW: https://www.postgresql.org/docs/current/static/postgres-fdw.html
      #
      # options:
      # * https://www.postgresql.org/docs/current/static/postgres-fdw.html#AEN174711
      # * https://www.postgresql.org/docs/current/static/libpq-connect.html#LIBPQ-PARAMKEYWORDS
      #
      # Requirements:
      #   * postgres_fdw extension must be installed in the user database
      #
      # Parameters:
      #
      #   * schema: schema name of the remote schema
      #   * table: name of the remote table to import (also name of imported result table)
      #   * server: PostgreSQL server name or address
      #   * port: PostgreSQL server port
      #   * database: remote database name to connect to
      #   * username: user name for athentication
      #   * password: password for athentication
      #
      # TODO: add support for sql_query parameter
      #
      class PgFdwProvider < Provider

        def initialize(params)
          super
        end

        REQUIRED_PARAMETERS = %w(table server database username).freeze
        OPTIONAL_PARAMETERS = %w(schema port password).freeze

        def optional_parameters
          optional_connection_attributes.keys.map(&:to_s) + OPTIONAL_PARAMETERS
        end

        def required_parameters
          required_connection_attributes.keys.map(&:to_s) + REQUIRED_PARAMETERS
        end

        def table_name
          Support.fetch_ignoring_case(@params, 'table')
        end

        def remote_schema_name
          schema = Support.fetch_ignoring_case(@params, 'schema')
          schema = 'public' if schema.blank?
          schema
        end

        def create_server_command(server_name)
          fdw_create_server 'postgres_fdw', server_name, server_params
        end

        def create_usermap_command(server_name, username)
          fdw_create_usermap server_name, username, user_params
          fdw_create_usermap server_name, 'postgres', user_params
        end

        def create_foreign_table_command(server_name, foreign_table_schema, foreign_table_name, foreign_prefix, username)
          options = table_params.merge(prefix: foreign_prefix)
          fdw_import_foreign_schema server_name, remote_schema_name, foreign_table_schema, options
          fdw_grant_select foreign_table_schema, foreign_table_name, username
        end

        private

        ATTRIBUTE_NAMES = {
          'schema'   => 'schema_name',
          'table'    => 'table_name',
          'server'   => 'host',
          'database' => 'dbname',
          'port'     => 'port',
          'username' => 'user',
          'password' => 'password'
        }

        def attribute_name(parameter_name, value)
          attribute_name = ATTRIBUTE_NAMES[parameter_name.downcase] || parameter_name
          if attribute_name == 'host' && IpChecker.is_ip?(value)
            attribute_name = 'hostaddr'
          end
          attribute_name
        end

        def connection_attributes
          Hash[@params.map { |k, v| [attribute_name(k, v), v] }]
        end

        def non_connection_parameters
          @params.select(&case_insensitive_in(REQUIRED_OPTIONS + OPTIONAL_OPTIONS - ['columns']))
        end

        include Connector::Support

        SERVER_OPTIONS  = %w(host hostaddr port dbname).freeze
        USERMAP_OPTIONS = %w(user password)

        def connection_options(options)
          # Prefix option names with "odbc_"
          Hash[options.map { |option_name, option_value| ["odbc_#{option_name}", option_value] }]
        end

        def server_params
          params = connection_attributes.slice(*SERVER_OPTIONS)
          connection_options params
        end

        def user_params
          params = connection_attributes.slice(*USER_OPTIONS)
          connection_options params
        end

        def table_params
          params = connection_attributes.except(*(SERVER_OPTIONS + USER_OPTIONS))
          connection_options(params)
        end

      end

    end
  end
end

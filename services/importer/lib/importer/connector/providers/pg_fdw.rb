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
      # This is not intended for production at the moment, this class is here to validate and test the
      # Connector hierarchy design.
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
          OPTIONAL_PARAMETERS
        end

        def required_parameters
          REQUIRED_PARAMETERS
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
        end

        def create_foreign_table_command(server_name, schema, foreign_table_name, _foreign_prefix, username)
          # TODO: this show some deficiencies in the design of this internal API:
          # we shouldn't need to resort to @params here.
          # The reason is the original API was oriented to odbc_fdw (which has the prefix options)
          remote_table = @params['table']
          options = table_params
          cmds = []
          cmds << fdw_import_foreign_schema_limited(server_name, remote_schema_name, schema, remote_table, options)
          if remote_table != foreign_table_name
            cmds << fdw_rename_foreign_table(schema, remote_table, foreign_table_name)
          end
          cmds << fdw_grant_select(schema, foreign_table_name, username)
          cmds.join "\n"
        end

        private

        ATTRIBUTE_NAMES = {
          # 'schema'   => 'schema_name',  # for CREATE FOREIGN TABLE, remote schema name if different from local
          # 'table'    => 'table_name',   # for CREATE FOREIGN TABLE, remote taable name if different from local
          'server'   => 'host',
          'database' => 'dbname',
          'port'     => 'port',
          'username' => 'user',
          'password' => 'password'
        }

        NON_ATTRIBUTES = %w(schema table provider)

        def attribute_name(parameter_name, value)
          attribute_name = ATTRIBUTE_NAMES[parameter_name.downcase] || parameter_name
          if attribute_name == 'host' && IpChecker.is_ip?(value)
            attribute_name = 'hostaddr'
          end
          attribute_name
        end

        def connection_attributes
          Hash[@params.except(*NON_ATTRIBUTES).map { |k, v| [attribute_name(k, v), v] }]
        end

        include Connector::Support

        SERVER_OPTIONS  = %w(host hostaddr port dbname).freeze
        USERMAP_OPTIONS = %w(user password)

        def server_params
          connection_attributes.slice(*SERVER_OPTIONS)
        end

        def user_params
          connection_attributes.slice(*USERMAP_OPTIONS)
        end

        def table_params
          connection_attributes.except(*(SERVER_OPTIONS + USERMAP_OPTIONS))
        end

      end

    end
  end
end

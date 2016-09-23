# encoding: utf-8

require_relative './base'

module Carto
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
        @params[:table]
      end

      def foreign_table_name(prefix)
        fdw_adjusted_table_name("#{prefix}#{table_name}")
      end

      def remote_schema_name
        schema = @params[:schema]
        schema = 'public' if schema.blank?
        schema
      end

      def create_server_command(server_name)
        fdw_create_server 'postgres_fdw', server_name, server_options
      end

      def create_usermap_command(server_name, username)
        fdw_create_usermap server_name, username, user_options
      end

      def create_foreign_table_command(server_name, schema, foreign_prefix, username)
        remote_table = table_name
        foreign_table = foreign_table_name(foreign_prefix)
        options = table_options
        cmds = []
        cmds << fdw_import_foreign_schema_limited(server_name, remote_schema_name, schema, remote_table, options)
        if remote_table != foreign_table
          cmds << fdw_rename_foreign_table(schema, remote_table, foreign_table)
        end
        cmds << fdw_grant_select(schema, foreign_table_name(foreign_prefix), username)
        cmds.join "\n"
      end

      def features_information
        {
          "sql_queries":    false,
          "list_databases": false,
          "list_tables":    true,
          "preview_table":  false
        }
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
      }.freeze

      NON_ATTRIBUTES = %w(schema table provider).freeze

      def attribute_name(parameter_name, value)
        attribute_name = ATTRIBUTE_NAMES[parameter_name.to_s.downcase] || parameter_name.to_s
        if attribute_name == 'host' && IpChecker.is_ip?(value)
          attribute_name = 'hostaddr'
        end
        attribute_name
      end

      def connection_attributes
        @params.except(*NON_ATTRIBUTES).map { |k, v| [attribute_name(k, v), v] }
      end

      SERVER_OPTIONS  = %w(host hostaddr port dbname).freeze
      USERMAP_OPTIONS = %w(user password).freeze

      def server_options
        connection_attributes.slice(*SERVER_OPTIONS).parameters
      end

      def user_options
        connection_attributes.slice(*USERMAP_OPTIONS).parameters
      end

      def table_options
        connection_attributes.except(*(SERVER_OPTIONS + USERMAP_OPTIONS)).parameters
      end

    end

  end
end

# encoding: utf-8

require_relative './fdw'

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
    # Note that the password parameter is required: postgres_fdw won't allow non-superusers to connect
    # to foreign servers that don't require a password (and table copy is performed using a non-superuser).
    #
    # TODO: add support for sql_query parameter
    #
    class PgFdwProvider < FdwProvider

      def initialize(context, params)
        super
      end

      REQUIRED_PARAMETERS = %w(table server database username password).freeze
      OPTIONAL_PARAMETERS = %w(schema port).freeze

      def optional_parameters
        OPTIONAL_PARAMETERS
      end

      def required_parameters
        REQUIRED_PARAMETERS
      end

      def table_name
        @params[:table]
      end

      def foreign_table_name_for(server_name, name = nil)
        fdw_adjusted_table_name("#{unique_prefix_for(server_name)}#{name || table_name}")
      end

      def unique_prefix_for(server_name)
        # server_name should already be unique
        "#{server_name}_"
      end

      def remote_schema_name
        schema = @params[:schema]
        schema = 'public' if schema.blank?
        schema
      end

      def fdw_create_server(server_name)
        execute_as_superuser fdw_create_server_sql('postgres_fdw', server_name, server_options)
      end

      def fdw_create_usermaps(server_name)
        execute_as_superuser fdw_create_usermap_sql(server_name, @connector_context.database_username, user_options)
        execute_as_superuser fdw_create_usermap_sql(server_name, 'postgres', user_options)
      end

      def fdw_create_foreign_table(server_name)
        remote_table = table_name
        foreign_table = foreign_table_name_for(server_name)
        options = table_options
        schema = foreign_table_schema
        cmds = []
        cmds << fdw_import_foreign_schema_limited_sql(server_name, remote_schema_name, schema, remote_table, options)
        if remote_table != foreign_table
          cmds << fdw_rename_foreign_table_sql(schema, remote_table, foreign_table)
        end
        cmds << fdw_grant_select_sql(schema, foreign_table, @connector_context.database_username)
        execute_as_superuser cmds.join("\n")
        foreign_table
      end

      def fdw_list_tables(server_name, limit)
        # Create auxiliar foreign tables for pg_class, pg_namespace
        ext_pg_class = foreign_table_name_for(server_name, 'pg_class')
        ext_pg_namespace = foreign_table_name_for(server_name, 'pg_namespace')
        commands = []
        commands << fdw_create_foreign_table_if_not_exists_sql(
          server_name, foreign_table_schema, ext_pg_class,
          ['relname name', 'relnamespace oid', 'relkind char'],
          schema_name: 'pg_catalog', table_name: 'pg_class'
        )
        commands << fdw_create_foreign_table_if_not_exists_sql(
          server_name, foreign_table_schema, ext_pg_namespace,
          ['nspname name', 'oid oid'],
          schema_name: 'pg_catalog', table_name: 'pg_namespace'
        )
        limit_clause = limit.to_i > 0 ? "LIMIT #{limit}" : ''
        execute_as_superuser(commands.join("\n"))

        execute_as_superuser %{
          SELECT n.nspname AS schema, c.relname AS name
          FROM #{fdw_qualified_table_name(foreign_table_schema, ext_pg_class)} c
          JOIN #{fdw_qualified_table_name(foreign_table_schema, ext_pg_namespace)} n ON n.oid = c.relnamespace
            WHERE c.relkind = 'r'
            AND n.nspname NOT IN ('pg_catalog', 'information_schema')
            ORDER BY schema, name
            #{limit_clause};
        }
      ensure
        # Drop auxiliar foreign tables for pg_class, pg_namespace
        commands = []
        commands << fdw_drop_foreign_table_sql(foreign_table_schema, ext_pg_namespace) if ext_pg_namespace
        commands << fdw_drop_foreign_table_sql(foreign_table_schema, ext_pg_class) if ext_pg_class
        execute_as_superuser(commands.join("\n"))
      end

      def fdw_check_connection(server_name)
        fdw_list_tables(server_name, 1)
        true
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

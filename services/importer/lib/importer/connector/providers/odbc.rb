# encoding: utf-8

require_relative './base'

module CartoDB
  module Importer2
    class Connector

      # Base class for ODBC-based providers using odbc_fdw
      #
      # Requirements:
      #   * odbc_fdw extension must be installed in the user database
      #
      # Common parameters:
      # These paramters correspond to options of odbc_fdw which are not connection attributes (odbc_ options);
      # Each driver will define additional parameters to define the connection attributes.
      #   * schema: schema name of the remote schema
      #   * table: name of the remote table to import (if no sql_query is given)
      #     and/or local name of the imported result table
      #   * sql_query (optional): SQL code to be executed remotely to produce the dataset to be imported.
      #     If missing, schema.table will be imported.
      #   * sql_count (optional): SQL code to be executed remotely to compute the number of rows of the dataset
      #     to be imported. This shouldn't be needed in general, but could be needed depending on the SQL dialect
      #     that the driver supports.
      #   * encoding (optional): character encoding used by the external database; default is UTF-8.
      #     The encoding names accepted are those accepted by PostgreSQL.
      #
      class OdbcProvider < Provider

        def initialize(params)
          super
          @columns = Support.fetch_ignoring_case(@params, 'columns')
          @columns = @columns.split(',').map(&:strip) if @columns
        end

        REQUIRED_OPTIONS = %w(table).freeze
        OPTIONAL_OPTIONS = %w(schema sql_query sql_count encoding columns).freeze

        def optional_parameters
          optional_connection_attributes.keys.map(&:to_s) + OPTIONAL_OPTIONS
        end

        def required_parameters
          required_connection_attributes.keys.map(&:to_s) + REQUIRED_OPTIONS
        end

        # Required connection attributes: { name: :internal_name }
        # The :internal_name is what is passed to the driver (through odbc_fdw 'odbc_' options)
        # The :name is the case-insensitive parameter received here trhough the API
        # This can be redefined as needed in derived classes.
        def required_connection_attributes
          {}
        end

        # Connection attributes that are optional: { name: { internal_name: default_value } }
        # Those with non-nil default values will always be set.
        # name/internal_name as in `required_connection_attributes`
        # This can be redefined as needed in derived classes.
        def optional_connection_attributes
          {}
        end

        # Connection attributes with fixed values: { internal_name: value }
        # which are always passed to the driver
        # This can be redefined as needed in derived classes.
        def fixed_connection_attributes
          {}
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
          fdw_create_server 'odbc_fdw', server_name, server_params
        end

        def create_usermap_command(server_name, username)
          fdw_create_usermap server_name, username, user_params
        end

        def create_foreign_table_command(server_name, foreign_table_schema, foreign_table_name, foreign_prefix, username)
          cmds = []
          if @columns.present?
            cmds << fdw_create_foreign_table(server_name, foreign_table_schema, foreign_table_name, @columns, table_params)
          else
            options = table_params.merge(prefix: foreign_prefix)
            cmds << fdw_import_foreign_schema(server_name, remote_schema_name, foreign_table_schema, options)
          end
          cmds << fdw_grant_select(foreign_table_name, foreign_table_schema, username)
          cmds.join "\n"
        end

        private

        def attribute_name_map
          optionals = Hash[optional_connection_attributes.map { |k, v| [k.to_s, v.keys.first.to_s] }]
          stringified_required_attrs = Hash[required_connection_attributes.map { |k,v| [k.to_s, v.to_s] }]
          stringified_required_attrs.merge optionals
        end

        def connection_attributes
          # Extract the connection attributes from the @params
          attribute_names = required_connection_attributes.keys + optional_connection_attributes.keys
          attributes = @params.select(&case_insensitive_in(attribute_names.map(&:to_s)))

          # Apply non-nil default values
          non_nil_defaults = optional_connection_attributes.reject { |_k, v| v.values.first.nil? }
          attributes = attributes.reverse_merge Hash[non_nil_defaults.map { |k, v| [k.to_s, v.values.first] }]

          # Map attribute names to internal (driver) attributes
          attributes = Hash[attributes.map { |k, v| [attribute_name_map[k.downcase] || k, v] }]

          # Set fixed attribute values
          attributes = attributes.merge(fixed_connection_attributes.stringify_keys)

          attributes
        end

        def non_connection_parameters
          @params.select(&case_insensitive_in(REQUIRED_OPTIONS + OPTIONAL_OPTIONS - ['columns']))
        end

        SERVER_OPTIONS = %w(dsn driver host server address port database).freeze
        USER_OPTIONS   = %w(uid pwd user username password).freeze

        def connection_options(options)
          # Prefix option names with "odbc_"
          Hash[options.map { |option_name, option_value| ["odbc_#{option_name}", option_value] }]
        end

        def case_insensitive_in(options)
          ->(k, _v) { k.downcase.in? options.map(&:downcase) }
        end

        def server_params
          params = connection_attributes.select(&case_insensitive_in(SERVER_OPTIONS))
          connection_options params
        end

        def user_params
          params = connection_attributes.select(&case_insensitive_in(USER_OPTIONS))
          connection_options params
        end

        def table_params
          params = connection_attributes.reject(&case_insensitive_in(SERVER_OPTIONS + USER_OPTIONS))
          connection_options(params).merge(non_connection_parameters)
        end

      end

    end
  end
end

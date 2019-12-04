require_relative '../fdw'

module Carto
  class Connector

    # Base class for ODBC-based providers using odbc_fdw
    #
    # Requirements:
    #   * odbc_fdw extension must be installed in the user database
    #
    # Parameters: except for connection, these parameters correspond to options of odbc_fdw which are not connection
    # attributes (odbc_ prefixed options).
    #   * connection: connection attributes; the content is defined by derived classes and will be used
    #     to generate the odbc_ options of odbc_fdw.
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
    # Derived classes for specific ODBC drivers will typically redine at least these methods that map
    # parameters to ODBC connection attributes:
    #
    # * `fixed_odbc_attributes` defines fixed values for odbc attributes
    # * `connection_odbc_attributes` maps connection parameters to odbc attributes
    # * `odbc_attributes` maps (non-connection) parameters to odbc attributes
    #
    class OdbcProvider < FdwProvider

      def initialize(context, params)
        super
        @columns = @params[:columns]
        @columns = @columns.split(',').map(&:strip) if @columns
        @connection = Parameters.new(
          @params[:connection],
          required: odbc_attributes_for_required_connection_parameters.keys,
          optional: odbc_attributes_for_optional_connection_parameters.keys
        )
      end

      def errors(only_for: nil)
        super + @connection.errors(parameters_term: 'connection parameters')
      end

      required_parameters %I(table connection)
      optional_parameters %I(import_as schema sql_query sql_count encoding columns)

      # ODBC attributes for (non-connection) parameters: { name: :internal_name }#
      # The :internal_name is what is passed to the driver (through odbc_fdw 'odbc_' options)
      # The :name is the case-insensitive parameter received here trhough the API
      # Optional parameters are defined as { name: { internal_name: default_value } }
      # This can be redefined as needed in derived classes.
      def odbc_attributes
        {}
      end

      # ODBC attributes for connector parameters: { name: :internal_name }#
      # The :internal_name is what is passed to the driver (through odbc_fdw 'odbc_' options)
      # The :name is the case-insensitive parameter received here trhough the API inside `connector`.
      # Optional parameters are defined as { name: { internal_name: default_value } }
      # This can be redefined as needed in derived classes.
      def connection_odbc_attributes
        {}
      end

      # ODBC attributes with fixed values: { internal_name: value }
      # which are always passed to the driver
      # This can be redefined as needed in derived classes.
      def fixed_odbc_attributes
        {}
      end

      # Return table options to connect to a query (used for checking the connection)
      def options_for_query(_query)
        must_be_defined_in_derived_class
      end

      # Name that will be given to the local imported table
      def table_name
        @params[:import_as] || @params[:table]
      end

      # Name of the external table to be imported.
      # For queries this is a conventional name that can be used to name the foreign table.
      def external_name
        if @params[:sql_query].present?
          table_name
        else
          @params[:table]
        end
      end

      def foreign_table_name_for(server_name, name = nil)
        fdw_adjusted_table_name("#{unique_prefix_for(server_name)}#{name || external_name}")
      end

      def unique_prefix_for(server_name)
        # server_name should already be unique
        "#{server_name}_"
      end

      def remote_schema_name
        schema = table_options[:schema]
        schema = 'public' if schema.blank?
        schema
      end

      def fdw_create_server(server_name)
        sql = fdw_create_server_sql 'odbc_fdw', server_name, server_options
        execute_as_superuser sql
      end

      def fdw_create_usermaps(server_name)
        execute_as_superuser fdw_create_usermap_sql(server_name, @connector_context.database_username, user_options)
        execute_as_superuser fdw_create_usermap_sql(server_name, 'postgres', user_options)
      end

      def fdw_create_foreign_table(server_name)
        cmds = []
        foreign_table_name = foreign_table_name_for(server_name)
        if @columns.present?
          # note that it uses table for both imported external table and local name (with prefix) <<<<<
          cmds << fdw_create_foreign_table_sql(
            server_name, foreign_table_schema, foreign_table_name, @columns, table_options
          )
        else
          options = table_options.merge(prefix: unique_prefix_for(server_name))
          cmds << fdw_import_foreign_schema_sql(server_name, remote_schema_name, foreign_table_schema, options)
        end
        cmds << fdw_grant_select_sql(foreign_table_schema, foreign_table_name, @connector_context.database_username)
        execute_as_superuser_with_timeout cmds.join("\n")
        foreign_table_name
      end

      def fdw_list_tables(server_name, limit)
        execute %{
          SELECT * FROM ODBCTablesList('#{server_name}',#{limit.to_i});
        }
      end

      def fdw_check_connection(server_name)
        cmds = []
        name = 'check_connection'
        foreign_table_name = foreign_table_name_for(server_name, name)
        columns = ['ok int']
        cmds << fdw_create_foreign_table_sql(
          server_name, foreign_table_schema, foreign_table_name, columns, check_table_options("SELECT 1 AS ok", server_name, name)
        )
        cmds << fdw_grant_select_sql(foreign_table_schema, foreign_table_name, @connector_context.database_username)
        execute_as_superuser cmds.join("\n")
        result = execute %{
          SELECT * FROM #{qualified_foreign_table_name foreign_table_name};
        }
        result && result.first[:ok] == 1
      end

      def features_information
        {
          "sql_queries":    true,
          "list_databases": false,
          "list_tables":    true,
          "preview_table":  false
        }
      end

      def parameters_information
        info = super
        connection = {}
        odbc_attributes_for_required_connection_parameters.keys.each do |name|
          # TODO: description = load template for parameter name of @provider.name
          connection[name.to_s] = {
            required: true
          }
        end
        odbc_attributes_for_optional_connection_parameters.keys.each do |name|
          # TODO: description = load template for parameter name of @provider.name
          connection[name.to_s] = {
            required: false
          }
        end
        info['connection'] = connection if connection.present?
        info
      end

      private

      def attribute_name_map()
        optionals = Hash[odbc_attributes_for_optional_connection_parameters.map { |k, v| [k.to_s, v.keys.first.to_s] }]
        stringified_required_attrs = Hash[odbc_attributes_for_required_connection_parameters.map { |k, v| [k.to_s, v.to_s] }]
        stringified_required_attrs.merge optionals
      end

      def attribute_name_map(optional_params, required_params)
        optionals = Hash[optional_params.map { |k, v| [k.to_s, v.keys.first.to_s] }]
        stringified_required_attrs = Hash[required_params.map { |k, v| [k.to_s, v.to_s] }]
        stringified_required_attrs.merge optionals
      end

      def parameters_to_odbc_attributes(params, optional_params, required_params)
        # Extract the connection attributes from the params
        attribute_names = optional_params.keys + required_params.keys
        attributes = params.slice(*attribute_names)

        # Apply non-nil default values
        non_nil_defaults = optional_params.reject { |_k, v| v.values.first.nil? }
        attributes.reverse_merge! Hash[non_nil_defaults.map { |k, v| [k.to_s, v.values.first] }]

        # Map attribute names to internal (driver) attributes
        parameter_to_odbc_attr_map = attribute_name_map(optional_params, required_params)
        attributes = attributes.map { |k, v| [parameter_to_odbc_attr_map[k.to_s.downcase] || k, v] }

        attributes
      end


      # ODBC connection attributes (from parameters)
      def connection_attributes
        # attributes from connection parameters
        attributes = parameters_to_odbc_attributes(@connection, odbc_attributes_for_optional_connection_parameters, odbc_attributes_for_required_connection_parameters)

        # fixed attribute values
        attributes.merge! fixed_odbc_attributes

        # attributes from other parameters
        attributes.merge! parameters_to_odbc_attributes(@params, odbc_attributes_for_optional_parameters, odbc_attributes_for_required_parameters)

        attributes
      end

      def non_connection_parameters
        # parameters mapped to odbc attributes
        attr_params = odbc_attributes_for_optional_parameters.keys + odbc_attributes_for_required_parameters.keys

        @params.slice(*(required_parameters + optional_parameters - %I(columns connection) - attr_params))
      end

      # ODBC Attributes (internal names) which will defined in FDW server options
      def server_attributes
        must_be_defined_in_derived_class
      end

      # OBBC Attributes (internal names) which will defined in FDW user mapping options
      def user_attributes
        must_be_defined_in_derived_class
      end

      # Convert parameters to FDW options
      def connection_options(parameters)
        # Prefix option names with "odbc_"
        # Quote values that contain semicolons (the ODBC connection string pair separator)
        parameters.map { |option_name, option_value| ["odbc_#{option_name}", quoted_value(option_value)] }
      end

      def odbc_attributes_for_required_connection_parameters
        # required parameters are defined as entries mapped to symbols/strings:
        # as in: `{ parameter_name: :odbc_attribute_name }`
        connection_odbc_attributes.select{|k,v| !v.kind_of?(Hash)}
      end

      def odbc_attributes_for_optional_connection_parameters
        # optional parameters are defined as entries mapped to a Hash that maps the odbc attribute name to its
        # default value, as in: `{ parameter_name: { odbc_attribute_name: default_value } }`
        connection_odbc_attributes.select{|k,v| v.kind_of?(Hash)}
      end

      def odbc_attributes_for_required_parameters
        # required parameters are defined as entries mapped to symbols/strings:
        # as in: `{ parameter_name: :odbc_attribute_name }`
        odbc_attributes.select{|k,v| !v.kind_of?(Hash)}
      end

      def odbc_attributes_for_optional_parameters
        # optional parameters are defined as entries mapped to a Hash that maps the odbc attribute name to its
        # default value, as in: `{ parameter_name: { odbc_attribute_name: default_value } }`
        odbc_attributes.select{|k,v| v.kind_of?(Hash)}
      end

      class <<self
        # class helpers to define abstract method implementations
        def fixed_odbc_attributes(attrs)
          define_method(:fixed_odbc_attributes) { attrs.freeze }
        end
        def connection_odbc_attributes(attrs)
          define_method(:connection_odbc_attributes) { attrs.freeze }
        end
        def odbc_attributes(attrs)
          define_method(:odbc_attributes) { attrs.freeze }
        end
        def server_attributes(attrs)
          private define_method(:server_attributes) { attrs.freeze }
        end
        def user_attributes(attrs)
          private define_method(:user_attributes) { attrs.freeze }
        end
      end

      def quoted_value(value)
        value = value.to_s
        if value.to_s.include?(';') && !value.to_s.include?('}')
          "{#{value}}"
        else
          value
        end
      end

      # FDW server-level options
      def server_options
        connection_options(connection_attributes.slice(*server_attributes)).parameters
      end

      # FDW usermapping-level options
      def user_options
        connection_options(connection_attributes.slice(*user_attributes)).parameters
      end

      # FDW table-level options
      def table_options
        params = connection_options connection_attributes.except(*(server_attributes + user_attributes))
        params = params.merge(non_connection_parameters).parameters

        # The `table` parameter here will be used by the odbc_fdw to
        # name the foreign table.
        params.merge(table: external_name).except(:import_as)
      end

      def check_table_options(query, server_name, name)
        table_options.merge(
          sql_query: query,
          prefix: unique_prefix_for(server_name),
          table: name # Not used, but required
        )
      end
    end
  end
end

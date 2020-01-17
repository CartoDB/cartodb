module Carto
  class FederatedTablesService
    def initialize(user:)
      @user = user
      @superuser_db_connection = @user.in_database(as: :superuser)
      @user_db_connection = @user.in_database()
    end

    # Federated Servers

    def list_servers(order:, direction:, per_page:, page:, offset:)
      @user_db_connection[
        select_federated_servers_query(order: order, direction: direction, per_page: per_page, offset: offset)
      ].all
    end

    def count_servers
      @user_db_connection[count_federated_servers_query].first[:count]
    end

    def register_server(federated_server_name:, **attributes)
      @superuser_db_connection[
        register_federated_server_query(federated_server_name: federated_server_name, **attributes)
      ].first
      grant_access_to_federated_server(
        federated_server_name: federated_server_name,
        db_role: @user.database_username
      )
      get_server(federated_server_name: federated_server_name)
    end

    def grant_access_to_federated_server(federated_server_name:, db_role:)
      @superuser_db_connection[
        grant_access_to_federated_server_query(
          federated_server_name: federated_server_name,
          db_role: db_role
        )
      ].all
    end

    def get_server(federated_server_name:)
      @user_db_connection[get_federated_server_query(federated_server_name: federated_server_name)].first
    end

    def update_server(federated_server_name:, **attributes)
      unregister_server(federated_server_name: federated_server_name)
      register_server(federated_server_name: federated_server_name, **attributes)
      get_server(federated_server_name: federated_server_name)
    end

    def unregister_server(federated_server_name:)
      @superuser_db_connection[
        unregister_federated_server_query(federated_server_name: federated_server_name)
      ].first
    end

    def revoke_access_to_federated_server(federated_server_name:, db_role:)
      @superuser_db_connection[
        revoke_access_to_federated_server_query(
          federated_server_name: federated_server_name,
          db_role: db_role
        )
      ].all
    end

    # Remote Schemas

    def list_remote_schemas(federated_server_name:, order:, direction:, per_page:, page:, offset:)
      @user_db_connection[
        select_remote_schemas_query(
          federated_server_name: federated_server_name,
          order: order,
          direction: direction,
          per_page: per_page,
          offset: offset
        )
      ].all
    end

    def count_remote_schemas(federated_server_name:)
      @user_db_connection[
        count_remote_schemas_query(federated_server_name: federated_server_name)
      ].first[:count]
    end

    # Remote Tables

    def list_remote_tables(federated_server_name:, remote_schema_name:, order:, direction:, per_page:, page:, offset:)
      remote_tables = @user_db_connection[
        select_remote_tables_query(
          federated_server_name: federated_server_name,
          remote_schema_name: remote_schema_name,
          order: order,
          direction: direction,
          per_page: per_page,
          offset: offset
        )
      ].all
      remote_tables.map do |remote_table|
        remote_table.merge(columns: JSON.parse(remote_table[:columns], symbolize_names: true))
      end
    end

    def count_remote_tables(federated_server_name:, remote_schema_name:)
      @user_db_connection[
        count_remote_tables_query(federated_server_name: federated_server_name, remote_schema_name: remote_schema_name)
      ].first[:count]
    end

    def register_table(federated_server_name:, remote_schema_name:, remote_table_name:, **attributes)
      @user_db_connection[
        register_remote_table_query(
          federated_server_name: federated_server_name,
          remote_schema_name: remote_schema_name,
          remote_table_name: remote_table_name,
          **attributes
        )
      ].first
      get_remote_table(
        federated_server_name: federated_server_name,
        remote_schema_name: remote_schema_name,
        remote_table_name: remote_table_name
      )
    end

    def get_remote_table(federated_server_name:, remote_schema_name:, remote_table_name:)
      remote_table = @user_db_connection[
        get_remote_table_query(
          federated_server_name: federated_server_name,
          remote_schema_name: remote_schema_name,
          remote_table_name: remote_table_name
        )
      ].first
      return unless remote_table
      remote_table.merge(columns: JSON.parse(remote_table[:columns], symbolize_names: true))
    end

    def update_table(federated_server_name:, remote_schema_name:, remote_table_name:, **attributes)
      unregister_table(
        federated_server_name: federated_server_name,
        remote_schema_name: remote_schema_name,
        remote_table_name: remote_table_name
      )
      register_table(
        federated_server_name: federated_server_name,
        remote_schema_name: remote_schema_name,
        remote_table_name: remote_table_name,
        **attributes
      )
      get_remote_table(
        federated_server_name: federated_server_name,
        remote_schema_name: remote_schema_name,
        remote_table_name: remote_table_name
      )
    end

    def unregister_table(federated_server_name:, remote_schema_name:, remote_table_name:)
      @user_db_connection[
        unregister_remote_table_query(
          federated_server_name: federated_server_name,
          remote_schema_name: remote_schema_name,
          remote_table_name: remote_table_name
        )
      ].first
    end

    private

    def select_federated_servers_query(order:, direction:, per_page:, offset:)
      %{
        SELECT * FROM (#{select_servers_query}) AS federated_servers
        ORDER BY #{order} #{direction}
        LIMIT #{per_page}
        OFFSET #{offset}
      }.squish
    end

    def count_federated_servers_query
      "SELECT COUNT(*) FROM (#{select_servers_query}) AS federated_servers"
    end

    def select_servers_query
      %{
        SELECT
          name as federated_server_name,
          readmode as mode,
          dbname,
          host,
          port,
          username,
          '*****' as password
        FROM cartodb.CDB_Federated_Server_List_Servers()
      }.squish
    end

    def register_federated_server_query(
      federated_server_name:,
      host: nil,
      port: nil,
      dbname: nil,
      mode:,
      username: nil,
      password: nil
    )
      config_server = {}
      config_server["dbname"] = dbname if dbname.present?
      config_server["host"] = host if host.present?
      config_server["port"] = port if port.present?
      config_server["extensions"] = "postgis"
      config_server["updatable"] = mode != 'read-write' ? "false" : "write"
      config_server["use_remote_estimate"] = "true"
      config_server["fetch_size"] = "1000"
      config_credentials = {}
      config_credentials["username"] = username if username.present?
      config_credentials["password"] = password if password.present?

      config = { server: config_server, credentials: config_credentials }

      server_str = @user_db_connection.literal(federated_server_name)
      config_str = @user_db_connection.literal(config.to_json)

      %{
        SELECT cartodb.CDB_Federated_Server_Register_PG(server := #{server_str}::text, config := #{config_str}::jsonb)
      }.squish
    end

    def grant_access_to_federated_server_query(federated_server_name:, db_role:)
      server_str = @user_db_connection.literal(federated_server_name)
      db_role_str = @user_db_connection.literal(db_role)
      %{
        SELECT cartodb.CDB_Federated_Server_Grant_Access(server := #{server_str}, db_role := #{db_role_str}::name)
      }.squish
    end

    def revoke_access_to_federated_server_query(federated_server_name:, db_role:)
      server_str = @user_db_connection.literal(federated_server_name)
      db_role_str = @user_db_connection.literal(db_role)
      %{
        SELECT cartodb.CDB_Federated_Server_Revoke_Access(server := #{server_str}, db_role := #{db_role_str}::name)
      }.squish
    end

    def get_federated_server_query(federated_server_name:)
      server_str = @user_db_connection.literal(federated_server_name)
      %{
        SELECT
          name as federated_server_name,
          readmode as mode,
          dbname,
          host,
          port,
          username,
          '*****' as password
        FROM cartodb.CDB_Federated_Server_List_Servers(server := #{server_str}::text)
      }.squish
    end

    def unregister_federated_server_query(federated_server_name:)
      server_str = @user_db_connection.literal(federated_server_name)
      %{
        SELECT
          cartodb.CDB_Federated_Server_Unregister(server := #{server_str}::text)
      }.squish
    end

    # Remote Schemas

    def select_remote_schemas_query(federated_server_name:, order:, direction:, per_page:, offset:)
      %{
        SELECT * FROM (#{select_schemas_query(federated_server_name: federated_server_name)}) AS remote_schemas
        ORDER BY #{order} #{direction}
        LIMIT #{per_page}
        OFFSET #{offset}
      }.squish
    end

    def count_remote_schemas_query(federated_server_name:)
      "SELECT COUNT(*) FROM (#{select_schemas_query(federated_server_name: federated_server_name)}) AS remote_schemas"
    end

    def select_schemas_query(federated_server_name:)
      server_str = @user_db_connection.literal(federated_server_name)
      %{
        SELECT
          remote_schema as remote_schema_name
        FROM
          cartodb.CDB_Federated_Server_List_Remote_Schemas(server => #{server_str})
      }.squish
    end

    # Remote Tables

    def select_remote_tables_query(federated_server_name:, remote_schema_name:, order:, direction:, per_page:, offset:)
      %{
        SELECT * FROM (#{select_tables_query(federated_server_name: federated_server_name, remote_schema_name: remote_schema_name)}) AS remote_tables
        ORDER BY #{order} #{direction}
        LIMIT #{per_page}
        OFFSET #{offset}
      }.squish
    end

    def count_remote_tables_query(federated_server_name:, remote_schema_name:)
      "SELECT COUNT(*) FROM (#{select_tables_query(federated_server_name: federated_server_name, remote_schema_name: remote_schema_name)}) AS remote_tables"
    end

    def select_tables_query(federated_server_name:, remote_schema_name:)
      server_str = @user_db_connection.literal(federated_server_name)
      schema_str = @user_db_connection.literal(remote_schema_name)
      %{
        SELECT
          registered,
          local_qualified_name as qualified_name,
          remote_table as remote_table_name,
          '#{remote_schema_name}' as remote_schema_name,
          id_column_name,
          geom_column_name,
          webmercator_column_name,
          columns
        FROM
          cartodb.CDB_Federated_Server_List_Remote_Tables(server => #{server_str}, remote_schema => #{schema_str})
      }.squish
    end

    def literal_attribute_or_null(attribute)
      return "NULL" if attribute.blank?
      @user_db_connection.literal(attribute)
    end

    def register_remote_table_query(
      federated_server_name:,
      remote_schema_name:,
      remote_table_name:,
      local_table_name_override:,
      id_column_name: nil,
      geom_column_name: nil,
      webmercator_column_name: nil
    )
      %{
        SELECT cartodb.CDB_Federated_Table_Register(
          server => #{literal_attribute_or_null(federated_server_name)},
          remote_schema => #{literal_attribute_or_null(remote_schema_name)},
          remote_table => #{literal_attribute_or_null(remote_table_name)},
          id_column => #{literal_attribute_or_null(id_column_name)},
          geom_column => #{literal_attribute_or_null(geom_column_name)},
          webmercator_column => #{literal_attribute_or_null(webmercator_column_name)},
          local_name => #{literal_attribute_or_null(local_table_name_override)}
        )
      }.squish
    end

    def get_remote_table_query(federated_server_name:, remote_schema_name:, remote_table_name:)
      server_str = @user_db_connection.literal(federated_server_name)
      schema_str = @user_db_connection.literal(remote_schema_name)
      table_str = @user_db_connection.literal(remote_table_name)
      %{
        SELECT
          registered,
          local_qualified_name as qualified_name,
          remote_table as remote_table_name,
          #{schema_str} as remote_schema_name,
          id_column_name,
          geom_column_name,
          webmercator_column_name,
          columns
        FROM
          cartodb.CDB_Federated_Server_List_Remote_Tables(
            server => #{server_str},
            remote_schema => #{schema_str}
          )
        WHERE
          remote_table = #{table_str}
      }.squish
    end

    def unregister_remote_table_query(federated_server_name:, remote_schema_name:, remote_table_name:)
      server_str = @user_db_connection.literal(federated_server_name)
      schema_str = @user_db_connection.literal(remote_schema_name)
      table_str = @user_db_connection.literal(remote_table_name)
      %{
        SELECT
          cartodb.CDB_Federated_Table_Unregister(
            server => #{server_str},
            remote_schema => #{schema_str},
            remote_table => #{table_str}
          )
      }.squish
    end
  end
end

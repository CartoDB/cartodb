module Carto
  class FederatedTablesService
    def initialize(user:)
      @user = user
      @superuser_db_connection = @user.in_database(as: :superuser)
      @user_db_connection = @user.in_database()
    end

    # Federated Servers

    def list_servers(pagination)
      pagination[:offset] = (pagination[:page] - 1) * pagination[:per_page]
      @user_db_connection[
        select_federated_servers_query(pagination)
      ].all
    end

    def count_servers
      @user_db_connection[count_federated_servers_query].first[:count]
    end

    def register_server(attributes)
      @superuser_db_connection[register_federated_server_query(attributes)].first
      get_server(federated_server_name: attributes[:federated_server_name])
    end

    def grant_access_to_federated_server(federated_server_name:, db_role:)
      @superuser_db_connection[
        grant_access_to_federated_server_query(
          federated_server_name: federated_server_name,
          db_role: db_role
        )
      ]
    end

    def revoke_access_to_federated_server(federated_server_name:, db_role:)
      @superuser_db_connection[
        revoke_access_to_federated_server_query(
          federated_server_name: federated_server_name,
          db_role: db_role
        )
      ]
    end

    def get_server(federated_server_name:)
      @user_db_connection[get_federated_server_query(federated_server_name: federated_server_name)].first
    end

    def update_server(attributes)
      unregister_server(federated_server_name: attributes[:federated_server_name])
      register_server(attributes)
      get_server(federated_server_name: attributes[:federated_server_name])
    end

    def unregister_server(federated_server_name:)
      @superuser_db_connection[
        unregister_federated_server_query(federated_server_name: federated_server_name)
      ].first
    end

    # Remote Schemas

    def list_remote_schemas(federated_server_name, pagination)
      pagination[:offset] = (pagination[:page] - 1) * pagination[:per_page]
      # TODO: use @user_db_connection instead
      @superuser_db_connection[
        select_remote_schemas_query(federated_server_name, pagination)
      ].all
    end

    def count_remote_schemas(federated_server_name)
      # TODO: use @user_db_connection instead
      @superuser_db_connection[
        count_remote_schemas_query(federated_server_name)
      ].first[:count]
    end

    # Remote Tables

    def list_remote_tables(federated_server_name, remote_schema_name, pagination)
      pagination[:offset] = (pagination[:page] - 1) * pagination[:per_page]
      # TODO: use @user_db_connection instead
      @superuser_db_connection[
        select_remote_tables_query(federated_server_name, remote_schema_name, pagination)
      ].all
    end

    def count_remote_tables(federated_server_name, remote_schema_name)
      # TODO: use @user_db_connection instead
      @superuser_db_connection[
        count_remote_tables_query(federated_server_name, remote_schema_name)
      ].first[:count]
    end

    def register_table(attributes)
      @superuser_db_connection[register_remote_table_query(attributes)].first
      get_remote_table(
        federated_server_name: attributes[:federated_server_name],
        remote_schema_name: attributes[:remote_schema_name],
        remote_table_name: attributes[:remote_table_name]
      )
    end

    def get_remote_table(federated_server_name:, remote_schema_name:, remote_table_name:)
      # TODO: use @user_db_connection instead
      @superuser_db_connection[
        get_remote_table_query(
          federated_server_name: federated_server_name,
          remote_schema_name: remote_schema_name,
          remote_table_name: remote_table_name
        )
      ].first
    end

    def update_table(attributes)
      unregister_table(
        federated_server_name: attributes[:federated_server_name],
        remote_schema_name: attributes[:remote_schema_name],
        remote_table_name: attributes[:remote_table_name]
      )
      register_table(attributes)
      get_remote_table(
        federated_server_name: attributes[:federated_server_name],
        remote_schema_name: attributes[:remote_schema_name],
        remote_table_name: attributes[:remote_table_name]
      )
    end

    def unregister_table(federated_server_name:, remote_schema_name:, remote_table_name:)
      @superuser_db_connection[
        unregister_remote_table_query(
          federated_server_name: federated_server_name,
          remote_schema_name: remote_schema_name,
          remote_table_name: remote_table_name
        )
      ].first
    end

    private

    def select_federated_servers_query(pagination)
      %{
        SELECT * FROM (#{select_servers_query}) AS federated_servers
        ORDER BY #{pagination[:order]} #{pagination[:direction]}
        LIMIT #{pagination[:per_page]}
        OFFSET #{pagination[:offset]}
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

    def register_federated_server_query(attributes)
      %{
        SELECT cartodb.CDB_Federated_Server_Register_PG(server := '#{attributes[:federated_server_name]}'::text, config := '{
          "server": {
            "dbname": "#{attributes[:dbname]}",
            "host": "#{attributes[:host]}",
            "port": "#{attributes[:port]}",
            "extensions": "postgis",
            "updatable": "#{attributes[:mode] == 'read-only' ? 'false' : 'true'}",
            "use_remote_estimate": "true",
            "fetch_size": "1000"
          },
          "credentials": {
            "username": "#{attributes[:username]}",
            "password": "#{attributes[:password]}"
          }
        }'::jsonb);
      }.squish
    end

    def grant_access_to_federated_server_query(federated_server_name:, db_role:)
      %{
        SELECT CDB_Federated_Server_Grant_Access(server := '#{federated_server_name}', db_role := '#{db_role}'::name)
      }.squish
    end

    def revoke_access_to_federated_server_query(federated_server_name:, db_role:)
      %{
        SELECT CDB_Federated_Server_Revoke_Access(server := '#{federated_server_name}', db_role := '#{db_role}'::name)
      }.squish
    end

    def get_federated_server_query(federated_server_name:)
      %{
        SELECT
          name as federated_server_name,
          readmode as mode,
          dbname,
          host,
          port,
          username,
          '*****' as password
        FROM cartodb.CDB_Federated_Server_List_Servers(server := '#{federated_server_name}'::text)
      }.squish
    end

    def unregister_federated_server_query(federated_server_name:)
      %{
        SELECT
          cartodb.CDB_Federated_Server_Unregister(server := '#{federated_server_name}'::text)
      }.squish
    end

    # Remote Schemas

    def select_remote_schemas_query(federated_server_name, pagination)
      %{
        SELECT * FROM (#{select_schemas_query(federated_server_name)}) AS remote_schemas
        ORDER BY #{pagination[:order]} #{pagination[:direction]}
        LIMIT #{pagination[:per_page]}
        OFFSET #{pagination[:offset]}
      }.squish
    end

    def count_remote_schemas_query(federated_server_name)
      "SELECT COUNT(*) FROM (#{select_schemas_query(federated_server_name)}) AS remote_schemas"
    end

    def select_schemas_query(federated_server_name)
      %{
        SELECT
          remote_schema as remote_schema_name
        FROM
          cartodb.CDB_Federated_Server_List_Remote_Schemas(server => '#{federated_server_name}'::text)
      }.squish
    end

    # Remote Tables

    def select_remote_tables_query(federated_server_name, remote_schema_name, pagination)
      %{
        SELECT * FROM (#{select_tables_query(federated_server_name, remote_schema_name)}) AS remote_tables
        ORDER BY #{pagination[:order]} #{pagination[:direction]}
        LIMIT #{pagination[:per_page]}
        OFFSET #{pagination[:offset]}
      }.squish
    end

    def count_remote_tables_query(federated_server_name, remote_schema_name)
      "SELECT COUNT(*) FROM (#{select_tables_query(federated_server_name, remote_schema_name)}) AS remote_tables"
    end

    def select_tables_query(federated_server_name, remote_schema_name)
      %{
        SELECT
          'true' as registered,
          '#{remote_schema_name}' || '.' || remote_table as qualified_name,
          '#{remote_schema_name}' as remote_schema_name,
          remote_table as remote_table_name
        FROM
          cartodb.CDB_Federated_Server_List_Remote_Tables(server => '#{federated_server_name}', remote_schema => '#{remote_schema_name}')
      }.squish
    end

    def register_remote_table_query(attributes)
      %{
        SELECT cartodb.CDB_Federated_Table_Register(
          server => '#{attributes[:federated_server_name]}',
          remote_schema => '#{attributes[:remote_schema_name]}',
          remote_table => '#{attributes[:remote_table_name]}',
          id_column => '#{attributes[:id_column_name]}',
          geom_column => '#{attributes[:geom_column_name]}',
          webmercator_column => '#{attributes[:webmercator_column_name]}',
          local_name => '#{attributes[:local_table_name_override]}'
        )
      }.squish
    end

    def get_remote_table_query(federated_server_name:, remote_schema_name:, remote_table_name:)
      %{
        SELECT
          remote_name as remote_table_name,
          local_name as qualified_name
        FROM
          CDB_Federated_Server_List_Registered_Tables(
            server => '#{federated_server_name}',
            remote_schema => '#{remote_schema_name}'
          )
        WHERE
          remote_name = '#{remote_table_name}'
      }.squish
    end

    def unregister_remote_table_query(federated_server_name:, remote_schema_name:, remote_table_name:)
      %{
        SELECT
          CDB_Federated_Table_Unregister(
            server => '#{federated_server_name}',
            remote_schema => '#{remote_schema_name}',
            remote_table => '#{remote_table_name}'
          )
      }.squish
    end
  end
end

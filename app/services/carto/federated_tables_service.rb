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
      @superuser_db_connection[
        register_federated_server_query(attributes)
      ].first
    end

    def get_server(federated_server_name:)
      @user_db_connection[get_federated_server_query(federated_server_name: federated_server_name)].first
    end

    def update_server(attributes)
      @superuser_db_connection[
        update_federated_server_query(attributes)
      ].first
    end

    def unregister_server(federated_server_name:)
      @superuser_db_connection[
        unregister_federated_server_query(federated_server_name: federated_server_name)
      ].first
    end

    # Remote Schemas

    def list_remote_schemas(federated_server_name, pagination)
      pagination[:offset] = (pagination[:page] - 1) * pagination[:per_page]
      @user_db_connection[
        select_remote_schemas_query(federated_server_name, pagination)
      ].all
    end

    def count_remote_schemas(federated_server_name)
      @user_db_connection[
        count_remote_schemas_query(federated_server_name)
      ].first[:count]
    end

    # Remote Tables

    def list_remote_tables(federated_server_name, remote_schema_name, pagination)
      pagination[:offset] = (pagination[:page] - 1) * pagination[:per_page]
      @user_db_connection[
        select_remote_tables_query(federated_server_name, remote_schema_name, pagination)
      ].all
    end

    def count_remote_tables(federated_server_name, remote_schema_name)
      @user_db_connection[
        count_remote_tables_query(federated_server_name, remote_schema_name)
      ].first[:count]
    end

    def register_table(attributes)
      @superuser_db_connection[
        register_remote_table_query(attributes)
      ].first
    end

    def get_remote_table(federated_server_name:, remote_schema_name:, remote_table_name:)
      @user_db_connection[
        get_remote_table_query(
          federated_server_name: federated_server_name,
          remote_schema_name: remote_schema_name,
          remote_table_name: remote_table_name
        )
      ].first
    end

    def update_table(attributes)
      @superuser_db_connection[
        update_remote_table_query(attributes)
      ].first
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

    # WIP: Fake query to return a list of federated servers
    def select_servers_query
      %{
        SELECT
          'amazon' as federated_server_name,
          'read-only' as mode,
          'testdb' as dbname,
          'myhostname.us-east-2.rds.amazonaws.com' as host,
          '5432' as port,
          'read_only_user' as username,
          '*****' as password
        UNION ALL
        SELECT
          'azure' as federated_server_name,
          'read-only' as mode,
          'db' as dbname,
          'us-east-2.azure.com' as host,
          '5432' as port,
          'cartofante' as username,
          '*****' as password
      }.squish
    end

    # WIP: Fake query to register a federated server
    def register_federated_server_query(attributes)
      %{
        SELECT
          '#{attributes[:federated_server_name]}' as federated_server_name,
          '#{attributes[:mode]}' as mode,
          '#{attributes[:dbname]}' as dbname,
          '#{attributes[:host]}' as host,
          '#{attributes[:port]}' as port,
          '#{attributes[:username]}' as username,
          '#{attributes[:password]}' as password
      }.squish
    end

    # WIP: Fake query to get a federated server
    def get_federated_server_query(federated_server_name:)
      %{
        SELECT
          '#{federated_server_name}' as federated_server_name,
          'read-only' as mode,
          'testdb' as dbname,
          'myhostname.us-east-2.rds.amazonaws.com' as host,
          '5432' as port,
          'read_only_user' as username,
          'secret' as password
      }.squish
    end

    # WIP: Fake query to update a federated server
    def update_federated_server_query(attributes)
      %{
        SELECT
          '#{attributes[:federated_server_name]}' as federated_server_name,
          '#{attributes[:mode]}' as mode,
          '#{attributes[:dbname]}' as dbname,
          '#{attributes[:host]}' as host,
          '#{attributes[:port]}' as port,
          '#{attributes[:username]}' as username,
          '#{attributes[:password]}' as password
      }.squish
    end

    # WIP: Fake query to unregister a federated server
    def unregister_federated_server_query(federated_server_name:)
      %{
        SELECT
          '#{federated_server_name}' as federated_server_name,
          'read-only' as mode,
          'testdb' as dbname,
          'myhostname.us-east-2.rds.amazonaws.com' as host,
          '5432' as port,
          'read_only_user' as username,
          'secret' as password
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
          'default' as remote_schema_name
        UNION ALL
        SELECT
          'locations' as remote_schema_name
      }.squish
    end

    # Remote Tables

    def select_remote_tables_query(federated_server_name, remote_schema_name, pagination)
      %{
        SELECT * FROM (#{select_tables_query(federated_server_name, remote_schema_name)}) AS remote_schemas
        ORDER BY #{pagination[:order]} #{pagination[:direction]}
        LIMIT #{pagination[:per_page]}
        OFFSET #{pagination[:offset]}
      }.squish
    end

    def count_remote_tables_query(federated_server_name, remote_schema_name)
      "SELECT COUNT(*) FROM (#{select_tables_query(federated_server_name, remote_schema_name)}) AS remote_schemas"
    end

    # WIP: Fake query to return a list of remote tables
    def select_tables_query(federated_server_name, remote_schema_name)
      %{
        SELECT
          'true' as registered,
          'default.my_table' as qualified_name,
          'default' as remote_schema_name,
          'my_table' as remote_table_name,
          'id' as id_column_name,
          'the_geom' as geom_column_name,
          'the_geom_webmercator' as webmercator_column_name
        UNION ALL
        SELECT
          'false' as registered,
          'public.shops' as qualified_name,
          'public' as remote_schema_name,
          'shops' as remote_table_name,
          'shop_id' as id_column_name,
          'the_geom' as geom_column_name,
          'the_geom_webmercator' as webmercator_column_name
      }.squish
    end

    # WIP: Fake query to register a remote table
    def register_remote_table_query(attributes)
      %{
        SELECT
          '#{attributes[:federated_server_name]}' as federated_server_name,
          '#{attributes[:remote_schema_name]}' as remote_schema_name,
          '#{attributes[:remote_table_name]}' as remote_table_name,
          '#{attributes[:local_table_name_override]}' as local_table_name_override,
          '#{attributes[:remote_schema_name]}.#{attributes[:local_table_name_override]}' as qualified_name,
          '#{attributes[:id_column_name]}' as id_column_name,
          '#{attributes[:geom_column_name]}' as geom_column_name,
          '#{attributes[:webmercator_column_name]}' as webmercator_column_name
      }.squish
    end

    # WIP: Fake query to get a remote table
    def get_remote_table_query(federated_server_name:, remote_schema_name:, remote_table_name:)
      %{
        SELECT
          '#{federated_server_name}' as federated_server_name,
          '#{remote_schema_name}' as remote_schema_name,
          '#{remote_table_name}' as remote_table_name,
          '#{remote_table_name}' as local_table_name_override,
          '#{remote_schema_name}.#{remote_table_name}' as qualified_name,
          'id' as id_column_name,
          'the_geom' as geom_column_name,
          'the_geom_webmercator' as webmercator_column_name
      }.squish
    end

    # WIP: Fake query to update a remote table
    def update_remote_table_query(attributes)
      %{
        SELECT
        '#{attributes[:federated_server_name]}' as federated_server_name,
        '#{attributes[:remote_schema_name]}' as remote_schema_name,
        '#{attributes[:remote_table_name]}' as remote_table_name,
        '#{attributes[:local_table_name_override]}' as local_table_name_override,
        '#{attributes[:remote_schema_name]}.#{attributes[:local_table_name_override]}' as qualified_name,
        '#{attributes[:id_column_name]}' as id_column_name,
        '#{attributes[:geom_column_name]}' as geom_column_name,
        '#{attributes[:webmercator_column_name]}' as webmercator_column_name
      }.squish
    end

    # WIP: Fake query to unregister a remote table
    def unregister_remote_table_query(federated_server_name:, remote_schema_name:, remote_table_name:)
      %{
        SELECT
          '#{federated_server_name}' as federated_server_name,
          '#{remote_schema_name}' as remote_schema_name,
          '#{remote_table_name}' as remote_table_name,
          '#{remote_table_name}' as local_table_name_override,
          '#{remote_schema_name}.#{remote_table_name}' as qualified_name,
          'id' as id_column_name,
          'the_geom' as geom_column_name,
          'the_geom_webmercator' as webmercator_column_name
      }.squish
    end
  end
end

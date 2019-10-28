module Carto
  class FederatedTablesService
    def initialize(user:)
      @user = user
      @superuser_db_connection = @user.in_database(as: :superuser)
      @user_db_connection = @user.in_database()
    end

    # Federated Servers

    def list_servers(page: 1, per_page: 10, order:, direction:)
      offset = (page - 1) * per_page

      @user_db_connection[
        select_federated_servers_query(
          per_page: per_page,
          offset: offset,
          order: order,
          direction: direction
        )
      ].all
    end

    def count_servers
      @user_db_connection[count_federated_servers_query].first[:count]
    end

    def register_server(name:, mode:, dbname:, host:, port:, username:, password:)
      @superuser_db_connection[
        register_federated_server_query(
          name: name,
          mode: mode,
          dbname: dbname,
          host: host,
          port: port,
          username: username,
          password: password
        )
      ].first
    end

    def get_server(name:)
      @user_db_connection[get_federated_server_query(name: name)].first
    end

    def update_server(name:, mode:, dbname:, host:, port:, username:, password:)
      @superuser_db_connection[
        update_federated_server_query(
          name: name,
          mode: mode,
          dbname: dbname,
          host: host,
          port: port,
          username: username,
          password: password
        )
      ].first
    end

    def unregister_server(name:)
      @superuser_db_connection[
        unregister_federated_server_query(name: name)
      ].first
    end

    # Remote Schemas

    def list_remote_schemas(page: 1, per_page: 10, order:, direction:)
      offset = (page - 1) * per_page

      @user_db_connection[
        select_remote_schemas_query(
          per_page: per_page,
          offset: offset,
          order: order,
          direction: direction
        )
      ].all
    end

    def count_remote_schemas
      @user_db_connection[count_remote_schemas_query].first[:count]
    end

    private

    def select_federated_servers_query(per_page: 10, offset: 0, order: 'name', direction: 'asc')
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

    # WIP: Fake query to return a list of federated servers
    def select_servers_query
      %{
        SELECT
          'amazon' as name,
          'read-only' as mode,
          'testdb' as dbname,
          'myhostname.us-east-2.rds.amazonaws.com' as host,
          '5432' as port,
          'read_only_user' as username,
          '*****' as password
        UNION ALL
        SELECT
          'azure' as name,
          'read-only' as mode,
          'db' as dbname,
          'us-east-2.azure.com' as host,
          '5432' as port,
          'cartofante' as username,
          '*****' as password
      }.squish
    end

    # WIP: Fake query to return register a federated server
    def register_federated_server_query(name:, mode:, dbname:, host:, port:, username:, password:)
      %{
        SELECT
          '#{name}' as name,
          '#{mode}' as mode,
          '#{dbname}' as dbname,
          '#{host}' as host,
          '#{port}' as port,
          '#{username}' as username,
          '#{password}' as password
      }.squish
    end

    # WIP: Fake query to return register a federated server
    def get_federated_server_query(name:)
      %{
        SELECT
          '#{name}' as name,
          'read-only' as mode,
          'testdb' as dbname,
          'myhostname.us-east-2.rds.amazonaws.com' as host,
          '5432' as port,
          'read_only_user' as username,
          'secret' as password
      }.squish
    end

    # WIP: Fake query to return register a federated server
    def update_federated_server_query(name:, mode:, dbname:, host:, port:, username:, password:)
      %{
        SELECT
          '#{name}' as name,
          '#{mode}' as mode,
          '#{dbname}' as dbname,
          '#{host}' as host,
          '#{port}' as port,
          '#{username}' as username,
          '#{password}' as password
      }.squish
    end

    # WIP: Fake query to return register a federated server
    def unregister_federated_server_query(name:)
      %{
        SELECT
          '#{name}' as name,
          'read-only' as mode,
          'testdb' as dbname,
          'myhostname.us-east-2.rds.amazonaws.com' as host,
          '5432' as port,
          'read_only_user' as username,
          'secret' as password
      }.squish
    end

    # Remote Schemas

    def select_remote_schemas_query(per_page: 10, offset: 0, order: 'name', direction: 'asc')
      %{
        SELECT * FROM (#{select_schemas_query}) AS remote_schemas
        ORDER BY #{order} #{direction}
        LIMIT #{per_page}
        OFFSET #{offset}
      }.squish
    end

    def count_remote_schemas_query
      "SELECT COUNT(*) FROM (#{select_schemas_query}) AS remote_schemas"
    end

    def select_schemas_query
      %{
        SELECT
          'default' as name
        UNION ALL
        SELECT
          'locations' as name
      }.squish
    end
  end
end

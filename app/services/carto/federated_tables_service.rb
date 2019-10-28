module Carto
  class FederatedTablesService
    def initialize(user:)
      @user = user
      #@superuser_db_connection = @user.in_database(as: :superuser)
      @user_db_connection = @user.in_database()
    end

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
  end
end

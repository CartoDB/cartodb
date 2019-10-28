module Carto
  class FederatedTablesService
    def initialize(user:, page: 1, per_page: 10, order: 'name', direction: 'asc')
      @user = user

      @per_page = per_page
      @order = order
      @direction = direction
      @offset = (page - 1) * per_page

      #@superuser_db_connection = @user.in_database(as: :superuser)
      @user_db_connection = @user.in_database()
    end

    def list_servers
      @user_db_connection[select_federated_servers_query].all
    end

    def count_servers
      @user_db_connection[count_federated_servers_query].first[:count]
    end

    private

    def select_federated_servers_query
      %{
        SELECT * FROM (#{select_servers_query}) AS federated_servers
        ORDER BY #{@order} #{@direction}
        LIMIT #{@per_page}
        OFFSET #{@offset}
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

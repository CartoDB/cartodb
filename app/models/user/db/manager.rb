
module User
  module DB
    class Manager

      # Also default schema for new users
      SCHEMA_PUBLIC = 'public'
      SCHEMA_CARTODB = 'cartdb'

      def initialize(user)
        raise "User nil" unless user
        @user = user
        @user_queries = User::DB::Queries.new(@user)
      end

      def configure_database
        grant_user_in_database
        @user.set_user_privileges
        @user.set_statement_timeouts
        @user.setup_schema if user_model.database_schema != SCHEMA_PUBLIC
        @user.create_function_invalidate_varnish

        @user.reload
      end

      def grant_user_in_database
        @user_queries.run_in_transaction(
          @user_queries.grant_connect_on_database_queries,
          true
        )
      end

      def grant_publicuser_in_database
        @user_queries.run_in_transaction(
          @user_queries.grant_connect_on_database_queries(CartoDB::PUBLIC_DB_USER),
          true
        )
        @user_queries.run_in_transaction(
          @user_queries.grant_read_on_schema_queries(SCHEMA_CARTODB, CartoDB::PUBLIC_DB_USER),
          true
        )
        @user_queries.run_in_transaction(
          [
            "REVOKE SELECT ON cartodb.cdb_tablemetadata FROM #{CartoDB::PUBLIC_DB_USER} CASCADE"
          ],
          true
        )
        @user_queries.run_in_transaction(
          [
            "GRANT USAGE ON SCHEMA #{SCHEMA_PUBLIC} TO #{CartoDB::PUBLIC_DB_USER}",
            "GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA #{SCHEMA_PUBLIC} TO #{CartoDB::PUBLIC_DB_USER}",
            "GRANT SELECT ON spatial_ref_sys TO #{CartoDB::PUBLIC_DB_USER}"
          ],
          true
        )
      end

      def db_configuration_for(user_role = nil)
        logger = (Rails.env.development? || Rails.env.test? ? ::Rails.logger : nil)
        if user_role == :superuser
          ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
            'database' => @user.database_name,
            :logger => logger,
            'host' => @user.database_host
          ) { |_, o, n| n.nil? ? o : n }
        elsif user_role == :cluster_admin
          ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
            'database' => 'postgres',
            :logger => logger,
            'host' => @user.database_host
          ) { |_, o, n| n.nil? ? o : n }
        elsif user_role == :public_user
          ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
            'database' => @user.database_name,
            :logger => logger,
            'username' => CartoDB::PUBLIC_DB_USER, 'password' => CartoDB::PUBLIC_DB_USER_PASSWORD,
            'host' => @user.database_host
          ) { |_, o, n| n.nil? ? o : n }
        elsif user_role == :public_db_user
          ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
            'database' => @user.database_name,
            :logger => logger,
            'username' => database_public_username, 'password' => CartoDB::PUBLIC_DB_USER_PASSWORD,
            'host' => @user.database_host
          ) { |_, o, n| n.nil? ? o : n }
        else
          ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
            'database' => @user.database_name,
            :logger => logger,
            'username' => database_username,
            'password' => database_password,
            'host' => @user.database_host
          ) { |_, o, n| n.nil? ? o : n }
        end
      end

    end
  end
end

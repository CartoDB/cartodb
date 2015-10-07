
require_relative 'queries'

# To avoid collisions with User model
module CartoDB
  module User
    module DB
      class Manager

        # Also default schema for new users
        SCHEMA_PUBLIC = 'public'
        SCHEMA_CARTODB = 'cartodb'
        SCHEMA_IMPORTER = 'cdb_importer'

        def initialize(user)
          raise "User nil" unless user
          @user = user
          @queries = CartoDB::User::DB::Queries.new(@user)
        end

        def queries
          @queries
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
          @queries.run_in_transaction(
            @queries.grant_connect_on_database_queries,
            true
          )
        end

        def grant_publicuser_in_database
          @queries.run_in_transaction(
            @queries.grant_connect_on_database_queries(CartoDB::PUBLIC_DB_USER),
            true
          )
          @queries.run_in_transaction(
            @queries.grant_read_on_schema_queries(SCHEMA_CARTODB, CartoDB::PUBLIC_DB_USER),
            true
          )
          @queries.run_in_transaction(
            [
              "REVOKE SELECT ON cartodb.cdb_tablemetadata FROM #{CartoDB::PUBLIC_DB_USER} CASCADE"
            ],
            true
          )
          @queries.run_in_transaction(
            [
              "GRANT USAGE ON SCHEMA #{SCHEMA_PUBLIC} TO #{CartoDB::PUBLIC_DB_USER}",
              "GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA #{SCHEMA_PUBLIC} TO #{CartoDB::PUBLIC_DB_USER}",
              "GRANT SELECT ON spatial_ref_sys TO #{CartoDB::PUBLIC_DB_USER}"
            ],
            true
          )
        end

        def set_user_privileges_in_own_schema # MU
          @queries.run_in_transaction(
            @queries.grant_all_on_user_schema_queries,
            true
          )
        end

        def set_user_privileges_in_cartodb_schema(db_user = nil)
          @queries.run_in_transaction(
            (
              @queries.grant_read_on_schema_queries(SCHEMA_CARTODB, db_user) +
              @queries.grant_write_on_cdb_tablemetadata_queries(db_user)
            ),
            true
          )
        end

        def set_privileges_to_publicuser_in_own_schema # MU
          # Privileges in user schema for publicuser
          @queries.run_in_transaction(
            @queries.grant_usage_on_user_schema_to_other(CartoDB::PUBLIC_DB_USER),
            true
          )
        end

        def set_user_privileges_in_public_schema(db_user = nil)
          @queries.run_in_transaction(
            @queries.grant_read_on_schema_queries(SCHEMA_PUBLIC, db_user),
            true
          )
        end

        def set_user_privileges_in_importer_schema(db_user = nil) # MU
          @queries.run_in_transaction(
            @queries.grant_all_on_schema_queries(SCHEMA_IMPORTER, db_user),
            true
          )
        end

        def revoke_all_on_database_from(conn, database, role)
          conn.run("REVOKE ALL ON DATABASE \"#{database}\" FROM \"#{role}\" CASCADE") if role_exists?(conn, role)
        end

        def grant_owner_in_database
          @queries.run_in_transaction(
            @queries.grant_all_on_database_queries,
            true
          )
        end

        def fix_table_permissions
          tables_queries = []
          @user.tables.each do |table|
            if table.public? || table.public_with_link_only?
              tables_queries << "GRANT SELECT ON \"#{@user.database_schema}\".\"#{table.name}\" TO #{CartoDB::PUBLIC_DB_USER}"
            end
            tables_queries << "ALTER TABLE \"#{@user.database_schema}\".\"#{table.name}\" OWNER TO \"#{@user.database_username}\""
          end
          @queries.run_in_transaction(
            tables_queries,
            true
          )
        end

        # Needed because in some cases it might not exist and failure ends transaction
        def role_exists?(db, role)
          !db.fetch("SELECT 1 FROM pg_roles WHERE rolname='#{role}'").first.nil?
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
              'username' => @user.database_public_username, 'password' => CartoDB::PUBLIC_DB_USER_PASSWORD,
              'host' => @user.database_host
            ) { |_, o, n| n.nil? ? o : n }
          else
            ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
              'database' => @user.database_name,
              :logger => logger,
              'username' => @user.database_username,
              'password' => @user.database_password,
              'host' => @user.database_host
            ) { |_, o, n| n.nil? ? o : n }
          end
        end

      end
    end
  end
end

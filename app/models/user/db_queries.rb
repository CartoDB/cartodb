
module CartoDB
  # To avoid collisions with User class
  module UserModule
    class DBQueries

      def initialize(user)
        @user = user
      end

      def run_in_transaction(queries, superuser = false)
        conn_params = superuser ? { as: :superuser } : {}
        @user.in_database(conn_params) do |user_database|
          user_database.transaction do
            queries.each do |query|
              begin
                user_database.run(query)
              rescue => e
                CartoDB.notify_debug('Error running user query in transaction',
                                     query: query, user: @user, error: e.inspect)
                raise e
              end
            end
            yield(user_database) if block_given?
          end
        end
      end

      def grant_connect_on_database_queries(db_user = nil)
        granted_user = db_user.nil? ? @user.database_username : db_user
        [
          "GRANT CONNECT ON DATABASE \"#{@user.database_name}\" TO \"#{granted_user}\""
        ]
      end

      def grant_read_on_schema_queries(schema, db_user = nil)
        granted_user = db_user.nil? ? @user.database_username : db_user

        queries = [
          "GRANT USAGE ON SCHEMA \"#{schema}\" TO \"#{granted_user}\"",
          "GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA \"#{schema}\" TO \"#{granted_user}\"",
          "GRANT SELECT ON ALL TABLES IN SCHEMA \"#{schema}\" TO \"#{granted_user}\""
        ]
        if schema == CartoDB::UserModule::DBService::SCHEMA_CARTODB
          queries.concat(revoke_permissions_on_cartodb_conf_queries(granted_user))
        end

        queries
      end

      def grant_write_on_cdb_tablemetadata_queries(db_user = nil)
        granted_user = db_user.nil? ? @user.database_username : db_user
        [
          "GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE cartodb.cdb_tablemetadata TO \"#{granted_user}\""
        ]
      end

      def grant_write_on_cdb_analysis_catalog_queries(db_user = nil)
        granted_user = db_user.nil? ? @user.database_username : db_user
        [
            "GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE cartodb.cdb_analysis_catalog TO \"#{granted_user}\""
        ]
      end

      def revoke_permissions_on_cartodb_conf_queries(db_user)
        [
          "REVOKE ALL ON TABLE cartodb.CDB_CONF FROM \"#{db_user}\""
        ]
      end

      def grant_all_on_database_queries
        [
          "GRANT ALL ON DATABASE \"#{@user.database_name}\" TO \"#{@user.database_username}\""
        ]
      end

      def grant_all_on_user_schema_queries
        [
          "GRANT ALL ON SCHEMA \"#{@user.database_schema}\" TO \"#{@user.database_username}\"",
          "GRANT ALL ON ALL SEQUENCES IN SCHEMA  \"#{@user.database_schema}\" TO \"#{@user.database_username}\"",
          "GRANT ALL ON ALL FUNCTIONS IN SCHEMA  \"#{@user.database_schema}\" TO \"#{@user.database_username}\"",
          "GRANT ALL ON ALL TABLES IN SCHEMA  \"#{@user.database_schema}\" TO \"#{@user.database_username}\""
        ]
      end

      def grant_usage_on_user_schema_to_other(granted_user)
        [
          "GRANT USAGE ON SCHEMA \"#{@user.database_schema}\" TO \"#{granted_user}\""
        ]
      end

      def grant_all_on_schema_queries(schema, db_user = nil)
        granted_user = db_user.nil? ? @user.database_username : db_user
        [
          "GRANT ALL ON SCHEMA \"#{schema}\" TO \"#{granted_user}\""
        ]
      end

    end
  end
end

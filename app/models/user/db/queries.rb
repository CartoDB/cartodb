
module User
  module DB
    class Queries

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

      # TODO: Finish migrating all from User model

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
        if schema == User::DB::Manager::SCHEMA_CARTODB
          queries.concat(revoke_permissions_on_cartodb_conf_queries(granted_user))
        end

        queries
      end

      def revoke_permissions_on_cartodb_conf_queries(db_user)
        # TODO: remove the check after extension install (#4924 merge)
        return [] if Rails.env.test?

        ["REVOKE ALL ON TABLE cartodb.CDB_CONF FROM \"#{db_user}\""]
      end


    end
  end
end

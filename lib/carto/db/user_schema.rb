module Carto
  module Db
    class UserSchema
      def initialize(user)
        @user = user
      end

      def table_names
        (fetch_physical_table_names | fetch_user_table_names | fetch_foreign_table_names)
      end

      private

      def fetch_user_table_names
        @user.tables.map(&:name)
      end

      def fetch_physical_table_names
        sql = %{
            SELECT tablename AS name
            FROM pg_tables
            WHERE schemaname = '#{@user.database_schema}' AND
                  tableowner = '#{@user.database_username}'
          }

        @user.in_database[sql].all.map { |result| result[:name] }
      end

      def fetch_foreign_table_names
        sql = %{
              SELECT c.relname AS name
              FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid
              WHERE n.nspname = '#{@user.database_schema}' AND
                    relkind = 'f';
          }

        @user.in_database[sql].all.map { |result| result[:name] }
      end
    end
  end
end

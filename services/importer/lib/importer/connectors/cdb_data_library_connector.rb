# encoding: utf-8
# This is a custom connector which replaces standard copy imports in the cartodb data library
# with a postgresql foreign data wrapper
#
# It is configured via an 'fdw' key in the app_config.yml, and the parameters provided there
# can be overridden in a POST to the imports or synchronizations API

module CartoDB
  module Importer2
    class CDBDataLibraryConnector < BaseConnector
      # Requirements:
      # postgres_fdw extension must be available in the user database

      def channel_name
        'postgres_fdw'
      end

      def foreign_table_name
        @params['table']
      end

      private

      def accepted_parameters
        %w(name driver channel host port database table username password remote_schema)
      end

      def server_options
        %w(name host port database)
      end

      def server_name
        if (server_params['name'])
          return server_params['name']
        else
          server_string = [server_params['host'],
                           server_params['port'],
                           server_params['database']].join(';')
          server_hash = Digest::SHA1.hexdigest server_string
          return "connector_#{channel_name}_#{server_hash}"
        end
      end

      def run_pre_create
        run_create_extension
        run_create_schema
      end

      def run_create_server
        server_count = execute_as_superuser %{SELECT * from pg_foreign_server WHERE srvname = '#{server_name}'}
        if server_count == 0
          execute_as_superuser create_server_command
        end
      end

      def run_create_extension
        execute_as_superuser %{ CREATE EXTENSION IF NOT EXISTS #{channel_name} }
      end

      def run_create_schema
        execute_as_superuser %{ CREATE SCHEMA IF NOT EXISTS "#{@schema}" }
        execute_as_superuser %{ GRANT CREATE,USAGE ON SCHEMA "#{@schema}" TO postgres }
        #execute_as_superuser %{ GRANT CREATE,USAGE ON SCHEMA "#{@schema}" TO "#{@user.database_username}" }
        execute_as_superuser %{ GRANT USAGE ON SCHEMA "#{@schema}" TO publicuser }
        org_role = @user.in_database(as: :superuser).select{ CDB_Organization_Member_Group_Role_Member_Name{} }.first[:cdb_organization_member_group_role_member_name]
        execute_as_superuser %{ GRANT CREATE,USAGE ON SCHEMA "#{@schema}" to "#{org_role}" }
      end

      def create_server_command
        %{
          CREATE SERVER #{server_name}
            FOREIGN DATA WRAPPER #{@params['channel']}
            OPTIONS (
              host '#{server_params['host']}',
              dbname '#{server_params['database']}',
              port '#{server_params['port']}'
            )
        }
      end

      def run_create_user_mapping
        for usename in [@user.database_username, 'postgres']
          user_mapping_count = execute_as_superuser %{
            SELECT *
            FROM pg_user_mappings
            WHERE srvname = '#{server_name}' AND usename = '#{usename}'
          }
          if user_mapping_count == 0
            execute_as_superuser %{
              CREATE USER MAPPING FOR "#{usename}" SERVER #{server_name}
                OPTIONS ( user '#{@params['username']}', password '#{@params['password']}');
            }
          end
        end
      end

      def run_create_foreign_table
        begin
          # If multiple users in an org account are importing this table, it will exist already in
          # the @schema schema. This is ok. We create a separate proxy view in each user schema
          # that requests access to this table
          execute_as_superuser %{ SELECT '#{@schema}.#{foreign_table_name}'::regclass }
        rescue => e
          execute_as_superuser create_foreign_table_command
        end
        execute_as_superuser %{
          CREATE VIEW "#{@user.database_schema}".#{foreign_table_name}
            AS SELECT * FROM "#{@schema}".#{foreign_table_name};
          ALTER VIEW "#{@user.database_schema}".#{foreign_table_name} OWNER TO "#{@user.database_username}";
        }
        # Ensure view has proper permissions
        execute_as_superuser %{ GRANT SELECT ON "#{@user.database_schema}".#{foreign_table_name} TO "#{@user.database_username}" }
        execute_as_superuser %{ GRANT SELECT ON "#{@user.database_schema}".#{foreign_table_name} TO publicuser }
      end

      def create_foreign_table_command
        %{
          IMPORT FOREIGN SCHEMA "#{@schema}" LIMIT TO (#{foreign_table_name})
            FROM SERVER #{server_name} INTO "#{@schema}";
          ALTER FOREIGN TABLE "#{@schema}".#{foreign_table_name} OWNER TO "#{@user.database_username}";
          GRANT SELECT ON "#{@schema}".#{foreign_table_name} TO publicuser;
        }
      end

      def run_post_create
        # Ensure here that the remote cdb_tablemetadata are imported
        begin
          execute_as_superuser %{select '#{@schema}.cdb_tablemetadata'::regclass}
        rescue => e
          execute_as_superuser %{
            CREATE FOREIGN TABLE "#{@schema}".cdb_tablemetadata (tabname text, updated_at timestamp with time zone)
              SERVER #{server_name}
              OPTIONS (table_name 'cdb_tablemetadata_text', schema_name 'cartodb', updatable 'false');
            GRANT SELECT ON "#{@schema}".cdb_tablemetadata TO publicuser;
          }
        end
      end

      def run_post_create_ensure
        # NOOP
      end
    end
  end
end

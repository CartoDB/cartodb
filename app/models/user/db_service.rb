require_relative 'db_queries'
require_dependency 'carto/db/database'
require_dependency 'carto/db/user_schema_mover'
require 'cartodb/sequel_connection_helper'
require 'carto/configuration'

# To avoid collisions with User model
module CartoDB
  # To avoid collisions with User class
  module UserModule
    class DBService
      include CartoDB::MiniSequel
      include Carto::Configuration
      include ::LoggerHelper
      extend CartoDB::SequelConnectionHelper

      # Also default schema for new users
      SCHEMA_PUBLIC = 'public'.freeze
      SCHEMA_CARTODB = 'cartodb'.freeze
      SCHEMA_IMPORTER = 'cdb_importer'.freeze
      SCHEMA_GEOCODING = 'cdb'.freeze
      SCHEMA_CDB_DATASERVICES_API = 'cdb_dataservices_client'.freeze
      SCHEMA_AGGREGATION_TABLES = 'aggregation'.freeze

      # WARNING: Do not forget about updating dependencies in cartodb-platform and carto-postgres-artifacts
      CDB_DATASERVICES_CLIENT_VERSION = '0.31.0'.freeze

      attr_accessor :user

      def initialize(user)
        raise "User nil" unless user
        @user = user
        @queries = CartoDB::UserModule::DBQueries.new(@user)
        @pgversion = nil
        @plpythonu = nil
      end

      def queries
        @queries
      end

      # This method is used both upon user creation and by the UserMover
      # All methods called inside should allow to be executed multiple times without errors
      def configure_database
        set_pgversion

        set_database_search_path

        grant_user_in_database

        set_statement_timeouts

        # INFO: Added to everyone because eases migration of normal users to org owners
        # and non-org users just don't use it
        set_user_as_organization_member

        if @user.database_schema == SCHEMA_PUBLIC
          setup_single_user_schema
        else
          setup_organization_user_schema
        end

        create_function_invalidate_varnish
        grant_publicuser_in_database
      end

      # All methods called inside should allow to be executed multiple times without errors
      def setup_single_user_schema
        set_user_privileges_at_db
        rebuild_quota_trigger
        create_ghost_tables_event_trigger
      end

      # All methods called inside should allow to be executed multiple times without errors
      def setup_organization_user_schema
        # WIP: CartoDB/cartodb-management#4467
        # Avoid mover reseting permissions. It's been moved to callers. Look for "WIP: CartoDB/cartodb-management#4467"
        # reset_user_schema_permissions
        reset_schema_owner
        set_user_privileges_at_db
        set_user_as_organization_member
        rebuild_quota_trigger

        # INFO: organization privileges are set for org_member_role, which is assigned to each org user
        if @user.organization_owner?
          setup_organization_owner
          create_ghost_tables_event_trigger
        end

        if @user.organization_admin?
          grant_admin_permissions
        end

        # Rebuild the geocoder api user config to reflect that is an organization user
        install_and_configure_geocoder_api_extension
        install_odbc_fdw
      end

      # INFO: main setup for non-org users
      def new_non_organization_user_main_db_setup
        Thread.new do
          create_db_user
          create_user_db
          grant_owner_in_database
        end.join
        create_importer_schema
        create_geocoding_schema
        load_cartodb_functions
        install_and_configure_geocoder_api_extension
        install_odbc_fdw
        # We reset the connections to this database to be sure the change in default search_path is effective
        reset_pooled_connections

        reset_database_permissions # Reset privileges

        # WIP: CartoDB/cartodb-management#4467
        # Added after commenting it in setup_organization_user_schema to avoid configure_database to reset permissions
        reset_user_schema_permissions

        configure_database

        revoke_cdb_conf_access
      end

      # INFO: main setup for org users
      def new_organization_user_main_db_setup
        Thread.new do
          create_db_user
        end.join
        create_own_schema

        # WIP: CartoDB/cartodb-management#4467
        # Added after commenting it in setup_organization_user_schema to avoid configure_database to reset permissions
        reset_user_schema_permissions

        setup_organization_user_schema
        install_and_configure_geocoder_api_extension
        # We reset the connections to this database to be sure the change in default search_path is effective
        reset_pooled_connections
        revoke_cdb_conf_access
      end

      def set_user_privileges_at_db # MU
        # INFO: organization permission on public schema is handled through role assignment
        unless @user.organization_user?
          set_user_privileges_in_cartodb_schema
          set_user_privileges_in_public_schema
        end

        set_user_privileges_in_own_schema
        set_privileges_to_publicuser_in_own_schema

        unless @user.organization_user?
          set_user_privileges_in_importer_schema
          set_user_privileges_in_geocoding_schema
          set_geo_columns_privileges
          set_raster_privileges
        end
      end

      def disable_writes
        # NOTE: This will not affect already opened connections. Run `terminate_database_conections` method after this
        # to ensure no more writes are possible.
        @user.in_database(as: :cluster_admin) do |database|
          database.run(%{
            ALTER DATABASE "#{@user.database_name}"
              SET default_transaction_read_only = 'on'
          })
        end
      end

      def enable_writes
        # NOTE: This will not affect already opened connections. Run `terminate_database_conections` method after this
        # to ensure no more writes are possible.
        @user.in_database(as: :cluster_admin) do |database|
          database.run(%{
            ALTER DATABASE "#{@user.database_name}"
              SET default_transaction_read_only = default
          })
        end
      end

      def writes_enabled?
        @user.in_database(as: :superuser) do |database|
          database.fetch(%{SHOW default_transaction_read_only}).first[:default_transaction_read_only] == 'off'
        end
      end

      # Cartodb functions
      def load_cartodb_functions(statement_timeout = nil, cdb_extension_target_version = nil)
        add_python

        # Install dependencies of cartodb extension
        @user.in_database(as: :superuser, no_cartodb_in_schema: true) do |db|
          db.transaction do
            unless statement_timeout.nil?
              old_timeout = db.fetch("SHOW statement_timeout;").first[:statement_timeout]
              db.run("SET statement_timeout TO '#{statement_timeout}';")
            end

            db.run("CREATE EXTENSION IF NOT EXISTS #{@plpythonu}")
            db.run("CREATE EXTENSION IF NOT EXISTS postgis")

            unless statement_timeout.nil?
              db.run("SET statement_timeout TO '#{old_timeout}';")
            end
          end
        end

        upgrade_cartodb_postgres_extension(statement_timeout, cdb_extension_target_version)

        rebuild_quota_trigger
      end

      def rebuild_quota_trigger
        @user.in_database(as: :superuser) do |db|
          rebuild_quota_trigger_with_database(db)
        end
      end

      def rebuild_quota_trigger_with_database(db)
        if !cartodb_extension_version_pre_mu? && @user.has_organization?
          db.run("DROP FUNCTION IF EXISTS public._CDB_UserQuotaInBytes();")
        end

        db.transaction do
          # NOTE: this has been written to work for both databases that switched to "cartodb" extension
          #       and those before the switch.
          #       In the future we should guarantee that exntension lives in cartodb schema so we don't need to set
          #       a search_path before
          search_path = db.fetch("SHOW search_path;").first[:search_path]
          db.run("SET search_path TO #{SCHEMA_CARTODB}, #{SCHEMA_PUBLIC};")
          if cartodb_extension_version_pre_mu?
            db.run("SELECT CDB_SetUserQuotaInBytes(#{@user.quota_in_bytes});")
          else
            db.run("SELECT CDB_SetUserQuotaInBytes('#{@user.database_schema}', #{@user.quota_in_bytes});")
          end

          # _CDB_UserQuotaInBytes is called by the quota trigger, and need to be open so
          # other users in the organization can run it (when updating shared datasets)
          db_user = @user.organization_user? ? organization_member_group_role_member_name : @user.database_username
          db.run(%{REVOKE ALL ON FUNCTION "#{@user.database_schema}"._CDB_UserQuotaInBytes() FROM PUBLIC;})
          db.run(%{GRANT ALL ON FUNCTION "#{@user.database_schema}"._CDB_UserQuotaInBytes() TO "#{db_user}";})

          db.run("SET search_path TO #{search_path};")
        end
      end

      def build_search_path(user_schema = nil, quote_user_schema = true)
        user_schema ||= @user.database_schema
        DBService.build_search_path(user_schema, quote_user_schema)
      end

      # Centralized method to provide the (ordered) search_path
      def self.build_search_path(user_schema, quote_user_schema = true)
        quote_char = quote_user_schema ? "\"" : ""
        "#{quote_char}#{user_schema}#{quote_char}, #{SCHEMA_CARTODB}, #{SCHEMA_CDB_DATASERVICES_API}, #{SCHEMA_PUBLIC}"
      end

      def set_pgversion
        @user.in_database(as: :superuser) do |database|
          @pgversion = database.fetch("select current_setting('server_version_num') as version").first[:version].to_i
        end
        if @pgversion >= 120000
          @plpythonu = "plpython3u"
        else
          @plpythonu = "plpythonu"
        end
      end

      def set_database_search_path
        @user.in_database(as: :superuser) do |database|
          database.run(%{
            ALTER USER "#{@user.database_username}"
              SET search_path = #{build_search_path}
          })
        end
      end

      def update_analyses_schema
        @user.carto_user.tables.each do |table|
          table.dependent_visualizations.each do |visualization|
            visualization.analyses.each do |analysis|
              analysis.update_table_name(
                "#{SCHEMA_PUBLIC}.#{table.name}",
                "\"#{@user.database_schema}\".#{table.name}"
              )
            end
          end
        end
      rescue StandardError => e
        Rails.logger.error(
          exception: e,
          message: 'Error updating schema of user analyses while moving to own schema',
          user: @user.username
        )
      end

      def create_importer_schema
        create_schema('cdb_importer')
      end

      def create_geocoding_schema
        create_schema('cdb')
      end

      def create_user_schema
        create_schema(@user.database_schema, @user.database_username)
      end

      def create_schema(schema, role = nil)
        @user.in_database(as: :superuser) do |db|
          Carto::Db::Database.new(@user.database_name, db).create_schema(schema, role)
        end
      end

      def grant_admin_permissions
        @user.in_database(as: :superuser) do |database|
          database.run(%{ SELECT cartodb.CDB_Organization_AddAdmin('#{@user.username}') })
        end
      end

      def revoke_admin_permissions
        @user.in_database(as: :superuser) do |database|
          database.run(%{ SELECT cartodb.CDB_Organization_RemoveAdmin('#{@user.username}') })
        end
      end

      def revoke_cdb_conf_access
        errors = []

        roles = [@user.database_username]
        if @user.organization_owner?
          begin
            roles << organization_member_group_role_member_name
          rescue StandardError => e
            errors << "WARN: Error fetching org member role (does #{@user.organization.name} has that role?)"
          end
        end
        roles << CartoDB::PUBLIC_DB_USER

        queries = []
        roles.map do |db_role|
          queries.concat(@queries.revoke_permissions_on_cartodb_conf_queries(db_role))
        end

        queries.map do |query|
          @user.in_database(as: :superuser) do |database|
            begin
              database.run(query)
            rescue StandardError => e
              # We can find organizations not yet upgraded for any reason or missing roles
              errors << e.message
            end
          end
        end

        errors
      rescue StandardError => e
        # For broken organizations
        ["FATAL ERROR for #{name}: #{e.message}"]
      end

      def create_public_db_user
        @user.in_database(as: :superuser) do |database|
          database.run(%{ CREATE USER "#{@user.database_public_username}" LOGIN INHERIT })
          database.run(%{ GRANT publicuser TO "#{@user.database_public_username}" })
          database.run(%{ ALTER USER "#{@user.database_public_username}" SET search_path = #{build_search_path} })
        end
      end

      def tables_effective(schema = 'public')
        @user.in_database do |user_database|
          user_database.synchronize do |conn|
            query = "select table_name::text from information_schema.tables where table_schema = '#{schema}'"
            tables = user_database[query].all.map { |i| i[:table_name] }
            return tables
          end
        end
      end

      def all_user_roles
        roles = [@user.database_username]
        if @user.organization_user?
          roles << organization_member_group_role_member_name
          roles += @user.groups.map(&:database_role)
        end

        roles
      end

      def all_tables_granted(role = nil)
        roles_str = role ? "'#{role}'" : all_user_roles.map { |r| "'#{r}'" }.join(',')
        query = %{
          SELECT
            s.nspname as schema,
            c.relname as t,
            string_agg(lower(acl.privilege_type), ',') as permission
          FROM
            pg_class c
            JOIN pg_namespace s ON c.relnamespace = s.oid
            JOIN LATERAL aclexplode(COALESCE(c.relacl, acldefault('r'::"char", c.relowner))) acl ON TRUE
            JOIN pg_roles r ON acl.grantee = r.oid
          WHERE
            r.rolname IN (#{roles_str}) AND
            s.nspname NOT IN ('cartodb', 'cdb', 'cdb_importer')
          GROUP BY schema, t;
        }

        @user.in_database(as: :superuser) do |database|
          database.fetch(query)
        end
      end

      def all_tables_granted_hashed(role = nil)
        results = all_tables_granted(role)
        privileges_hashed = {}

        if !results.nil?
          results.each do |row|
            privileges_hashed[row[:schema]] = {} if privileges_hashed[row[:schema]].nil?
            privileges_hashed[row[:schema]][row[:t]] = row[:permission].split(',')
          end
        end

        privileges_hashed
      end

      def all_schemas_granted(role)
        roles_str = role ? role : all_user_roles.join(',')
        permissions = 'create,usage'
        query = %{
          WITH
          roles AS (
            SELECT unnest('{#{roles_str}}'::text[]) AS rname
          ),
          permissions AS (
            SELECT 'SCHEMA' AS ptype, unnest('{#{permissions}}'::text[]) AS pname
          ),
          schemas AS (
            SELECT schema_name AS sname
            FROM information_schema.schemata
            WHERE schema_name !~ '^pg_'
              AND schema_name NOT IN ('cartodb', 'cdb', 'cdb_importer')
          ),
          schemas_roles_permissions AS (
          SELECT
              permissions.ptype,
              schemas.sname AS obj_name,
              roles.rname,
              permissions.pname,
              has_schema_privilege(roles.rname, schemas.sname, permissions.pname) AS has_permission
          FROM
            schemas
            CROSS JOIN roles
            CROSS JOIN permissions
          WHERE
            permissions.ptype = 'SCHEMA'
          ),
          schemas_and_grants AS (
            SELECT obj_name AS object_name,
            COALESCE(string_agg(DISTINCT CASE WHEN has_permission THEN pname END, ','), '') AS granted_permissions
            FROM schemas_roles_permissions
            GROUP BY 1
            ORDER BY 1
          )
          SELECT
            object_name, granted_permissions
          FROM
            schemas_and_grants
          WHERE
            granted_permissions is not null and granted_permissions <> '';
        }

        @user.in_database(as: :superuser) do |database|
          database.fetch(query)
        end
      end

      def all_schemas_granted_hashed(role = nil)
        results = all_schemas_granted(role)
        return {} if results.nil?

        results.map { |row| [row[:object_name], row[:granted_permissions].split(',')] }.to_h
      end

      def exists_role?(rolname)
        query = %{
          SELECT 1
          FROM   pg_catalog.pg_roles
          WHERE  rolname = '#{rolname}'
        }

        result = @user.in_database(as: :superuser).fetch(query)
        result.count > 0
      end

      def drop_owned_by_user(conn, role)
        conn.run("DROP OWNED BY \"#{role}\"")
      end

      def drop_user(conn = nil, username = nil)
        conn ||= @user.in_database(as: :cluster_admin)
        username ||= @user.database_username
        database_with_conflicts = nil
        retried = false

        begin
          conn.run("DROP USER IF EXISTS \"#{username}\"")
        rescue StandardError => e
          if !retried && e.message =~ /cannot be dropped because some objects depend on it/
            retried = true
            e.message =~ /object[s]? in database (.*)$/
            e.message =~ /privileges for database (.*)$/ unless $1
            if database_with_conflicts == $1
              raise e
            else
              database_with_conflicts = $1
              revoke_all_on_database_from(conn, database_with_conflicts, username)
              revoke_all_memberships_on_database_to_role(conn, username)
              drop_owned_by_user(conn, username)

              conflict_database_conn = @user.in_database(
                as: :cluster_admin,
                'database' => database_with_conflicts
              )
              drop_owned_by_user(conflict_database_conn, username)
              ['cdb', 'cdb_importer', 'cartodb', 'public', @user.database_schema].each do |s|
                drop_users_privileges_in_schema(s, [username], conn: conflict_database_conn)
              end
              DBService.close_sequel_connection(conflict_database_conn)
              retry
            end
          else
            raise e
          end
        end
      end

      # Org users share the same db, so must only delete the schema unless he's the owner
      def drop_organization_user(org_id, is_owner: false, force_destroy: false)
        raise CartoDB::BaseCartoDBError.new('Tried to delete an organization user without org id') if org_id.nil?
        Thread.new do
          @user.in_database(as: :superuser) do |database|
            if is_owner
              schemas = ['cdb', 'cdb_importer', 'cartodb', 'public', @user.database_schema] +
                        ::User.select(:database_schema).where(organization_id: org_id).all.collect(&:database_schema)
              schemas.uniq.each do |s|
                drop_users_privileges_in_schema(
                  s,
                  [@user.database_username, @user.database_public_username, CartoDB::PUBLIC_DB_USER])
              end

              # To avoid "cannot drop function" errors
              database.run("drop extension if exists plproxy cascade")
            end

            # If user is in an organization should never have public schema, but to be safe (& tests which stub stuff)
            unless @user.database_schema == SCHEMA_PUBLIC
              database.run(%{ DROP FUNCTION IF EXISTS "#{@user.database_schema}"._CDB_UserQuotaInBytes()})
              drop_analysis_cache(@user)
              drop_all_functions_from_schema(@user.database_schema)

              cascade_drop = force_destroy ? 'CASCADE' : ''
              database.run(%{ DROP SCHEMA IF EXISTS "#{@user.database_schema}" #{cascade_drop}})
            end
          end

          conn = @user.in_database(as: :cluster_admin)
          CartoDB::UserModule::DBService.terminate_database_connections(@user.database_name, @user.database_host)

          # If user is in an organization should never have public schema, but to be safe (& tests which stub stuff)
          unless @user.database_schema == SCHEMA_PUBLIC
            drop_user(conn, @user.database_public_username)
          end

          if is_owner
            conn.run("DROP DATABASE \"#{@user.database_name}\"")
          end
          drop_user(conn)
        end.join

        monitor_user_notification
      end

      def configure_extension_org_metadata_api_endpoint
        config = Cartodb.config[:org_metadata_api]
        host = config['host']
        port = config['port']
        username = config['username']
        password = config['password']
        timeout = config.fetch('timeout', 10)

        if host.present? && port.present? && username.present? && password.present?
          conf_sql = %{
            SELECT cartodb.CDB_Conf_SetConf('groups_api',
              '{ \"host\": \"#{host}\", \"port\": #{port}, \"timeout\": #{timeout}, \"username\": \"#{username}\",
                 \"password\": \"#{password}\"}'::json
            )
          }
          @user.in_database(as: :superuser) do |database|
            database.fetch(conf_sql).first
          end
        else
          CartoDB.notify_debug("org_metadata_api configuration missing", user_id: @user.id, config: config)
        end
      end

      def install_and_configure_geocoder_api_extension
          geocoder_api_config = Cartodb.get_config(:geocoder, 'api')
          # If there's no config we assume there's no need to install the
          # geocoder client as it is an independent API
          return if geocoder_api_config.blank?
          install_geocoder_api_extension
          @user.in_database(as: :superuser) do |db|
            db.transaction do
              db.run(build_geocoder_server_config_sql(geocoder_api_config))
              db.run(build_entity_config_sql)
              db.run("ALTER USER \"#{@user.database_username}\" SET search_path TO #{build_search_path}")
              db.run("ALTER USER \"#{@user.database_public_username}\" SET search_path TO #{build_search_path}")
            end
          end
          return true
        rescue StandardError => e
          CartoDB.notify_error(
            'Error installing and configuring geocoder api extension',
            error: e.inspect, user: @user
          )
          return false
      end

      def install_geocoder_api_extension
        @user.in_database(as: :superuser) do |db|
          db.transaction do
            db.run("CREATE EXTENSION IF NOT EXISTS cdb_dataservices_client VERSION '#{CDB_DATASERVICES_CLIENT_VERSION}' CASCADE")
            db.run("ALTER EXTENSION cdb_dataservices_client UPDATE TO '#{CDB_DATASERVICES_CLIENT_VERSION}'")
          end
        end
      end

      def install_odbc_fdw
        @user.in_database(as: :superuser) do |db|
          db.run('CREATE EXTENSION IF NOT EXISTS odbc_fdw SCHEMA public')
        end
      rescue Sequel::DatabaseError => error
        # For the time being we'll be resilient to the odbc_fdw not being available
        # and just proceed without installing it.
        log_error(message: "Could not install odbc_fdw", exception: error, error_detail: error.cause.inspect)
      end

      def setup_organization_owner
        setup_organization_role_permissions
        configure_extension_org_metadata_api_endpoint
      end

      # Use a direct connection to the db through the direct port specified
      # in the database configuration and set up its statement timeout value. This
      # allows to overpass the statement_timeout limit if a connection pooler is used.
      # This method is supposed to receive a block that will be run with the created
      # connection.
      def in_database_direct_connection(statement_timeout:)
        raise 'need block' unless block_given?

        configuration = db_configuration_for
        configuration[:port] = configuration.fetch(:direct_port, configuration["direct_port"]) || configuration[:port] || configuration["port"]

        connection = @user.get_connection(_opts = {}, configuration)

        begin
          connection.run("SET statement_timeout TO #{statement_timeout}")
          yield(connection)
        ensure
          connection.run("SET statement_timeout TO DEFAULT")
        end
      end

      def reset_pooled_connections
        # Only close connections to this users' database
        $pool.close_connections!(@user.database_name)
      end

      # Upgrade the cartodb postgresql extension
      def upgrade_cartodb_postgres_extension(statement_timeout = nil, cdb_extension_target_version = nil)
        if cdb_extension_target_version.nil?
          # WARNING: Do not forget about updating dependencies in cartodb-platform and carto-postgres-artifacts
          cdb_extension_target_version = '0.37.1'
        end

        @user.in_database(as: :superuser, no_cartodb_in_schema: true) do |db|
          db.transaction do
            unless statement_timeout.nil?
              old_timeout = db.fetch("SHOW statement_timeout;").first[:statement_timeout]
              db.run("SET statement_timeout TO '#{statement_timeout}';")
            end

            db.run(%{
              DO LANGUAGE 'plpgsql' $$
              DECLARE
                ver TEXT;
              BEGIN
                BEGIN
                  SELECT cartodb.cdb_version() INTO ver;
                EXCEPTION WHEN undefined_function OR invalid_schema_name THEN
                  RAISE NOTICE 'Got % (%)', SQLERRM, SQLSTATE;
                  BEGIN
                    CREATE EXTENSION cartodb VERSION '#{cdb_extension_target_version}' CASCADE;
                  EXCEPTION WHEN undefined_table THEN
                    RAISE NOTICE 'Got % (%)', SQLERRM, SQLSTATE;
                    CREATE EXTENSION cartodb CASCADE VERSION '#{cdb_extension_target_version}';
                    RETURN;
                  END;
                  RETURN;
                END;
                ver := '#{cdb_extension_target_version}';
                EXECUTE 'ALTER EXTENSION cartodb UPDATE TO ''' || ver || 'next''';
                EXECUTE 'ALTER EXTENSION cartodb UPDATE TO ''' || ver || '''';
              END;
              $$;
            })

            unless statement_timeout.nil?
              db.run("SET statement_timeout TO '#{old_timeout}';")
            end

            obtained = db.fetch('SELECT cartodb.cdb_version() as v').first[:v]

            unless cartodb_extension_semver(cdb_extension_target_version) == cartodb_extension_semver(obtained)
              raise("Expected cartodb extension '#{cdb_extension_target_version}' obtained '#{obtained}'")
            end
          end
        end
      end

      def cartodb_extension_version_pre_mu?
        current_version = cartodb_extension_semver(cartodb_extension_version)
        if current_version.size == 3
          major, minor, = current_version
          major == 0 && minor < 3
        else
          raise 'Current cartodb extension version does not match standard x.y.z format'
        end
      end

      # Returns a tree elements array with [major, minor, patch] as in http://semver.org/
      def cartodb_extension_semver(extension_version)
        extension_version.split('.').take(3).map(&:to_i)
      end

      def cartodb_extension_version
        @cartodb_extension_version ||= @user.in_database(as: :superuser)
                                            .fetch('SELECT cartodb.cdb_version() AS v').first[:v]
      end

      def reset_user_schema_permissions
        @user.in_database(as: :superuser) do |user_database|
          user_database.transaction do
            schemas = [@user.database_schema].uniq
            schemas.each do |schema|
              revoke_privileges(user_database, schema, 'PUBLIC')
            end
            yield(user_database) if block_given?
          end
        end
      end

      def reset_database_permissions
        @user.in_database(as: :superuser) do |user_database|
          user_database.transaction do
            schemas = %w(public cdb_importer cdb cartodb)
            ['PUBLIC', CartoDB::PUBLIC_DB_USER].each do |user|
              revoke_all_on_database_from(user_database, @user.database_name, user)
              schemas.each do |schema|
                revoke_privileges(user_database, schema, user)
              end
            end
            yield(user_database) if block_given?
          end
        end
      end

      def set_statement_timeouts
        @user.in_database(as: :superuser) do |user_database|
          user_database["ALTER ROLE \"?\" SET statement_timeout to ?", Sequel.lit(@user.database_username),
                        @user.user_timeout].all
          user_database["ALTER DATABASE \"?\" SET statement_timeout to ?", Sequel.lit(@user.database_name),
                        @user.database_timeout].all
        end
        @user.in_database.disconnect
        @user.in_database.connect(db_configuration_for)
        @user.in_database(as: :public_user).disconnect
        @user.in_database(as: :public_user).connect(db_configuration_for(:public_user))
      rescue Sequel::DatabaseConnectionError
      end

      def set_user_as_organization_member
        @user.in_database(as: :superuser) do |user_database|
          user_database.transaction do
            user_database.run("SELECT cartodb.CDB_Organization_Create_Member('#{@user.database_username}');")
          end
        end
      end

      def reset_schema_owner
        @user.in_database(as: :superuser) do |database|
          database.run(%{ ALTER SCHEMA "#{@user.database_schema}" OWNER TO "#{@user.database_username}" })
        end
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
            "REVOKE SELECT ON cartodb.cdb_tablemetadata FROM #{CartoDB::PUBLIC_DB_USER} CASCADE",
            "REVOKE SELECT ON cartodb.cdb_analysis_catalog FROM #{CartoDB::PUBLIC_DB_USER} CASCADE"
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
            @queries.grant_write_on_cdb_tablemetadata_queries(db_user) +
            @queries.grant_write_on_cdb_analysis_catalog_queries(db_user)
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
          Carto::TableAndFriends.apply(@user.in_database, @user.database_schema, table.name) do |schema, table_name|
            if table.public? || table.public_with_link_only?
              tables_queries << %{
                GRANT SELECT ON \"#{schema}\".\"#{table_name}\" TO #{CartoDB::PUBLIC_DB_USER} }
            end
            tables_queries << %{
              ALTER TABLE \"#{schema}\".\"#{table_name}\" OWNER TO \"#{@user.database_username}\" }
          end
        end
        @queries.run_in_transaction(
          tables_queries,
          true
        )
      end

      def set_user_privileges_in_geocoding_schema(db_user = nil)
        @queries.run_in_transaction(
          @queries.grant_all_on_schema_queries(SCHEMA_GEOCODING, db_user),
          true
        )
      end

      def set_geo_columns_privileges(role_name = nil)
        # Postgis lives at public schema, as do geometry_columns and geography_columns
        catalogs_schema = SCHEMA_PUBLIC
        target_user = role_name.nil? ? @user.database_public_username : role_name
        queries = [
          %{ GRANT SELECT ON "#{catalogs_schema}"."geometry_columns" TO "#{target_user}" },
          %{ GRANT SELECT ON "#{catalogs_schema}"."geography_columns" TO "#{target_user}" }
        ]
        @queries.run_in_transaction(queries, true)
      end

      # PG12_DEPRECATED in postgis 3+
      def set_raster_privileges(role_name = nil)
        database = @user.in_database(as: :superuser)
        return unless database.table_exists?('raster_overviews')
        # Postgis lives at public schema, so raster catalogs too
        catalogs_schema = SCHEMA_PUBLIC
        queries = [
          "GRANT SELECT ON TABLE \"#{catalogs_schema}\".\"raster_overviews\" TO \"#{CartoDB::PUBLIC_DB_USER}\"",
          "GRANT SELECT ON TABLE \"#{catalogs_schema}\".\"raster_columns\" TO \"#{CartoDB::PUBLIC_DB_USER}\""
        ]
        target_user = role_name || @user.database_public_username
        unless @user.organization.nil?
          queries << "GRANT SELECT ON TABLE \"#{catalogs_schema}\".\"raster_overviews\" TO \"#{target_user}\""
          queries << "GRANT SELECT ON TABLE \"#{catalogs_schema}\".\"raster_columns\" TO \"#{target_user}\""
        end
        @queries.run_in_transaction(queries, true)
      end

      def setup_organization_role_permissions
        org_member_role = organization_member_group_role_member_name
        set_user_privileges_in_public_schema(org_member_role)
        @queries.run_in_transaction(
          @queries.grant_connect_on_database_queries(org_member_role), true
        )
        set_geo_columns_privileges(org_member_role)
        set_raster_privileges(org_member_role)
        set_user_privileges_in_cartodb_schema(org_member_role)
        set_user_privileges_in_importer_schema(org_member_role)
        set_user_privileges_in_geocoding_schema(org_member_role)
      end

      def schema_exists?(schema, database = @user.in_database)
        query = "SELECT 1 as schema_exist FROM information_schema.schemata WHERE schema_name = '#{schema}'"
        !database.fetch(query).first.nil?
      end

      def drop_users_privileges_in_schema(schema, accounts, conn: nil)
        user_database = conn || @user.in_database(as: :superuser, statement_timeout: 600000)
        return unless schema_exists?(schema, user_database)

        user_database.transaction do
          accounts
            .select { |role| role_exists?(user_database, role) }
            .each { |role| revoke_privileges(user_database, schema, "\"#{role}\"") }
        end
      end

      def revoke_all_memberships_on_database_to_role(conn, role)
        conn.fetch(%{
            select rolname from pg_user join pg_auth_members on (pg_user.usesysid=pg_auth_members.member)
            join pg_roles on (pg_roles.oid=pg_auth_members.roleid) where pg_user.usename='#{role}'
          }).each do |rolname|
          conn.run("REVOKE \"#{rolname[:rolname]}\" FROM \"#{role}\" CASCADE")
        end
      end

      def drop_analysis_cache(user)
        # Filtering this query by tableowner should be enough but for security reasons I've added an additional
        # filter by schema. Also we have add a regexp to matches the current analysis tables name format to avoid
        # deleting user tables in the process (https://github.com/CartoDB/camshaft/blob/0.59.4/lib/node/node.js#L344-L348)
        cache_tables_sql = "SELECT tablename FROM pg_tables WHERE schemaname = '#{user.database_schema}' and tableowner = '#{user.database_username}' and tablename ~* '^analysis_[0-9a-z]{10}_[0-9a-z]{40}$';"
        delete_analysis_metadata_sql = "DELETE FROM cdb_analysis_catalog WHERE username = '#{user.username}'"
        user.in_database(as: :superuser) do |database|
          database.transaction do
            database.fetch(cache_tables_sql).map(:tablename).each do |cache_table_name|
              database.run(%{DROP TABLE "#{user.database_schema}"."#{cache_table_name}"})
            end
            database.run(delete_analysis_metadata_sql)
          end
        end
      end

      # Drops grants and functions in a given schema, avoiding by all means a CASCADE
      # to not affect extensions or other users
      def drop_all_functions_from_schema(schema_name)
        recursivity_max_depth = 3

        return if schema_name == SCHEMA_PUBLIC

        @user.in_database(as: :superuser) do |database|
          # Non-aggregate functions
          drop_function_sqls = database.fetch(get_drop_functions_sql(database, schema_name))
          # Simulate a controlled environment drop cascade contained to only functions
          failed_sqls = []
          recursivity_level = 0
          begin
            failed_sqls = []
            drop_function_sqls.each do |sql_sentence|
              begin
                database.run(sql_sentence[:sql])
              rescue Sequel::DatabaseError => e
                if e.message =~ /depends on function /i
                  failed_sqls.push(sql_sentence)
                else
                  raise
                end
              end
            end
            drop_function_sqls = failed_sqls
            recursivity_level += 1
          end while failed_sqls.count > 0 && recursivity_level < recursivity_max_depth

          # If something remains, reattempt later after dropping aggregates
          if drop_function_sqls.count > 0
            aggregate_dependant_function_sqls = drop_function_sqls
          else
            aggregate_dependant_function_sqls = []
          end

          # And now aggregate functions
          failed_sqls = []
          drop_function_sqls = database.fetch(get_drop_functions_sql(database, schema_name, aggregated: true))
          drop_function_sqls.each do |sql_sentence|
            begin
              database.run(sql_sentence[:sql])
            rescue Sequel::DatabaseError
              failed_sqls.push(sql_sentence)
            end
          end

          if failed_sqls.count > 0
            raise CartoDB::BaseCartoDBError.new('Cannot drop schema aggregate functions, dependencies remain')
          end

          # One final pass of normal functions, if left
          if aggregate_dependant_function_sqls.count > 0
            aggregate_dependant_function_sqls.each do |sql_sentence|
              begin
                database.run(sql_sentence[:sql])
              rescue Sequel::DatabaseError
                failed_sqls.push(sql_sentence)
              end
            end
          end

          if failed_sqls.count > 0
            raise CartoDB::BaseCartoDBError.new('Cannot drop schema functions, dependencies remain')
          end
        end
      end

      def get_drop_functions_sql(database, schema_name, aggregated: false)
        set_pgversion

        if @pgversion >= 110000
          agg_join_clause = "pg_proc.prokind #{aggregated ? ' = ' : ' <> '} 'a'"
        else
          agg_join_clause = "pg_proc.proisagg = #{aggregated ? 'TRUE' : 'FALSE'}"
        end

        drop_type = aggregated ? 'AGGREGATE' : 'FUNCTION'

        %{SELECT 'DROP #{drop_type} "' || ns.nspname || '".' || proname || '(' || oidvectortypes(proargtypes) || ');'
         AS sql
         FROM pg_proc INNER JOIN pg_namespace ns ON (pg_proc.pronamespace = ns.oid AND #{agg_join_clause} )
         WHERE ns.nspname = '#{schema_name}'}
      end

      # Create a "public.cdb_invalidate_varnish()" function to invalidate Varnish
      #
      # The function can only be used by the superuser, we expect
      # security-definer triggers OR triggers on superuser-owned tables
      # to call it with controlled set of parameters.
      #
      # The function is written in python because it needs to reach out
      # to a Varnish server.
      #
      # Being unable to communicate with Varnish may or may not be critical
      # depending on CartoDB configuration at time of function definition.
      #
      def create_function_invalidate_varnish
        if Cartodb.get_config(:invalidation_service, 'enabled')
          create_function_invalidate_varnish_invalidation_service
        elsif Cartodb.get_config(:varnish_management, 'http_port')
          create_function_invalidate_varnish_http
        else
          create_function_invalidate_varnish_telnet
        end
      end

      # Add plpythonu pl handler
      def add_python
        set_pgversion

        @user.in_database(
          as: :superuser,
          no_cartodb_in_schema: true
        ).run("CREATE EXTENSION IF NOT EXISTS #{@plpythonu};")
      end

      # Needed because in some cases it might not exist and failure ends transaction
      def role_exists?(db, role)
        !db.fetch("SELECT 1 FROM pg_roles WHERE rolname='#{role}'").first.nil?
      end

      def revoke_privileges(db, schema, user)
        db.run("REVOKE ALL ON SCHEMA \"#{schema}\" FROM #{user} CASCADE")
        db.run("REVOKE ALL ON ALL SEQUENCES IN SCHEMA \"#{schema}\" FROM #{user} CASCADE")
        db.run("REVOKE ALL ON ALL FUNCTIONS IN SCHEMA \"#{schema}\" FROM #{user} CASCADE")
        db.run("REVOKE ALL ON ALL TABLES IN SCHEMA \"#{schema}\" FROM #{user} CASCADE")
      end

      def organization_member_group_role_member_name
        @user.in_database.fetch(
          "SELECT cartodb.CDB_Organization_Member_Group_Role_Member_Name() as org_member_role;"
        )[:org_member_role][:org_member_role]
      end

      def db_configuration_for(user_role = nil)
        logger = (Rails.env.development? || Rails.env.test? ? ::Rails.logger : nil)
        if user_role == :superuser
          ::SequelRails.configuration.environment_for(Rails.env).merge(
            'database' => @user.database_name,
            :logger => logger,
            'host' => @user.database_host
          ) { |_, o, n| n.nil? ? o : n }
        elsif user_role == :cluster_admin
          ::SequelRails.configuration.environment_for(Rails.env).merge(
            'database' => 'postgres',
            :logger => logger,
            'host' => @user.database_host
          ) { |_, o, n| n.nil? ? o : n }
        elsif user_role == :public_user
          ::SequelRails.configuration.environment_for(Rails.env).merge(
            'database' => @user.database_name,
            :logger => logger,
            'username' => CartoDB::PUBLIC_DB_USER, 'password' => CartoDB::PUBLIC_DB_USER_PASSWORD,
            'host' => @user.database_host
          ) { |_, o, n| n.nil? ? o : n }
        elsif user_role == :public_db_user
          ::SequelRails.configuration.environment_for(Rails.env).merge(
            'database' => @user.database_name,
            :logger => logger,
            'username' => @user.database_public_username, 'password' => CartoDB::PUBLIC_DB_USER_PASSWORD,
            'host' => @user.database_host
          ) { |_, o, n| n.nil? ? o : n }
        else
          ::SequelRails.configuration.environment_for(Rails.env).merge(
            'database' => @user.database_name,
            :logger => logger,
            'username' => @user.database_username,
            'password' => @user.database_password,
            'host' => @user.database_host
          ) { |_, o, n| n.nil? ? o : n }
        end
      end

      def monitor_user_notification
        FileUtils.touch(log_file_path('users_modifications'))
        enable_remote_db_user if Cartodb.get_config(:signups, 'service', 'port')
      end

      def enable_remote_db_user
        request = http_client.request(
          "#{@user.database_host}:#{Cartodb.get_config(:signups, 'service', 'port')}/scripts/activate_db_user",
          method: :post,
          headers: { "Content-Type" => "application/json" }
        )
        response = request.run
        if response.code != 200
          raise(response.body)
        else
          comm_response = JSON.parse(response.body)
          if comm_response['retcode'].to_i != 0
            raise(response['stderr'])
          end
        end
      end

      def create_own_schema
        load_cartodb_functions
        @user.database_schema = @user.username
        @user.this.update(database_schema: @user.database_schema)
        create_user_schema
        set_database_search_path
        create_public_db_user
      end

      def move_to_own_schema
        new_schema_name = @user.username
        old_database_schema_name = @user.database_schema
        if @user.database_schema != new_schema_name
          Carto::Db::UserSchemaMover.new(@user).move_objects(new_schema_name)

          create_public_db_user
          set_database_search_path
        end
      rescue StandardError => e
        # Undo metadata changes if process fails
        begin
          @user.this.update database_schema: old_database_schema_name

          # Defensive measure to avoid undesired table dropping
          if schema_exists?(new_schema_name) && tables_effective(new_schema_name).count == 0
            drop_all_functions_from_schema(new_schema_name)
            @user.in_database.run(%{ DROP SCHEMA "#{new_schema_name}" })
          end
        rescue StandardError => ee
          # Avoid shadowing the actual error
          CartoDB.notify_exception(ee, user: @user)
        end
        raise e
      end

      def drop_database_and_user(conn = nil)
        conn ||= @user.in_database(as: :cluster_admin)

        if !@user.database_name.nil? && !@user.database_name.empty?
          @user.in_database(as: :superuser).run("DROP SCHEMA \"#{@user.database_schema}\" CASCADE")
          conn.run("UPDATE pg_database SET datallowconn = 'false' WHERE datname = '#{@user.database_name}'")
          CartoDB::UserModule::DBService.terminate_database_connections(@user.database_name, @user.database_host)
          conn.run("DROP DATABASE \"#{@user.database_name}\"")
        end

        if !@user.database_username.nil? && !@user.database_username.empty?
          conn.run("DROP USER \"#{@user.database_username}\"")
        end
      end

      def run_pg_query(query)
        time = nil
        res  = nil
        translation_proc = nil
        @user.in_database do |user_database|
          time = Benchmark.measure do
            user_database.synchronize do |conn|
              res = conn.exec query
            end
            translation_proc = user_database.conversion_procs
          end
        end
        {
          time: time.real,
          total_rows: res.ntuples,
          rows: pg_to_hash(res, translation_proc),
          results: pg_results?(res),
          modified: pg_modified?(res),
          affected_rows: pg_size(res)
        }
      rescue StandardError => e
        if e.is_a? PGError
          if e.message.include?("does not exist")
            if e.message.include?("column")
              raise CartoDB::ColumnNotExists, e.message
            else
              raise CartoDB::TableNotExists, e.message
            end
          else
            raise CartoDB::ErrorRunningQuery, e.message
          end
        else
          raise e
        end
      end

      def create_db_user
        conn = @user.in_database(as: :cluster_admin)
        begin
          conn.transaction do
            begin
              conn.run("CREATE USER \"#{@user.database_username}\" PASSWORD '#{@user.database_password}'")
              conn.run("GRANT publicuser to \"#{@user.database_username}\"")
            rescue StandardError => e
              puts "#{Time.now} USER SETUP ERROR (#{@user.database_username}): #{$!}"
              raise e
            end
          end
        end
      end

      def create_user_db
        conn = @user.in_database(as: :cluster_admin)
        begin
          conn.run("CREATE DATABASE \"#{@user.database_name}\"
          WITH TEMPLATE = template_postgis
          OWNER = #{::SequelRails.configuration.environment_for(Rails.env)['username']}
          ENCODING = 'UTF8'
          CONNECTION LIMIT=-1")
        rescue StandardError => e
          puts "#{Time.now} USER SETUP ERROR WHEN CREATING DATABASE #{@user.database_name}: #{$!}"
          raise e
        end
      end

      def set_database_name
        @user.database_name = case Rails.env
                              when 'development'
                                "cartodb_dev_user_#{@user.partial_db_name}_db"
                              when 'staging'
                                "cartodb_staging_user_#{@user.partial_db_name}_db"
                              when 'test'
                                "cartodb_test_user_#{@user.partial_db_name}_db"
                              else
                                "cartodb_user_#{@user.partial_db_name}_db"
                              end
        if @user.has_organization_enabled?
          if !@user.database_exists?
            raise "Organization database #{@user.database_name} doesn't exist"
          end
        else
          if @user.database_exists?
            raise "Database #{@user.database_name} already exists"
          end
        end
        @user.this.update database_name: @user.database_name
      end

      def public_user_roles
        @user.organization_user? ? [CartoDB::PUBLIC_DB_USER, @user.database_public_username] : [CartoDB::PUBLIC_DB_USER]
      end

      def terminate_database_connections
        CartoDB::UserModule::DBService.terminate_database_connections(@user.database_name, @user.database_host)
      end

      def self.terminate_database_connections(database_name, database_host)
        connection_params = ::SequelRails.configuration.environment_for(Rails.env).merge(
          'host' => database_host,
          'database' => 'postgres'
        ) { |_, o, n| n.nil? ? o : n }
        conn = ::Sequel.connect(connection_params)
        conn.run("
          DO language plpgsql $$
          DECLARE
              ver INT;
              sql TEXT;
          BEGIN
              SELECT INTO ver setting from pg_settings where name='server_version_num';
              sql := 'SELECT pg_terminate_backend(';
              IF ver > 90199 THEN
                sql := sql || 'pid';
              ELSE
                sql := sql || 'procpid';
              END IF;

              sql := sql || ') FROM pg_stat_activity WHERE datname = '
                || quote_literal('#{database_name}');

              RAISE NOTICE '%', sql;

              EXECUTE sql;
          END
          $$
        ")
        close_sequel_connection(conn)
      end

      def triggers(schema = @user.database_schema)
        Carto::Db::Database.build_with_user(@user).triggers(schema)
      end

      def functions(schema = @user.database_schema)
        Carto::Db::Database.build_with_user(@user).functions(schema, @user.database_username)
      end

      def views(schema = @user.database_schema)
        Carto::Db::Database.build_with_user(@user).views(schema, @user.database_username)
      end

      def materialized_views(schema = @user.database_schema)
        Carto::Db::Database.build_with_user(@user).materialized_views(schema, @user.database_username)
      end

      def get_database_version
        version_match = @user.in_database.fetch("SELECT version()").first[:version].match(/(PostgreSQL (([0-9]+\.?){2,3})).*/)
        if version_match.nil?
          return nil
        else
          return version_match[2]
        end
      end

      def connect_to_aggregation_tables
        config = Cartodb.get_config(:aggregation_tables)
        @user.in_database(as: :superuser) do |db|
          db.transaction do
            db.run(build_aggregation_fdw_config_sql(config))
            db.run("SELECT cartodb._CDB_Setup_FDW('aggregation');")
            db.run("CREATE FOREIGN TABLE IF NOT EXISTS #{SCHEMA_AGGREGATION_TABLES}.agg_admin0 " \
                   "(cartodb_id integer, the_geom geometry(Geometry,4326), " \
                   "the_geom_webmercator geometry(Geometry,3857), " \
                   "population double precision OPTIONS (column_name 'pop_est')) SERVER aggregation OPTIONS " \
                   "(schema_name 'public', table_name '#{config['tables']['admin0']}', updatable 'false');")
            db.run("CREATE FOREIGN TABLE IF NOT EXISTS #{SCHEMA_AGGREGATION_TABLES}.agg_admin1 " \
                   "(cartodb_id integer,the_geom geometry(Geometry,4326), " \
                   "the_geom_webmercator geometry(Geometry,3857)) " \
                   "SERVER aggregation OPTIONS (schema_name 'public', table_name '#{config['tables']['admin1']}', updatable 'false');")
            db.run("GRANT SELECT ON TABLE #{SCHEMA_AGGREGATION_TABLES}.agg_admin0 TO \"#{@user.database_username}\";")
            db.run("GRANT SELECT ON TABLE #{SCHEMA_AGGREGATION_TABLES}.agg_admin1 TO \"#{@user.database_username}\";")
          end
        end
      end

      # Execute a query in the user database
      # @param [String] query, using $1, $2 ... for placeholders
      # @param ... values for the placeholders
      # @return [Array<Hash<String, Value>>] Something (an actual Array in this case) that behaves like an Array
      #                                      of Hashes that map column name (as string) to value
      # @raise [PG::Error] if the query fails
      def execute_in_user_database(query, *binds)
        placeholder_query = query.gsub(/\$\d+/, '?')
        @user.in_database.fetch(placeholder_query, *binds).all.map(&:stringify_keys)
      rescue Sequel::DatabaseError => exception
        raise exception.cause
      end

      def create_ghost_tables_event_trigger
        return if @user.has_feature_flag?('ghost_tables_trigger_disabled')
        configure_ghost_table_event_trigger
        @user.in_database(as: :superuser).run("SELECT #{SCHEMA_CARTODB}.CDB_EnableGhostTablesTrigger()")
      end

      def configure_ghost_table_event_trigger
        tis_config = Cartodb.config[:invalidation_service]
        return unless tis_config
        @user.in_database(as: :superuser)
             .run("SELECT cartodb.CDB_Conf_SetConf('invalidation_service', '#{tis_config.to_json}')")
      end

      def drop_ghost_tables_event_trigger
        @user.in_database(as: :superuser).run('SELECT CDB_DisableGhostTablesTrigger()')
      end

      def create_oauth_reassign_ownership_event_trigger
        @user.in_database(as: :superuser).run('SELECT CDB_EnableOAuthReassignTablesTrigger()')
      end

      def drop_oauth_reassign_ownership_event_trigger
        @user.in_database(as: :superuser).run('SELECT CDB_DisableOAuthReassignTablesTrigger()')
      end

      private

      def http_client
        @http_client ||= Carto::Http::Client.get('old_user', log_requests: true)
      end

      # Telnet invalidation works only for Varnish 2.x.
      def create_function_invalidate_varnish_telnet
        add_python

        varnish_host = Cartodb.get_config(:varnish_management, 'host') || '127.0.0.1'
        varnish_port = Cartodb.get_config(:varnish_management, 'port') || 6082
        varnish_timeout = Cartodb.get_config(:varnish_management, 'timeout') || 5
        varnish_critical = Cartodb.get_config(:varnish_management, 'critical') == true ? 1 : 0
        varnish_retry = Cartodb.get_config(:varnish_management, 'retry') || 5
        purge_command = Cartodb.get_config(:varnish_management, 'purge_command')
        varnish_trigger_verbose = Cartodb.get_config(:varnish_management).fetch('trigger_verbose', true) == true ? 1 : 0

        @user.in_database(as: :superuser).run(
          <<-TRIGGER
            BEGIN;
            CREATE OR REPLACE FUNCTION public.cdb_invalidate_varnish(table_name text) RETURNS void AS
            $$
                critical = #{varnish_critical}
                timeout = #{varnish_timeout}
                retry = #{varnish_retry}
                trigger_verbose = #{varnish_trigger_verbose}

                client = GD.get('varnish', None)
                for i in ('base64', 'hashlib'):
                  if not i in GD:
                    GD[i] = __import__(i)

                while True:

                  if not client:
                      try:
                        import varnish
                        client = GD['varnish'] = varnish.VarnishHandler(('#{varnish_host}', #{varnish_port}, timeout))
                      except Exception as err:
                        # NOTE: we won't retry on connection error
                        if critical:
                          plpy.error('Varnish connection error: ' +  str(err))
                        break

                  try:
                    cache_key = "t:" + GD['base64'].b64encode(GD['hashlib'].sha256('#{@user.database_name}:%s' % table_name).digest())[0:6]
                    # We want to say \b here, but the Varnish telnet interface expects \\b, we have to escape that on Python to \\\\b and double that for SQL
                    client.fetch('#{purge_command} obj.http.Surrogate-Key ~ "\\\\\\\\b%s\\\\\\\\b"' % cache_key)
                    break
                  except Exception as err:
                    if trigger_verbose:
                      plpy.warning('Varnish fetch error: ' + str(err))
                    client = GD['varnish'] = None # force reconnect
                    if not retry:
                      if critical:
                        plpy.error('Varnish fetch error: ' +  str(err))
                      break
                    retry -= 1 # try reconnecting
            $$
            LANGUAGE '#{@plpythonu}' VOLATILE;
            REVOKE ALL ON FUNCTION public.cdb_invalidate_varnish(TEXT) FROM PUBLIC;
            COMMIT;
        TRIGGER
        )
      end

      def create_function_invalidate_varnish_http
        add_python

        varnish_host = Cartodb.get_config(:varnish_management, 'host') || '127.0.0.1'
        varnish_port = Cartodb.get_config(:varnish_management, 'http_port') || 6081
        varnish_timeout = Cartodb.get_config(:varnish_management, 'timeout') || 5
        varnish_critical = Cartodb.get_config(:varnish_management, 'critical') == true ? 1 : 0
        varnish_retry = Cartodb.get_config(:varnish_management, 'retry') || 5
        varnish_trigger_verbose = Cartodb.get_config(:varnish_management).fetch('trigger_verbose', true) == true ? 1 : 0

        # PG12_DEPRECATED remove support for python 2
        @user.in_database(as: :superuser).run(
          <<-TRIGGER
            BEGIN;
            CREATE OR REPLACE FUNCTION public.cdb_invalidate_varnish(table_name text) RETURNS void AS
            $$
                critical = #{varnish_critical}
                timeout = #{varnish_timeout}
                retry = #{varnish_retry}
                trigger_verbose = #{varnish_trigger_verbose}

                if not 'httplib' in GD:
                  try:
                    GD['httplib'] = __import__('httplib')
                  except:
                    from http import client
                    GD['httplib'] = client

                for i in ('base64', 'hashlib'):
                  if not i in GD:
                    GD[i] = __import__(i)

                while True:

                  try:
                    database_table = '#{@user.database_name}:%s' % table_name
                    try:
                      conn = GD['httplib'].HTTPConnection('#{varnish_host}', #{varnish_port}, False, timeout)
                      dbtable_hash = GD['hashlib'].sha256(database_table).digest()
                      dbtable_encoded = GD['base64'].b64encode(dbtable_hash)[0:6]
                    except Exception:
                      conn = GD['httplib'].HTTPConnection('#{varnish_host}', port=#{varnish_port}, timeout=timeout)
                      dbtable_hash = GD['hashlib'].sha256(database_table.encode()).digest()
                      dbtable_encoded = GD['base64'].b64encode(dbtable_hash)[0:6].decode()
                    raw_cache_key = 't:%s' % dbtable_encoded
                    cache_key = raw_cache_key.replace('+', r'\+')
                    conn.request('PURGE', '/key', '', {"Invalidation-Match": ('\\\\b%s\\\\b' % cache_key) })
                    response = conn.getresponse()
                    assert response.status == 204
                    break
                  except Exception as err:
                    if trigger_verbose:
                      plpy.warning('Varnish purge error: ' + str(err))
                    if not retry:
                      if critical:
                        plpy.error('Varnish purge error: ' +  str(err))
                      break
                    retry -= 1 # try reconnecting
            $$
            LANGUAGE '#{@plpythonu}' VOLATILE;
            REVOKE ALL ON FUNCTION public.cdb_invalidate_varnish(TEXT) FROM PUBLIC;
            COMMIT;
          TRIGGER
        )
      end

      # Invalidate through external service
      def create_function_invalidate_varnish_invalidation_service
        add_python

        invalidation_host = Cartodb.get_config(:invalidation_service, 'host') || '127.0.0.1'
        invalidation_port = Cartodb.get_config(:invalidation_service, 'port') || 3142
        invalidation_timeout = Cartodb.get_config(:invalidation_service, 'timeout') || 5
        invalidation_critical = Cartodb.get_config(:invalidation_service, 'critical') ? 1 : 0
        invalidation_retry = Cartodb.get_config(:invalidation_service, 'retry') || 5
        invalidation_trigger_verbose =
          Cartodb.get_config(:invalidation_service).fetch('trigger_verbose', true) == true ? 1 : 0

        @user.in_database(as: :superuser).run(
          <<-TRIGGER
            BEGIN;
            CREATE OR REPLACE FUNCTION public.cdb_invalidate_varnish(table_name text) RETURNS void AS
            $$
                critical = #{invalidation_critical}
                timeout = #{invalidation_timeout}
                retry = #{invalidation_retry}
                trigger_verbose = #{invalidation_trigger_verbose}

                client = GD.get('invalidation', None)

                if 'syslog' not in GD:
                  import syslog
                  GD['syslog'] = syslog
                else:
                  syslog = GD['syslog']

                if 'time' not in GD:
                  import time
                  GD['time'] = time
                else:
                  time = GD['time']

                if 'json' not in GD:
                  import json
                  GD['json'] = json
                else:
                  json = GD['json']

                start = time.time()
                retries = 0
                termination_state = 1
                error = ''

                while True:

                  if not client:
                      try:
                        import redis
                        client = GD['invalidation'] = redis.Redis(host='#{invalidation_host}', port=#{invalidation_port}, socket_timeout=timeout)
                      except Exception as err:
                        error = "client_error - %s" % str(err)
                        # NOTE: we won't retry on connection error
                        if critical:
                          plpy.error('Invalidation Service connection error: ' +  str(err))
                        break

                  try:
                    client.execute_command('TCH', '#{@user.database_name}', table_name)
                    termination_state = 0
                    error = ''
                    break
                  except Exception as err:
                    error = "request_error - %s" % str(err)
                    if trigger_verbose:
                      plpy.warning('Invalidation Service warning: ' + str(err))
                    client = GD['invalidation'] = None # force reconnect
                    if not retry:
                      if critical:
                        plpy.error('Invalidation Service error: ' +  str(err))
                      break
                    retries = retries + 1
                    retry -= 1 # try reconnecting

                end = time.time()
                invalidation_duration = (end - start)
                current_time = time.strftime("%Y-%m-%d %H:%M:%S %Z", time.localtime())
                session_user = plpy.execute("SELECT session_user", 1)[0]["session_user"]
                invalidation_result = {"timestamp": current_time, "duration": round(invalidation_duration, 8), "termination_state": termination_state, "retries": retries, "error": error, "database": "#{@user.database_name}", "table_name": table_name, "dbuser": session_user}

                if trigger_verbose:
                  syslog.syslog(syslog.LOG_INFO, "invalidation: %s" % json.dumps(invalidation_result))

            $$
            LANGUAGE '#{@plpythonu}' VOLATILE;
            REVOKE ALL ON FUNCTION public.cdb_invalidate_varnish(TEXT) FROM PUBLIC;
            COMMIT;
          TRIGGER
        )
      end

      # Geocoder api extension related
      def build_geocoder_server_config_sql(config)
        host = config['host']
        port = config['port']
        user = config['user']
        dbname = config['dbname']
        %{
          SELECT cartodb.CDB_Conf_SetConf('geocoder_server_config',
            '{ \"connection_str\": \"host=#{host} port=#{port} dbname=#{dbname} user=#{user}\"}'::json
          );
        }
      end

      def build_entity_config_sql
        # User configuration
        entity_name = @user.organization_user? ? @user.organization.name : @user.username
        %{
          SELECT cartodb.CDB_Conf_SetConf('user_config',
            '{"is_organization": #{@user.organization_user?}, "entity_name": "#{entity_name}"}'::json
          );
        }
      end

      def build_aggregation_fdw_config_sql(config)
        %{
          SELECT cartodb.CDB_Conf_SetConf('fdws',
            '{"aggregation":{"server":{"extensions":"postgis", "dbname":"#{config['dbname']}",
            "host":"#{config['host']}", "port":"#{config['port']}"}, "users":{"public":{"user":"#{config['username']}",
            "password":"#{config['password']}"} } } }'::json
          );
        }
      end

      def log_context
        super.merge(current_user: user)
      end
    end
  end
end

require 'pg'
require 'redis'
require 'yaml'
require 'json'
require 'logger'
require 'optparse'
require 'digest'
require 'securerandom'

require_relative 'config'
require_relative 'utils'
require_relative 'legacy_functions'

module CartoDB
  module DataMover
    class ImportJob
      include CartoDB::DataMover::Utils
      include CartoDB::DataMover::LegacyFunctions
      attr_reader :logger

      def initialize(options)
        default_options = { data: true, metadata: true, set_banner: true, update_metadata: true }
        @options = default_options.merge(options)
        @config = CartoDB::DataMover::Config.config
        @logger = @options[:logger] || default_logger
        @@importjob_logger = @options[:import_job_logger]

        @start = Time.now
        @logger.debug "Starting import job with options: #{@options}"

        @target_dbport = ENV['USER_DB_PORT'] || @config[:dbport]
        @target_dbhost = @options[:host] || @config[:dbhost]

        raise "File #{@options[:file]} does not exist!" unless File.exists?(@options[:file])
        # User(s) metadata json
        @pack_config = JSON::parse File.read(@options[:file])

        @path = File.expand_path(File.dirname(@options[:file])) + "/"

        job_uuid = @options[:job_uuid] || Carto::UUIDHelper.random_uuid
        @import_log = { job_uuid:     job_uuid,
                        id:           nil,
                        type:         'import',
                        path:         @path,
                        start:        @start,
                        end:          nil,
                        elapsed_time: nil,
                        server:       `hostname`.strip,
                        pid:          Process.pid,
                        db_target:    @target_dbhost,
                        status:       nil,
                        trace:        nil
                       }

        @target_dbname = target_dbname
      end

      def run!
        if @pack_config['organization']
          process_org
        else
          process_user
        end
      end

      def rollback!
        close_all_database_connections
        if @pack_config['organization']
          rollback_org
        else
          rollback_user
        end
      end

      def terminate_connections
        @user_conn && @user_conn.close
        @user_conn = nil

        @superuser_user_conn && @superuser_user_conn.close
        @superuser_user_conn = nil

        @superuser_conn && @superuser_conn.close
        @superuser_conn = nil
      end

      def db_exists?
        superuser_pg_conn.query("select 1 from pg_database where datname = '#{@target_dbname}'").count > 0
      end

      private

      def for_each_oauth_app_user(user_id)
        Carto::User.find(user_id).oauth_app_users.each do |oau|
          yield superuser_user_pg_conn, oau
        end
      rescue PG::Error => e
        # Ignore role already exists errors
        if e.message =~ /already exists/
          @logger.warn "Warning: Oauth app user role already exists"
        else
          raise
        end
      end

      def process_user
        @target_username = @pack_config['user']['username']
        @target_userid = @pack_config['user']['id']
        @import_log[:id] = @pack_config['user']['username']
        @target_port = ENV['USER_DB_PORT'] || @config[:dbport]

        if org_import?
          @target_dbuser = database_username(@target_userid)
          @target_schema = @pack_config['user']['database_schema']
          @target_org_id = nil
        else
          organization_data = get_org_info(@options[:target_org])
          @target_dbuser = database_username(@target_userid)
          @target_schema = @pack_config['user']['database_schema']
          @target_org_id = organization_data['id']

          if owner?(organization_data)
            # If the user being imported into an org is the owner of the org, we make the import as it were a single-user
            @target_is_owner = true
          else
            # We fill the missing configuration data for the owner
            organization_owner_data = get_user_info(organization_data['owner_id'])
            @target_dbhost = @options[:host] || organization_owner_data['database_host']
            @target_is_owner = false
          end
        end

        if @options[:mode] == :import
          import_user
        elsif @options[:mode] == :rollback
          rollback_user
        end
      end

      def process_org
        @organization_id = @pack_config['organization']['id']
        @owner_id = @pack_config['organization']['owner_id']
        @import_log[:id] = @organization_id

        if @options[:mode] == :import
          import_org
        elsif @options[:mode] == :rollback
          rollback_org
        end
      end

      def rollback_user
        if @options[:metadata]
          rollback_metadata("user_#{@target_userid}_metadata_undo.sql")
          rollback_redis("user_#{@target_userid}_metadata_undo.redis")
        end
        if @options[:data]
          drop_database(@target_dbname) if @options[:drop_database] && !@options[:schema_mode]
          drop_role(@target_dbuser) if @options[:drop_roles]
        end
      end

      def import_user
        begin
          if @options[:metadata]
            check_user_exists_redis
            check_user_exists_postgres
          end
        rescue StandardError => e
          @logger.error "Error in sanity checks: #{e}"
          log_error(e)
          remove_user_mover_banner(@pack_config['user']['id']) if @options[:set_banner]
          raise
        end

        if @options[:data]
          # Password should be passed here too
          create_user(@target_dbuser)
          create_org_role(@target_dbname) # Create org role for the original org
          create_org_owner_role(@target_dbname)
          if org_import?
            grant_user_org_role(@target_dbuser, @target_dbname)
          end

          if @target_schema != 'public'
            set_user_search_path(@target_dbuser, @pack_config['user']['database_schema'])
            create_public_db_user(@target_userid, @pack_config['user']['database_schema'])
          end

          @pack_config['roles'].each do |user, roles|
            roles.each { |role| grant_user_role(user, role) }
          end

          if @target_org_id && @target_is_owner && File.exists?(org_dump_path)
            setup_db_for_dump_load
            create_org_oauth_app_user_roles(@target_org_id)
            create_org_api_key_roles(@target_org_id)
            import_pgdump("org_#{@target_org_id}.dump")
            grant_org_oauth_app_user_roles(@target_org_id)
            grant_org_api_key_roles(@target_org_id)
          elsif File.exists?(user_dump_path)
            setup_db_for_dump_load
            create_user_oauth_app_user_roles(@target_userid)
            create_user_api_key_roles(@target_userid)
            import_pgdump("user_#{@target_userid}.dump")
            grant_user_oauth_app_user_roles(@target_userid)
            grant_user_api_key_roles(@target_userid)
          elsif File.exists? "#{@path}#{@target_username}.schema.sql"
            setup_db_for_schema_load
            run_file_restore_schema("#{@target_username}.schema.sql")
          end
        end

        if @options[:metadata]
          begin
            import_redis("user_#{@target_userid}_metadata.redis")
            import_metadata("user_#{@target_userid}_metadata.sql")
          rescue StandardError => e
            rollback_metadata("user_#{@target_userid}_metadata_undo.sql")
            rollback_redis("user_#{@target_userid}_metadata_undo.redis")
            log_error(e)
            remove_user_mover_banner(@pack_config['user']['id']) if @options[:set_banner]
            raise
          end
        end

        if @options[:data]
          configure_database(@target_dbhost)
          drop_deprecated_extensions
        end

        if @options[:update_metadata]
          update_metadata_user(@target_dbhost)
        end

        log_success
      rescue StandardError => e
        log_error(e)
        raise
      ensure
        remove_user_mover_banner(@pack_config['user']['id']) if @options[:set_banner]
      end

      def import_org
        import_metadata("org_#{@organization_id}_metadata.sql") if @options[:metadata]
        create_org_role(@pack_config['users'][0]['database_name']) # Create org role for the original org
        @pack_config['groups'].each do |group|
          create_role(group['database_role'])
        end
        @pack_config['users'].each do |user|
          # Password should be passed here too
          create_user(database_username(user['id']))
          create_public_db_user(user['id'], user['database_schema'])
          grant_user_org_role(database_username(user['id']), user['database_name'])
        end

        org_user_ids = @pack_config['users'].map{|u| u['id']}
        # We set the owner to be imported first (if schemas are not split, this will also import the whole org database)
        org_user_ids = org_user_ids.insert(0, org_user_ids.delete(@owner_id))

        org_user_ids.each do |user|
          @logger.info("Importing org user #{user}..")
          i = ImportJob.new(file: @path + "user_#{user}.json",
                            mode: @options[:mode],
                            host: @target_dbhost,
                            target_org: @pack_config['organization']['name'],
                            logger: @logger, data: @options[:data], metadata: @options[:metadata],
                            update_metadata: @options[:update_metadata])
          i.run!
        end
      rescue StandardError => e
        rollback_metadata("org_#{@organization_id}_metadata_undo.sql") if @options[:metadata]
        log_error(e)
        raise e
      else
        log_success
      ensure
        @pack_config['users'].each do |user|
          remove_user_mover_banner(user['id']) if @options[:set_banner]
        end
      end

      def rollback_org
        db = @pack_config['users'][0]['database_name']
        @pack_config['users'].each do |user|
          @logger.info("Rolling back metadata for org user #{user['id']}..")
          ImportJob.new(file: @path + "user_#{user['id']}.json",
                        mode: :rollback,
                        host: @target_dbhost,
                        target_org: @pack_config['organization']['name'],
                        logger: @logger,
                        metadata: @options[:metadata],
                        data: false).run!
        end
        rollback_metadata("org_#{@organization_id}_metadata_undo.sql") if @options[:metadata]
        if @options[:data]
          drop_database(db) if @options[:drop_database]
          if @options[:drop_roles]
            drop_role(org_role_name(db))
            @pack_config['users'].each { |u| drop_role(database_username(u['id'])) }
            @pack_config['groups'].each { |g| drop_role(g['database_role']) }
          end
        end
      end

      def drop_role(role)
        superuser_pg_conn.query("DROP ROLE IF EXISTS \"#{role}\"")
      end

      def get_org_info(orgname)
        result = metadata_pg_conn.query('SELECT * FROM organizations WHERE name = $1', [orgname])
        raise "Organization #{orgname} not found" if result.cmd_tuples == 0
        result[0]
      end

      def get_user_info(user_id)
        result = metadata_pg_conn.query('SELECT * FROM users WHERE id = $1', [user_id])
        raise "User with ID #{user_id} not found" if result.cmd_tuples == 0
        result[0]
      end

      def set_user_statement_timeout(user, timeout)
        superuser_pg_conn.query("ALTER USER #{superuser_pg_conn.quote_ident(user)} SET statement_timeout = #{timeout}")
      end

      def set_db_statement_timeout(db, timeout)
        superuser_pg_conn.query("ALTER DATABASE #{superuser_pg_conn.quote_ident(db)} SET statement_timeout = #{timeout}")
      end

      def close_all_database_connections(database_name = @target_dbname)
        superuser_pg_conn.query("SELECT pg_terminate_backend(pg_stat_activity.pid)
                                  FROM pg_stat_activity
                                WHERE pg_stat_activity.datname = '#{database_name}'
                                AND pid <> pg_backend_pid();")
        terminate_connections
      end

      def user_pg_conn
        @user_conn ||= PG.connect(host: @target_dbhost,
                                  user: @target_dbuser,
                                  dbname: @target_dbname,
                                  port: @config[:dbport],
                                  connect_timeout: CartoDB::DataMover::Config.config[:connect_timeout])
      end

      def superuser_user_pg_conn
        @superuser_user_conn ||= PG.connect(host: @target_dbhost,
                                            user: @config[:dbuser],
                                            dbname: @target_dbname,
                                            port: @target_dbport,
                                            connect_timeout: CartoDB::DataMover::Config.config[:connect_timeout])
      end

      def superuser_pg_conn
        @superuser_conn ||= PG.connect(host: @target_dbhost,
                                       user: @config[:dbuser],
                                       dbname: 'postgres',
                                       port: @target_dbport,
                                       connect_timeout: CartoDB::DataMover::Config.config[:connect_timeout])
      end

      def drop_database(db_name)
        close_all_database_connections(db_name)
        superuser_pg_conn.query("DROP DATABASE IF EXISTS \"#{db_name}\"")
      end

      def clean_oids(user_id, user_schema)
        tables = superuser_user_pg_conn.query("SELECT pg_class.oid, pg_class.relname
            FROM pg_class inner join pg_namespace on pg_namespace.oid=pg_class.relnamespace where relkind='r' and nspname=$1;", [user_schema])
        tables.each do |row|
          metadata_pg_conn.query('UPDATE user_tables SET table_id=$1 where user_id = $2 and name=$3', [row['oid'], user_id, row['relname']])
        end
      end

      def check_user_exists_postgres
        @logger.debug 'Checking if user does not exist on Postgres metadata...'
        result = metadata_pg_conn.query('SELECT * FROM USERS WHERE id = $1', [@target_userid])
        raise "User already exists in PostgreSQL metadata" if result.cmd_tuples != 0
      end

      def check_user_exists_redis
        @logger.debug 'Checking if user does not exist on Redis metadata...'
        result = metadata_redis_conn.hgetall("rails:users:#{@target_dbname}")
        raise "User already exists in Redis metadata" if result != {}
      end

      def conn_string(user, host, port, name)
        %{#{!user ? '' : '-U ' + user} -h #{host} -p #{port} -d #{name} }
      end

      def run_redis_command(config)
        "redis-cli -p #{config[:redis_port]} -h #{config[:redis_host]} --pipe"
      end

      def run_file_redis(file)
        run_command("cat #{@path}#{file} | #{run_redis_command(@config)}")
      end

      def run_file_metadata_postgres(file)
        run_command("cat #{@path}#{file} | psql -v ON_ERROR_STOP=1 #{conn_string(@config[:dbuser], @config[:dbhost], @config[:dbport], @config[:dbname])}")
      end

      def run_file_restore_postgres(file, sections = nil)
        file_path = "#{@path}#{file}"
        command = "#{pg_restore_bin_path} -e --verbose -j4 --disable-triggers -Fc #{file_path} #{conn_string(
          @config[:dbuser],
          @target_dbhost,
          @config[:user_dbport],
          @target_dbname)}"
        command += " --section=#{sections}" if sections
        command += " --use-list=\"#{@toc_file}\""
        run_command(command)
      end

      def run_file_restore_schema(file)
        run_command("cat #{@path}#{file} | psql -v ON_ERROR_STOP=1 #{conn_string(
          @config[:dbuser],
          @target_dbhost,
          @config[:user_dbport],
          @target_dbname)}")
      end

      def import_redis(file)
        @logger.info("Importing Redis keys from #{file}..")
        run_file_redis(file)
      end

      def import_metadata(file)
        @logger.info("Importing PostgreSQL metadata from #{file}..")
        run_file_metadata_postgres(file)
      end

      def rollback_redis(file)
        @logger.info("Rolling back Redis keys from #{file}..")
        run_file_redis(file)
      end

      def rollback_metadata(file)
        @logger.info("Rolling back PostgreSQL metadata from #{file}..")
        run_file_metadata_postgres(file)
      end

      def clean_toc_file(file)
        tmp = Tempfile.new("extract_#{@target_username}.txt")
        File.open(file, 'r').each do |l|
          tmp << l unless remove_line?(l)
        end

        tmp.close
        FileUtils.mv(tmp.path, file)
      ensure
        tmp.delete
      end

      def toc_file(file)
        toc_file = "#{@path}user_#{@target_username}.list"
        command = "#{pg_restore_bin_path} -l #{file} --file='#{toc_file}'"
        run_command(command)
        clean_toc_file(toc_file)
        toc_file
      end

      # It would be a good idea to "disable" the invalidation trigger during the load
      # This way, the restore will be much faster and won't also cause a big overhead
      # in the old database while the process is ongoing
      # Disabling it may be hard. Maybe it's easier to just exclude it in the export.
      def import_pgdump(dump)
        @logger.info("Importing dump from #{dump} using pg_restore..")
        @toc_file = toc_file("#{@path}#{dump}")

        run_file_restore_postgres(dump, 'pre-data')
        run_file_restore_postgres(dump, 'data')
        run_file_restore_postgres(dump, 'post-data')
      end

      def create_user(username, password = nil)
        @logger.info "Creating user #{username} on target db.."
        begin
          superuser_pg_conn.query("CREATE ROLE \"#{username}\";
              ALTER ROLE \"#{username}\" WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION;
              GRANT publicuser TO \"#{username}\";")
          superuser_pg_conn.query("ALTER ROLE #{username} WITH PASSWORD '#{password}'") unless password.nil?
        rescue PG::Error => e
          @logger.info "Target Postgres role already exists: #{e.inspect}"
        end
      end

      def create_org_api_key_roles(org_id)
        Carto::Organization.find(org_id).users.each { |u| create_user_api_key_roles(u.id) }
      end

      def create_user_api_key_roles(user_id)
        Carto::User.find(user_id).api_keys.select(&:needs_setup?).each do |k|
          begin
            k.role_creation_queries.each { |q| superuser_user_pg_conn.query(q) }
          rescue PG::Error => e
            # Ignore role already exists errors
            raise unless e.message =~ /already exists/
          end
        end
      end

      def grant_org_api_key_roles(org_id)
        Carto::Organization.find(org_id).users.each { |u| grant_user_api_key_roles(u.id) }
      end

      def grant_user_api_key_roles(user_id)
        Carto::User.find(user_id).api_keys.select(&:needs_setup?).each do |k|
          k.role_permission_queries.each { |q| superuser_user_pg_conn.query(q) }
          k.grant_ownership_role_privileges
          k.save_cdb_conf_info
        end
      end

      def create_org_oauth_app_user_roles(org_id)
        Carto::Organization.find(org_id).users.each { |u| create_user_oauth_app_user_roles(u.id) }
      end

      def create_user_oauth_app_user_roles(user_id)
        for_each_oauth_app_user(user_id) do |conn, oau|
          conn.query(oau.create_dataset_role_query)
        end

        # different loops to avoid failing to create ownership role due to an error in the dataset role
        for_each_oauth_app_user(user_id) do |conn, oau|
          conn.query(oau.create_ownership_role_query)
        end
      end

      def grant_org_oauth_app_user_roles(org_id)
        Carto::Organization.find(org_id).users.each { |u| grant_user_oauth_app_user_roles(u.id) }
      end

      def grant_user_oauth_app_user_roles(user_id)
        Carto::User.find(user_id).oauth_app_users.each do |oau|
          begin
            oau.grant_dataset_role_privileges
          rescue Carto::OauthProvider::Errors::InvalidScope => e
            # Ignore managed oauth_app_user errors
            @logger.error "Error granting permissions to dataset role: #{e}"
          end

          begin
            oau.grant_ownership_role_privileges
          rescue Carto::OauthProvider::Errors::InvalidScope => e
            # Ignore managed oauth_app_user errors
            @logger.error "Error granting permissions to ownership role: #{e}"
          end
        end
      end

      def org_role_name(database_name)
        "cdb_org_member_#{Digest::MD5.hexdigest(database_name)}"
      end

      def org_owner_role_name(database_name)
        "#{database_name}_a"
      end

      def grant_user_role(user, role)
        superuser_pg_conn.query("GRANT \"#{role}\" TO \"#{user}\"")
      end

      def grant_user_org_role(user, database_name)
        grant_user_role(user, org_role_name(database_name))
      end

      def create_role(role, createrole = false)
        @logger.info "Creating role #{role} on target db.."
        begin
          superuser_pg_conn.query("CREATE ROLE \"#{role}\" #{createrole ? 'CREATEROLE' : ''} NOLOGIN;")
        rescue PG::Error => e
          @logger.info "Target org role already exists: #{e.inspect}"
        end
      end

      def create_org_role(database_name)
        create_role(org_role_name(database_name))
      end

      def create_org_owner_role(database_name)
        create_role(org_owner_role_name(database_name), true)
      end

      def create_public_db_user(user_id, schema)
        user = "cartodb_publicuser_#{user_id}"
        create_user(user)
        superuser_pg_conn.query("GRANT publicuser TO \"#{user}\"")
        set_user_search_path(user, schema)
      end

      def set_user_search_path(user, search_path_prefix)
        search_path = CartoDB::UserModule::DBService.build_search_path(search_path_prefix)
        superuser_pg_conn.query("ALTER USER \"#{user}\" SET search_path= #{search_path}")
      end

      def setup_db_for_schema_load
        begin
          superuser_pg_conn.query("CREATE DATABASE \"#{@target_dbname}\" WITH TEMPLATE template_postgis")
        rescue PG::DuplicateDatabase
          @logger.warn "Warning: Database already exists"
        end
        superuser_user_pg_conn.query("CREATE EXTENSION IF NOT EXISTS postgis")
        cartodb_schema = superuser_user_pg_conn.query("SELECT nspname FROM pg_catalog.pg_namespace where nspname = 'cartodb'")
        superuser_user_pg_conn.query("CREATE SCHEMA cartodb") if cartodb_schema.count == 0
        cdb_importer_schema = superuser_user_pg_conn.query("SELECT nspname FROM pg_catalog.pg_namespace where nspname = 'cdb_importer'")
        superuser_user_pg_conn.query("CREATE SCHEMA cdb_importer") if cdb_importer_schema.count == 0
        cdb_schema = superuser_user_pg_conn.query("SELECT nspname FROM pg_catalog.pg_namespace where nspname = 'cdb'")
        superuser_user_pg_conn.query("CREATE SCHEMA cdb") if cdb_schema.count == 0
        superuser_user_pg_conn.query("CREATE EXTENSION IF NOT EXISTS cartodb WITH SCHEMA cartodb CASCADE")
      end

      def setup_db_for_dump_load
        superuser_pg_conn.query("CREATE DATABASE \"#{@target_dbname}\"")

        return if destination_db_major_version != 12

        superuser_user_pg_conn.query("CREATE EXTENSION IF NOT EXISTS postgis")
        superuser_user_pg_conn.query("CREATE EXTENSION IF NOT EXISTS postgis_raster")
        superuser_user_pg_conn.query("CREATE EXTENSION IF NOT EXISTS plpython3u")
      end

      def update_database_retries(userid, username, db_host, db_name, retries = 1)
        update_database(userid, username, db_host, db_name)
      rescue StandardError => e
        @logger.error "Error updating database"
        if retries > 0
          @logger.info "Retrying..."
          update_database_retries(userid, username, db_host, db_name, retries - 1)
        else
          @logger.info "No more retries"
          raise
        end
      end

      def update_database(userid, username, db_host, db_name)
        update_postgres_database_host(userid, db_host)
        update_redis_database_host(username, db_host)

        update_postgres_database_name(userid, db_name)
        update_redis_database_name(username, db_name)
      end

      def update_postgres_database_host(userid, db)
        @logger.info "Updating PostgreSQL database_host..."
        metadata_pg_conn.exec("UPDATE users SET database_host = $1 WHERE id = $2", [db, userid])
      end

      def update_postgres_organization(userid, org_id)
        @logger.info "Updating PostgreSQL organization..."
        metadata_pg_conn.exec("UPDATE users SET organization_id = $1 WHERE id = $2", [org_id, userid])
      end

      def update_redis_database_host(user, db)
        @logger.info "Updating Redis database_host..."
        metadata_redis_conn.hset("rails:users:#{user}", 'database_host', db)
      end

      def update_postgres_database_name(userid, db)
        @logger.info "Updating PostgreSQL database_name..."
        metadata_pg_conn.exec("UPDATE users SET database_name = $1 WHERE id = $2", [db, userid])
      end

      def update_redis_database_name(user, db)
        @logger.info "Updating Redis database_name..."
        metadata_redis_conn.hset("rails:users:#{user}", 'database_name', db)
      end

      def configure_database(target_dbhost)
        # Note: this will change database_host on the user model to perform configuration but will not actually store
        # the change
        user_model = ::User.find(username: @target_username)
        user_model.database_host = target_dbhost
        user_model.database_name = @target_dbname
        user_model.organization_id = @target_org_id if !@target_org_id.nil?

        user_model.db_service.setup_organization_owner if @target_is_owner
        user_model.db_service.monitor_user_notification # Used to inform the database_server
        user_model.db_service.configure_database
        user_model.db_service.monitor_user_notification
      end

      def update_metadata_user(target_dbhost)
        user_model = ::User.find(username: @target_username)
        orig_dbhost = user_model.database_host
        changed_metadata = false
        begin
          clean_oids(@target_userid, @target_schema)
          if @target_org_id
            update_postgres_organization(@target_userid, @target_org_id)
          else
            update_postgres_organization(@target_userid, nil)
          end
          begin
            update_database_retries(@target_userid, @target_username, target_dbhost, @target_dbname, 1)
            changed_metadata = true
            user_model.reload
          end
        rescue StandardError => e
          if changed_metadata
            update_database_retries(@target_userid, @target_username, orig_dbhost, @target_dbname, 1)
          end
          log_error(e)
          remove_user_mover_banner(@pack_config['user']['id']) if @options[:set_banner]
          raise
        end
      end

      def importjob_logger
        @@importjob_logger ||= CartoDB.unformatted_logger("#{Rails.root}/log/datamover.log")
      end

      def log_error(e)
        @logger.error e
        @import_log[:end] = Time.now
        @import_log[:elapsed_time] = (@import_log[:end] - @import_log[:start]).ceil
        @import_log[:status] = 'failure'
        @import_log[:trace] = e.to_s
        importjob_logger.info(@import_log.to_json)
      end

      def log_success
        @import_log[:end] = Time.now
        @import_log[:elapsed_time] = (@import_log[:end] - @import_log[:start]).ceil
        @import_log[:status] = 'success'
        importjob_logger.info(@import_log.to_json)
      end

      def pg_restore_bin_path
        get_pg_restore_bin_path(superuser_pg_conn)
      end

      def target_dbname
        return @pack_config['users'][0]['database_name'] if @pack_config['organization']

        @target_userid = @pack_config['user']['id']
        if org_import?
          user_database(@target_userid)
        else
          organization_data = get_org_info(@options[:target_org])
          if owner?(organization_data)
            user_database(@target_userid)
          else
            organization_owner_data = get_user_info(organization_data['owner_id'])
            organization_owner_data['database_name']
          end
        end
      end

      def owner?(organization_data)
        @pack_config['user']['id'] == organization_data['owner_id']
      end

      def org_import?
        @options[:target_org] == nil
      end

      def organization_import?
        @pack_config['organization'] != nil
      end

      def org_dump_path
        "#{@path}org_#{@target_org_id}.dump"
      end

      def user_dump_path
        "#{@path}user_#{@target_userid}.dump"
      end

      def drop_deprecated_extensions
        return if destination_db_major_version != 12

        %w(plpythonu plpython2u).each do |deprecated_extension|
          sql_command = "DROP EXTENSION IF EXISTS #{deprecated_extension}"
          logger.info(sql_command)
          superuser_user_pg_conn.query(sql_command)
        end
      end

      def destination_db_major_version
        get_database_version_for_binaries(superuser_pg_conn).split('.').first.to_i
      end
    end
  end
end

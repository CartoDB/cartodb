require_relative 'thread_pool'
require 'timeout'

namespace :cartodb do
  namespace :db do

    #################
    # LOAD TABLE OIDS
    #################
    desc 'Load table oids'
    task :load_oids => :environment do
      count = User.count
      User.all.each_with_index do |user, i|
        begin
          user.link_outdated_tables
          printf "OK %-#{20}s (%-#{4}s/%-#{4}s)\n", user.username, i, count
        rescue => e
          printf "FAIL %-#{20}s (%-#{4}s/%-#{4}s) #{e.message}\n", user.username, i, count
        end
        #sleep(1.0/5.0)
      end
    end

    desc 'Copy user api_keys from redis to postgres'
    task :copy_api_keys_from_redis => :environment do
      count = User.count
      User.all.each_with_index do |user, i|
        begin
          user.this.update api_key: $users_metadata.HGET(user.key, 'map_key')
          raise 'No API key!!' if user.reload.api_key.blank?
          puts "(#{i+1} / #{count}) OK   #{user.username}"
        rescue => e
          puts "(#{i+1} / #{count}) FAIL #{user.username} #{e.message}"
        end
      end
    end # copy_api_keys_from_redis

    desc 'Rebuild user tables/layers join table'
    task :register_table_dependencies => :environment do
      count = Map.count

      Map.all.each_with_index do |map, i|
        begin
          map.data_layers.each do |layer| 
            layer.register_table_dependencies
            printf "OK (%-#{4}s/%-#{4}s)\n", i, count
          end
        rescue => e
          printf "FAIL (%-#{4}s/%-#{4}s) #{e}\n", i, count
        end
      end
    end

    desc 'Removes duplicated indexes created in some accounts'
    task :remove_duplicate_indexes, [:database_host, :sleep, :dryrun] => :environment do |t, args|
      threads = 1
      thread_sleep = 1
      database_host = args[:database_host].blank? ? nil : args[:database_host]
      sleep = args[:sleep].blank? ? 3 : args[:sleep].to_i
      dryrun = args[:dryrun] == 'false' ? 'false' : 'true'

      if database_host.nil?
        count = User.count
      else
        count = User.where(database_host: database_host).count
      end
      execute_on_users_with_index(:remove_duplicate_indexes.to_s, Proc.new { |user, i|
        begin
          user.in_database(:as => :superuser) do |db|
            db.transaction do
              db.run(%Q{
                CREATE OR REPLACE FUNCTION CDB_DropDupUnique(dryrun boolean DEFAULT true)
                RETURNS void
                LANGUAGE plpgsql
                VOLATILE
                AS $$
                DECLARE
                  rec RECORD;
                  sql TEXT;
                BEGIN

                  FOR rec IN SELECT
                      c.conname, r.oid tab
                    FROM
                      pg_constraint c,
                      pg_class r
                    WHERE c.conrelid > 0
                    AND c.conrelid = r.oid
                    AND c.contype = 'u'
                    AND EXISTS (
                      SELECT * FROM pg_constraint pc
                      WHERE pc.conrelid = c.conrelid -- same target table
                        AND pc.conkey = c.conkey -- samekey
                        AND pc.contype = 'p' -- index is a primary one
                    )
                  LOOP

                    IF NOT dryrun THEN
                      RAISE NOTICE 'Constraint % on table % is not needed, dropping',
                        rec.conname, rec.tab::regclass::text;
                      sql := 'ALTER TABLE ' || rec.tab::regclass::text
                          || ' DROP CONSTRAINT ' || quote_ident (rec.conname);
                      RAISE DEBUG 'Running: %', sql;
                      EXECUTE sql;
                    ELSE
                      RAISE NOTICE 'Constraint % on table % is not needed (dry run)',
                        rec.conname, rec.tab::regclass::text;
                    END IF;

                  END LOOP;

                END;
              $$;
              })
              db.run(%Q{
                SELECT CDB_DropDupUnique(#{dryrun});
              })
              db.run(%Q{
                DROP FUNCTION IF EXISTS CDB_DropDupUnique(boolean);
              })
            end
          end

          log(sprintf("OK %-#{20}s %-#{20}s (%-#{4}s/%-#{4}s)\n", user.username, user.database_name, i+1, count), :remove_duplicate_indexes.to_s, database_host)
          sleep(sleep)
        rescue => e
          log(sprintf("FAIL %-#{20}s (%-#{4}s/%-#{4}s) #{e.message}\n", user.username, i+1, count), :remove_duplicate_indexes.to_s, database_host)
          puts "FAIL:#{i} #{e.message}"
        end
      }, threads, thread_sleep, database_host)
    end

    desc 'Unregisters extraneous members from the "cartodb" extension'
    task :unregister_extraneous_cartodb_members, [:database_host, :sleep, :dryrun] => :environment do |t, args|
      threads = 1
      thread_sleep = 1
      database_host = args[:database_host].blank? ? nil : args[:database_host]
      sleep = args[:sleep].blank? ? 3 : args[:sleep].to_i
      dryrun = args[:dryrun] == 'false' ? 'false' : 'true'

      if database_host.nil?
        count = User.count
      else
        count = User.where(database_host: database_host).count
      end
      execute_on_users_with_index(:unregister_extraneous_cartodb_members.to_s, Proc.new { |user, i|
        begin
          user.in_database(:as => :superuser) do |db|
            db.transaction do
              db.run(%Q{
                CREATE OR REPLACE FUNCTION CDB_DropExtraneousExtMembers(dryrun boolean DEFAULT true)
                RETURNS void
                LANGUAGE plpgsql
                VOLATILE
                AS $$
                DECLARE
                  rec RECORD;
                  sql TEXT;
                BEGIN

                  FOR rec IN SELECT 'ALTER EXTENSION cartodb DROP '
                              || pg_describe_object(d.classid, d.objid, 0) || ';' as q
                      FROM pg_extension e LEFT OUTER JOIN pg_depend d
                      ON ( d.refobjid = e.oid )
                      WHERE d.refclassid = 'pg_catalog.pg_extension'::pg_catalog.regclass
                      AND e.extname = 'cartodb'
                      AND d.classid = 'pg_catalog.pg_class'::pg_catalog.regclass -- relations
                      AND d.objid != 'cartodb.cdb_tablemetadata'::pg_catalog.regclass
                      AND d.deptype = 'e' -- members
                  LOOP

                    IF NOT dryrun THEN
                      RAISE NOTICE 'Running on %: %', current_database(), rec.q;
                      EXECUTE rec.q;
                    ELSE
                      RAISE NOTICE 'Would run on %: %', current_database(), rec.q;
                    END IF;

                  END LOOP; 

                END;
                $$;
              })
              db.run(%Q{
                SET client_min_messages TO notice;
              })
              db.run(%Q{
                SELECT CDB_DropExtraneousExtMembers(#{dryrun});
              })
              db.run(%Q{
                DROP FUNCTION IF EXISTS CDB_DropExtraneousExtMembers(boolean);
              })
            end
          end

          log(sprintf("OK %-#{20}s %-#{20}s (%-#{4}s/%-#{4}s)\n", user.username, user.database_name, i+1, count), :unregister_extraneous_cartodb_members.to_s, database_host)
          sleep(sleep)
        rescue => e
          log(sprintf("FAIL %-#{20}s (%-#{4}s/%-#{4}s) #{e.message}\n", user.username, i+1, count), :unregister_extraneous_cartodb_members.to_s, database_host)
          puts "FAIL:#{i} #{e.message}"
        end
      }, threads, thread_sleep, database_host)
    end


    ########################
    # LOAD CARTODB FUNCTIONS
    ########################
    # e.g. bundle exec rake cartodb:db:load_functions['127.0.0.1','0.5.0']
    #      bundle exec rake cartodb:db:load_functions[,'0.5.0']
    desc 'Install/upgrade CARTODB SQL functions'
    task :load_functions, [:database_host, :version, :num_threads, :thread_sleep, :sleep, :statement_timeout] => :environment do |task_name, args|
      # Send this as string, not as number
      extension_version = args[:version].blank? ? nil : args[:version]
      database_host = args[:database_host].blank? ? nil : args[:database_host]
      threads = args[:num_threads].blank? ? 1 : args[:num_threads].to_i
      thread_sleep = args[:thread_sleep].blank? ? 0.25 : args[:thread_sleep].to_f
      sleep = args[:sleep].blank? ? 1 : args[:sleep].to_i
      statement_timeout = args[:statement_timeout].blank? ? 180000 : args[:statement_timeout]

      puts "Running extension update with following config:"
      puts "extension_version: #{extension_version.nil? ? 'UNSPECIFIED/LATEST' : extension_version}"
      puts "database_host: #{database_host.nil? ? 'ALL' : database_host}"
      puts "threads: #{threads}"
      puts "thread_sleep: #{thread_sleep}"
      puts "sleep: #{sleep}"
      puts "statement_timeout: #{statement_timeout}"

      if database_host.nil?
        count = User.count
      else
        count = User.where(database_host: database_host).count
      end
      execute_on_users_with_index(task_name, Proc.new { |user, i|
        begin
          log(sprintf("Trying on %-#{20}s %-#{20}s (%-#{4}s/%-#{4}s)...", user.username, user.database_name, i+1, count), task_name, database_host)
          user.load_cartodb_functions(statement_timeout, extension_version)
          log(sprintf("OK %-#{20}s %-#{20}s (%-#{4}s/%-#{4}s)", user.username, user.database_name, i+1, count), task_name, database_host)
          sleep(sleep)
        rescue => e
          log(sprintf("FAIL %-#{20}s (%-#{4}s/%-#{4}s) #{e.message}", user.username, i+1, count), task_name, database_host)
          puts "FAIL:#{i} #{e.message}"
        end
      }, threads, thread_sleep, database_host)
    end

    desc 'Upgrade cartodb postgresql extension'
    task :upgrade_postgres_extension, [:database_host, :version, :sleep, :statement_timeout] => :environment do |task_name, args|
      raise "Sample usage: rake cartodb:db:upgrade_postgres_extension['127.0.0.1','0.5.2']" if args[:database_host].blank? or args[:version].blank?

      # Send this as string, not as number
      extension_version = args[:version]
      database_host = args[:database_host]
      sleep = args[:sleep].blank? ? 0.5 : args[:sleep].to_i
      statement_timeout = args[:statement_timeout].blank? ? 180000 : args[:statement_timeout] # 3 min by default

      puts "Upgrading cartodb extension with following config:"
      puts "extension_version: #{extension_version}"
      puts "database_host: #{database_host}"
      puts "sleep: #{sleep}"
      puts "statement_timeout: #{statement_timeout}"

      count = User.where(database_host: database_host).count

      User.where(database_host: database_host).order(Sequel.asc(:created_at)).each_with_index do |user, i|
        begin
          # We grant 2 x statement_timeout, by default 6 min
          Timeout::timeout(statement_timeout/1000 * 2) do
            log(sprintf("Trying on %-#{20}s %-#{20}s (%-#{4}s/%-#{4}s)...", user.username, user.database_name, i+1, count), task_name, database_host)
            user.upgrade_cartodb_postgres_extension(statement_timeout, extension_version)
            log(sprintf("OK %-#{20}s %-#{20}s (%-#{4}s/%-#{4}s)", user.username, user.database_name, i+1, count), task_name, database_host)
          end
        rescue => e
          log(sprintf("FAIL %-#{20}s (%-#{4}s/%-#{4}s) #{e.message}", user.username, i+1, count), task_name, database_host)
          puts "FAIL:#{i} #{e.message}"
        end
        sleep(sleep)
      end
    end


    desc 'Install/upgrade Varnish trigger for a single user'
    task :load_varnish_trigger_user, [:username] => :environment do |t, args|
      user = User.find(username: args[:username])
      user.create_function_invalidate_varnish
    end

    desc 'Move user to its own schema'
    task :move_user_to_schema, [:username] => :environment do |t, args|
      user = User.find(username: args[:username])
      user.move_to_own_schema
      user.setup_schema
      user.save
    end

    desc 'Install/upgrade Varnish invalidation trigger'
    task :load_varnish_trigger, [:num_threads, :thread_sleep, :database_host, :sleep] => :environment do |t, args|
      threads = args[:num_threads].blank? ? 1 : args[:num_threads].to_i
      thread_sleep = args[:thread_sleep].blank? ? 0.1 : args[:thread_sleep].to_f
      database_host = args[:database_host].blank? ? nil : args[:database_host]
      sleep = args[:sleep].blank? ? 5 : args[:sleep].to_i

      if database_host.nil?
        count = User.count
      else
        count = User.where(database_host: database_host).count
      end
      execute_on_users_with_index(:load_varnish_trigger.to_s, Proc.new { |user, i|
          begin
            user.create_function_invalidate_varnish
            log(sprintf("OK %-#{20}s %-#{20}s (%-#{4}s/%-#{4}s)\n", user.username, user.database_name, i+1, count), :load_varnish_trigger.to_s, database_host)
            sleep(sleep)
          rescue => e
            log(sprintf("FAIL %-#{20}s (%-#{4}s/%-#{4}s) #{e.message}\n", user.username, i+1, count), :load_varnish_trigger.to_s, database_host)
            puts "FAIL:#{i} #{e.message}"
          end
      }, threads, thread_sleep, database_host)
    end

    ##########################################
    # SET ORGANIZATION GROUP ROLE TO ALL USERS
    ##########################################
    desc 'Set organization member group role'
    task :set_user_as_organization_member => :environment do
      User.all.each do |user|
        next if !user.respond_to?('database_name') || user.database_name.blank?
        user.set_user_as_organization_member
      end
    end
        
    ##############
    # SET DB PERMS
    ##############
    desc "Set DB Permissions"
    task :set_permissions => :environment do
      User.all.each do |user|
        next if !user.respond_to?('database_name') || user.database_name.blank?
        user.fix_permissions
      end
    end

    desc 'Set user privileges in CartoDB schema and CDB_TableMetadata'
    task :set_user_privileges_in_cartodb_schema, [:username] => :environment do |t, args|
      user = User.find(username: args[:username])
      user.set_user_privileges_in_cartodb_schema
    end

    ##########################
    # SET TRIGGER CHECK QUOTA
    ##########################
    desc 'reset check quota trigger on all user tables'
    task :reset_trigger_check_quota => :environment do |t, args|
      puts "Resetting check quota trigger for ##{User.count} users"
      User.all.each_with_index do |user, i|
        begin
          user.rebuild_quota_trigger
        rescue => exception
          puts "\nERRORED #{user.id} (#{user.username}): #{exception.message}\n"
        end
        if i % 500 == 0
          puts "\nProcessed ##{i} users"
        end
      end
    end

    desc 'reset check quota trigger for a given user'
    task :reset_trigger_check_quota_for_user, [:username] => :environment do |t, args|
      raise 'usage: rake cartodb:db:reset_trigger_check_quota_for_user[username]' if args[:username].blank?
      puts "Resetting trigger check quota for user '#{args[:username]}'"
      user  = User.filter(:username => args[:username]).first
      user.rebuild_quota_trigger
    end

    desc "set users quota to amount in mb"
    task :set_user_quota, [:username, :quota_in_mb] => :environment do |t, args|
      usage = 'usage: rake cartodb:db:set_user_quota[username,quota_in_mb]'
      raise usage if args[:username].blank? || args[:quota_in_mb].blank?

      user  = User.filter(:username => args[:username]).first
      quota = args[:quota_in_mb].to_i * 1024 * 1024
      user.update(:quota_in_bytes => quota)
      
      user.rebuild_quota_trigger
      
      puts "User: #{user.username} quota updated to: #{args[:quota_in_mb]}MB. #{user.tables.count} tables updated."
    end


    ###############
    # SET ORG QUOTA
    ###############
    desc "set organization quota to amount in GB"
    task :set_organization_quota, [:organization_name, :quota_in_gb] => :environment do |t, args|
      usage = 'usage: rake cartodb:db:set_organization_quota[organization_name,quota_in_gb]'
      raise usage if args[:organization_name].blank? || args[:quota_in_gb].blank?

      organization  = Organization.filter(:name=> args[:organization_name]).first
      quota = args[:quota_in_gb].to_i * 1024 * 1024 * 1024
      organization.quota_in_bytes = quota
      organization.save

      puts "Organization: #{organization.name} quota updated to: #{args[:quota_in_gb]}GB."
    end

    desc "set organization seats"
    task :set_organization_seats, [:organization_name, :seats] => :environment do |t, args|
      usage = 'usage: rake cartodb:db:set_organization_seats[organization_name,seats]'
      raise usage if args[:organization_name].blank? || args[:seats].blank?

      organization  = Organization.filter(:name=> args[:organization_name]).first
      seats = args[:seats].to_i
      organization.seats = seats
      organization.save

      puts "Organization: #{organization.name} seats updated to: #{args[:seats]}."
    end


    #################
    # SET TABLE QUOTA
    #################
    desc "set users table quota"
    task :set_user_table_quota, [:username, :table_quota] => :environment do |t, args|
      usage = "usage: rake cartodb:db:set_user_table_quota[username,table_quota]"
      raise usage if args[:username].blank? || args[:table_quota].blank?
      
      user  = User.filter(:username => args[:username]).first      
      user.update(:table_quota => args[:table_quota].to_i)

      puts "User: #{user.username} table quota updated to: #{args[:table_quota]}"
    end

    desc "set unlimited table quota"
    task :set_unlimited_table_quota, [:username] => :environment do |t, args|
      usage = "usage: rake cartodb:db:set_unlimited_table_quota[username]"
      raise usage if args[:username].blank?
      
      user  = User.filter(:username => args[:username]).first      
      user.update(:table_quota => nil)
                    
      puts "User: #{user.username} table quota updated to: unlimited"
    end


    desc "reset Users table quota to 5"
    task :set_all_users_to_free_table_quota => :environment do
      User.all.each do |user|
        next if !user.respond_to?('database_name') || user.database_name.blank?
        user.update(:table_quota => 5) if user.table_quota.blank?
      end
    end
    
    
    ##################
    # SET ACCOUNT TYPE
    ##################
    desc "Set users account type. DEDICATED or FREE"
    task :set_user_account_type, [:username, :account_type] => :environment do |t, args|
      usage = "usage: rake cartodb:db:set_user_account_type[username,account_type]"
      raise usage if args[:username].blank? || args[:account_type].blank?
      
      user  = User.filter(:username => args[:username]).first      
      user.update(:account_type => args[:account_type])
                    
      puts "User: #{user.username} table account type updated to: #{args[:account_type]}"
    end

    desc "reset all Users account type to FREE"
    task :set_all_users_account_type_to_free => :environment do
      User.all.each do |user|
        next if !user.respond_to?('database_name') || user.database_name.blank?
        user.update(:account_type => 'FREE') if user.account_type.blank?
      end
    end


    ##########################################
    # SET USER PRIVATE TABLES ENABLED/DISABLED
    ##########################################
    desc "set users private tables enabled"
    task :set_user_private_tables_enabled, [:username, :private_tables_enabled] => :environment do |t, args|
      usage = "usage: rake cartodb:db:set_user_private_tables_enabled[username,private_tables_enabled]"
      raise usage if args[:username].blank? || args[:private_tables_enabled].blank?
      
      user  = User.filter(:username => args[:username]).first      
      user.update(:private_tables_enabled => args[:private_tables_enabled])
                    
      puts "User: #{user.username} private tables enabled: #{args[:private_tables_enabled]}"
    end

    desc "reset all Users privacy tables permissions type to false"
    task :set_all_users_private_tables_enabled_to_false => :environment do
      User.all.each do |user|
        next if !user.respond_to?('database_name') || user.database_name.blank?
        user.update(:private_tables_enabled => false) if user.private_tables_enabled.blank?
      end
    end


    ##########################
    # REBUILD GEOM WEBMERCATOR
    ##########################    
    desc "Add the_geom_webmercator column to every table which needs it"
    task :add_the_geom_webmercator => :environment do
      User.all.each do |user|
        tables = Table.filter(:user_id => user.id).all
        next if tables.empty?
        user.load_cartodb_functions 
        puts "Updating tables in db '#{user.database_name}' (#{user.username})"
        tables.each do |table|
          has_the_geom = false
          user.in_database do |user_database|
            begin
              flatten_schema = user_database.schema(table.name.to_sym).flatten
            rescue => e
              puts " Skipping table #{table.name}: #{e}"
              next
            end
            has_the_geom = true if flatten_schema.include?(:the_geom)
            if flatten_schema.include?(:the_geom) && !flatten_schema.include?(Table::THE_GEOM_WEBMERCATOR.to_sym)
              puts " Updating table #{table.name}"
              geometry_type = if col = user_database["select GeometryType(the_geom) FROM #{table.name} limit 1"].first
                col[:geometrytype]
              end
              geometry_type ||= "POINT"
              user_database.run("SELECT public.AddGeometryColumn('#{user.database_schema}','#{table.name}','#{Table::THE_GEOM_WEBMERCATOR}',#{CartoDB::GOOGLE_SRID},'#{geometry_type}',2)")
              user_database.run("CREATE INDEX #{table.name}_#{Table::THE_GEOM_WEBMERCATOR}_idx ON #{table.name} USING GIST(#{Table::THE_GEOM_WEBMERCATOR})")                      
              user_database.run("ANALYZE #{table.name}")
              table.save_changes
            else
              puts " Skipping table #{table.name}: does not have 'the_geom' or has '#{Table::THE_GEOM_WEBMERCATOR}' already"
            end
          end
          if has_the_geom
            table.set_trigger_the_geom_webmercator
            
            user.in_database do |user_database|
              user_database.run("ALTER TABLE #{table.name} DROP CONSTRAINT IF EXISTS enforce_srid_the_geom")
              user_database.run("update #{table.name} set \"#{Table::THE_GEOM_WEBMERCATOR}\" = CDB_TransformToWebmercator(the_geom)")
              user_database.run("ALTER TABLE #{table.name} ADD CONSTRAINT enforce_srid_the_geom CHECK (st_srid(the_geom) = #{CartoDB::SRID})")
            end
          end
        end
      end
    end

    desc "Update test_quota trigger"
    task :update_test_quota_trigger => :environment do
      User.all.each do |user|
        user.rebuild_quota_trigger
      end
    end

    desc "Recreates all table triggers"
    task :recreate_table_triggers => :environment do
      User.where('organization_id IS NOT NULL').each do |user|

        if  user.cartodb_extension_version_pre_mu? || user.database_schema=='public'
          puts "SKIP: #{user.username} / #{user.id}"
        else
          schema_name = user.database_schema
          Table.filter(:user_id => user.id).each do |table|
            table_name = "#{user.database_schema}.#{table.name}"
            begin
              user.in_database do |user_db|
                user_db.run(%Q{
                  SELECT cartodb._CDB_drop_triggers('#{table_name}'::REGCLASS);
                })
                user_db.run(%Q{
                  SELECT cartodb._CDB_create_triggers('#{schema_name}'::TEXT, '#{table_name}'::REGCLASS);
                })
              end
            rescue => exception
              puts "ERROR:  #{user.username} / #{user.id} : #{table_name} #{exception}"
            end
          end
          puts "DONE: #{user.username} / #{user.id}"
        end
      end
      puts 'Finished'
    end

    desc "Update update_the_geom_webmercator_trigger"
    task :update_the_geom_webmercator_trigger => :environment do
      User.all.each do |user|
        user.load_cartodb_functions 
        
        tables = Table.filter(:user_id => user.id).all
        next if tables.empty?
        puts "Updating tables in db '#{user.database_name}' (#{user.username})"
        tables.each do |table|
          has_the_geom = false
          user.in_database do |user_database|
            begin
              has_the_geom = true if user_database.schema(table.name.to_sym).flatten.include?(:the_geom)
            rescue => e
              puts " Skipping table #{table.name}: #{e}"
              next
            end
          end
          if has_the_geom
            puts " Updating the_geom_webmercator triggers for table #{table.name}"
            table.set_trigger_the_geom_webmercator
          else
            puts " Skipping table #{table.name}: no 'the_geom' column"
          end
        end
      end
    end

    desc "update created_at and updated_at to correct type and add the default value to now"
    task :update_timestamp_fields => :environment do
      User.all.each do |user|
        next if !user.respond_to?('database_name') || user.database_name.blank?
        puts "user => " + user.username
        user.in_database do |user_database|
          user.tables.all.each do |table|
            table.normalize_timestamp_field!(:created_at, user_database)
            table.normalize_timestamp_field!(:updated_at, user_database)
          end
        end
      end
    end

    desc 'update the old cache trigger which was using redis to the varnish one'
    task :update_cache_trigger => :environment do
      User.all.each do |user|
        puts 'Update cache trigger => ' + user.username
        next if !user.respond_to?('database_name') || user.database_name.blank?
        user.in_database do |user_database|
          user.tables.all.each do |table|
            puts "\t=> #{table.name} updated"
            begin
              table.set_trigger_cache_timestamp
            rescue => e
              puts "\t=> [ERROR] #{table.name}: #{e.inspect}"
            end                
          end
        end
      end
    end

    desc 'Runs the specified CartoDB migration script'
    task :migrate_to, [:version] => :environment do |t, args|
      usage = 'usage: rake cartodb:db:migrate_to[version]'
      raise usage if args[:version].blank?
      require Rails.root.join 'lib/cartodb/generic_migrator.rb'

      CartoDB::GenericMigrator.new(args[:version]).migrate!
    end
    
    desc 'Undo migration changes USE WITH CARE'
    task :rollback_migration, [:version] => :environment do |t, args|
      usage = 'usage: rake cartodb:db:rollback_migration[version]'
      raise usage if args[:version].blank?
      require Rails.root.join 'lib/cartodb/generic_migrator.rb'

      CartoDB::GenericMigrator.new(args[:version]).rollback!
    end
    
    desc 'Save users metadata in redis'
    task :save_users_metadata => :environment do
      User.all.each do |u|
        u.save_metadata
      end
    end

    desc 'Create public users for users beloging to an organization'
    task :create_organization_members_public_users => :environment do
      User.exclude(organization_id: nil).each do |user|
        begin
          user.create_public_db_user
          user.save_metadata
        rescue
          puts "user #{user.username} already has the public user"
        end
      end
    end

    desc 'Setup default permissions on existing visualizations'
    task :create_default_vis_permissions, [:page_size, :page] => :environment do |t, args|
      page_size = args[:page_size].blank? ? 999999 : args[:page_size].to_i
      page = args[:page].blank? ? 1 : args[:page].to_i

      require_relative '../../app/models/visualization/collection'

      progress_each =  (page_size > 10) ? (page_size / 10).ceil : 1
      collection = CartoDB::Visualization::Collection.new

      begin
        items = collection.fetch(page: page, per_page: page_size)

        count = items.count
        puts "\n>Running :create_default_vis_permissions for page #{page} (#{count} vis)" if count > 0
        items.each_with_index { |vis, i|
          puts ">Processed: #{i}/#{count} - page #{page}" if i % progress_each == 0
          if vis.permission_id.nil?
            begin
              raise 'No owner' if vis.user.nil?
              # Just saving will trigger the permission creation
              vis.send(:do_store, false)
              puts "OK #{vis.id}"
            rescue => e
              owner_id = vis.user.nil? ? 'nil' : vis.user.id
              message = "FAIL u:#{owner_id} v:#{vis.id}: #{e.message}"
              puts message
              log(message, :create_default_vis_permissions.to_s)
            end
          end
        }
        page += 1
      end while count > 0

      puts "\n>Finished :create_default_vis_permissions"
    end

    desc "Check all visualizations and populate their Permission object's entity_id and entity_type"
    task :populate_permission_entity_id, [:page_size, :page] => :environment do |t, args|
      page_size = args[:page_size].blank? ? 999999 : args[:page_size].to_i
      page = args[:page].blank? ? 1 : args[:page].to_i

      require_relative '../../app/models/visualization/collection'

      progress_each =  (page_size > 10) ? (page_size / 10).ceil : 1
      collection = CartoDB::Visualization::Collection.new


      begin
        items = collection.fetch(page: page, per_page: page_size)

        count = items.count
        puts "\n>Running :populate_permission_entity_id for page #{page} (#{count} vis)" if count > 0
        items.each_with_index { |vis, i|
          puts ">Processed: #{i}/#{count} - page #{page}" if i % progress_each == 0
          unless vis.permission_id.nil?
            begin
              raise 'No owner' if vis.user.nil?
              if vis.permission.entity_id.nil?
                perm = vis.permission
                perm.entity = vis
                perm.save
              end
            rescue => e
              owner_id = vis.user.nil? ? 'nil' : vis.user.id
              message = "FAIL u:#{owner_id} v:#{vis.id}: #{e.message}"
              puts message
              log(message, :populate_permission_entity_id.to_s)
            end
          end
        }
        page += 1
      end while count > 0

      puts "\n>Finished :populate_permission_entity_id"
    end

    # Executes a ruby code proc/block on all existing users, outputting some info
    # @param task_name string
    # @param block Proc
    # @example:
    # execute_on_users_with_index(:populate_new_fields.to_s, Proc.new { |user, i| ... })
    def execute_on_users_with_index(task_name, block, num_threads=1, sleep_time=0.1, database_host=nil)
      if database_host.nil?
        count = User.count
      else
        count = User.where(database_host: database_host).count
      end

      start_message = ">Running #{task_name} for #{count} users"
      puts start_message
      log(start_message, task_name, database_host)
      if database_host.nil?
        puts "Detailed log stored at log/rake_db_maintenance_#{task_name}.log"
      else
        puts "Detailed log stored at log/rake_db_maintenance_#{task_name}_#{database_host}.log"
      end

      thread_pool = ThreadPool.new(num_threads, sleep_time)

      if database_host.nil?
        User.order(Sequel.asc(:created_at)).each_with_index do |user, i|
          thread_pool.schedule do
            if i % 100 == 0
              puts "PROGRESS: #{i}/#{count} users queued"
            end
            block.call(user, i)
          end
        end
      else
        User.where(database_host: database_host).order(Sequel.asc(:created_at)).each_with_index do |user, i|
          thread_pool.schedule do
            if i % 100 == 0
              puts "PROGRESS: #{i}/#{count} users queued"
            end
            block.call(user, i)
          end
        end
      end

      at_exit { thread_pool.shutdown }

      puts "PROGRESS: #{count}/#{count} users queued"
      end_message = "\n>Finished #{task_name}\n"
      puts end_message
      log(end_message, task_name, database_host)
    end

    def log(entry, task_name, filename_suffix='')
      if filename_suffix.nil? || filename_suffix.empty?
        log_path = Rails.root.join('log', "rake_db_maintenance_#{task_name}.log")
      else
        log_path = Rails.root.join('log', "rake_db_maintenance_#{task_name}_#{filename_suffix}.log")
      end
      File.open(log_path, 'a') do |file_handle|
	      file_handle.puts "[#{Time.now}] #{entry}\n"
      end
    end

    desc 'Load api calls from ES to redis'
    task :load_api_calls_from_es => :environment do
      raise "You should provide a valid username" if ENV['USERNAME'].blank?
      u = User.where(:username => ENV['USERNAME']).first
      puts "Old API Calls from ES: #{u.get_es_api_calls_from_redis}"
      u.set_api_calls_from_es({:force_update => true})
      puts "New API Calls from ES: #{u.get_es_api_calls_from_redis}"
    end
    
    desc "Create new organization with owner"
    task :create_new_organization_with_owner => :environment do
      raise "You should provide a ORGANIZATION_NAME" if ENV['ORGANIZATION_NAME'].blank?
      raise "You should provide a ORGANIZATION_DISPLAY_NAME" if ENV['ORGANIZATION_DISPLAY_NAME'].blank?
      raise "You should provide a ORGANIZATION_SEATS" if ENV['ORGANIZATION_SEATS'].blank?
      raise "You should provide a ORGANIZATION_QUOTA (in Bytes)" if ENV['ORGANIZATION_QUOTA'].blank?
      raise "You should provide a USERNAME" if ENV['USERNAME'].blank?
      user = User.where(:username => ENV['USERNAME']).first
      raise "User #{ENV['USERNAME']} does not exist" if user.nil?
      organization = Organization.where(:name => ENV['ORGANIZATION_NAME']).first
      if organization.nil?
        organization = Organization.new
        organization.name = ENV['ORGANIZATION_NAME']
        organization.display_name = ENV['ORGANIZATION_DISPLAY_NAME']
        organization.seats = ENV['ORGANIZATION_SEATS']
        organization.quota_in_bytes = ENV['ORGANIZATION_QUOTA']
        organization.save
      end
      uo = CartoDB::UserOrganization.new(organization.id, user.id)
      uo.promote_user_to_admin
    end

    desc "Reload users avatars"
    task :reload_users_avatars => :environment do
      if ENV['ONLY_GRAVATAR'].blank?
        users = User.all
      else
        users = User.where(Sequel.like(:avatar_url, '%gravatar.com%'))
      end
      count = users.count
      users.each_with_index do |user, i|
        begin
          user.reload_avatar
          message = "OK %-#{20}s (%-#{4}s/%-#{4}s)\n" % [user.username, i, count]
          print message
          log(message, :reload_users_avatars.to_s)
        rescue => e
          message = "FAIL %-#{20}s (%-#{4}s/%-#{4}s) #{e.message}\n" % [user.username, i, count]
          print message
          log(message, :reload_users_avatars.to_s)
        end
      end
    end

    desc "Grant general raster permissions"
      task :grant_general_raster_permissions => :environment do
        users = User.all
        count = users.count
        users.each_with_index do |user, i|
          begin
            user.set_raster_privileges
            message = "OK %-#{20}s (%-#{4}s/%-#{4}s)\n" % [user.username, i, count]
            print message
            log(message, :grant_general_raster_permissions.to_s)
          rescue => e
            message = "FAIL %-#{20}s (%-#{4}s/%-#{4}s) MSG:#{e.message}\n" % [user.username, i, count]
            print message
            log(message, :grant_general_raster_permissions.to_s)
          end
      end
    end

    desc "Enable oracle_fdw extension in database"
    task :enable_oracle_fdw_extension, [:username, :oracle_url, :remote_user, :remote_password, :remote_schema, :table_definition_json_path] => :environment do |t, args|
      u = User.where(:username => args[:username].to_s).first
      tables = JSON.parse(File.read(args['table_definition_json_path'].to_s))
      u.in_database({as: :superuser, no_cartodb_in_schema: true}) do |db|
        db.transaction do
          server_name = "oracle_#{args[:oracle_url].sanitize}_#{Time.now.to_i}"
          db.run('CREATE EXTENSION oracle_fdw') unless db.fetch(%Q{
              SELECT count(*) FROM pg_extension WHERE extname='oracle_fdw'
          }).first[:count] > 0
          db.run("CREATE SERVER #{server_name} FOREIGN DATA WRAPPER oracle_fdw OPTIONS (dbserver '#{args[:oracle_url].to_s}')")
          db.run("GRANT USAGE ON FOREIGN SERVER #{server_name} TO \"#{u.database_username}\"")
          db.run("CREATE USER MAPPING FOR \"#{u.database_username}\" SERVER #{server_name} OPTIONS (user '#{args[:remote_user].to_s}', password '#{args[:remote_password].to_s}');")
          db.run("CREATE USER MAPPING FOR \"publicuser\" SERVER #{server_name} OPTIONS (user '#{args[:remote_user].to_s}', password '#{args[:remote_password].to_s}');")
          tables["tables"].each do |table_name, th|
            table_readonly = th["read_only"] ? "true" : "false"
            table_columns = th["columns"].map {|name,attrs| "#{name} #{attrs['column_type']}"}
            db.run("CREATE FOREIGN TABLE #{table_name} (#{table_columns.join(', ')}) SERVER #{server_name} OPTIONS (schema '#{args[:remote_schema]}', table '#{th["remote_table"]}', readonly '#{table_readonly}')")
            db.run("GRANT SELECT ON #{table_name} TO \"#{u.database_username}\"")
            db.run("GRANT SELECT ON #{table_name} TO \"#{CartoDB::PUBLIC_DB_USER}\"")
          end
        end
      end
    end

  end
end

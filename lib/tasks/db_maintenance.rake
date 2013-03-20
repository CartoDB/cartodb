namespace :cartodb do
  namespace :db do

    ########################
    # LOAD CARTODB FUNCTIONS
    ########################
    desc "Install/upgrade CARTODB SQL functions"
    task :load_functions => :environment do
      count = User.count
      User.all.each_with_index do |user, i|
        begin
          user.load_cartodb_functions
          user.in_database(:as => :superuser).run("DROP FUNCTION IF EXISTS check_quota() CASCADE;")
          user.tables.all.each do |table|
            begin
              table.add_python
              table.set_trigger_check_quota
              table.set_trigger_update_updated_at
              table.set_trigger_cache_timestamp
            rescue => e
              puts e
              next
            end
          end
          printf "OK %-#{20}s (%-#{4}s/%-#{4}s)\n", user.username, i, count
        rescue => e
          printf "FAIL %-#{20}s (%-#{4}s/%-#{4}s) #{e.message}\n", user.username, i, count
        end
        sleep(1.0/5.0)
      end
    end

    ############################
    # RUN CARTODB FUNCTION TESTS
    # cartodb:db:test_functions
    ############################
    desc "Run CARTODB SQL functions tests"
    task :test_functions => :environment do
      User.all.each do |user|
        next if !user.respond_to?('database_name') || user.database_name.blank?
        
        user.test_cartodb_functions
        sleep(1.0/4.0)
      end
    end
        
    ##############
    # SET DB PERMS
    ##############
    desc "Set DB Permissions"
    task :set_permissions => :environment do
      User.all.each do |user|
        next if !user.respond_to?('database_name') || user.database_name.blank?

        # reset perms
        user.set_database_permissions

        # rebuild public access perms from redis
        user.tables.all.each do |table|
          
          # reset public
          if table.public?
            user.in_database(:as => :superuser).run("GRANT SELECT ON #{table.name} TO #{CartoDB::PUBLIC_DB_USER};")
          end
          
          # reset triggers
          table.add_python
          table.set_trigger_update_updated_at
          table.set_trigger_cache_timestamp
          table.set_trigger_check_quota
        end  
      end
    end

    ##########################
    # SET TRIGGER CHECK QUOTA
    ##########################
    desc "reset check quota trigger on all user tables"
    task :reset_trigger_check_quota => :environment do
      count = User.count
      User.all.each_with_index do |user, i|
        # rebuild quota trigger
        user.tables.all.each do |table|
          begin
            table.add_python
            table.set_trigger_check_quota
            puts "OK #{user.username} => #{table.name}"
          rescue => e
            puts "FAIL #{user.username} => #{table.name} #{e.message}"
          end
        end
      end
    end

    desc "set users quota to amount in mb"
    task :set_user_quota, [:username, :quota_in_mb] => :environment do |t, args|
      usage = "usage: rake cartodb:db:set_user_quota[username,quota_in_mb]"
      raise usage if args[:username].blank? || args[:quota_in_mb].blank?
      
      user  = User.filter(:username => args[:username]).first
      quota = args[:quota_in_mb].to_i * 1024 * 1024
      user.update(:quota_in_bytes => quota)
              
      # rebuild quota trigger
      user.tables.all.each do |table|
      
        # reset quota trigger
        table.add_python
        table.set_trigger_check_quota
      end  
      
      puts "User: #{user.username} quota updated to: #{args[:quota_in_mb]}MB. #{user.tables.count} tables updated."
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
              user_database.run("SELECT AddGeometryColumn('#{table.name}','#{Table::THE_GEOM_WEBMERCATOR}',#{CartoDB::GOOGLE_SRID},'#{geometry_type}',2)")
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

    desc "update the old cache trigger which was using redis to the varnish one"
    task :update_cache_trigger => :environment do
      User.all.each do |user|
        puts "Update cache trigger => " + user.username
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
  end
end

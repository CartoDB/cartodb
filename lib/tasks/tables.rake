namespace :cartodb do
  namespace :db do

    desc "Add timezone to timestamp users columns"
    task :add_timezones_to_timestamps => :environment do
      users_length = ::User.all.length
      cu = 1
      task_errors = []
      ::User.all.each do |u|
        puts "#{u.username} (#{cu}/#{users_length})"
        user_tables = u.real_tables.collect {|rt| rt[:relname]}
        user_tables.each do |ut|
          table_columns = u.in_database.schema(ut)
          pending_columns = table_columns.select do |t|
            t.first == :updated_at || t.first == :created_at
          end
          pending_columns = pending_columns.map do |pc|
            pc.first.to_s if pc.last[:db_type] == "timestamp without time zone"
          end.compact
          if !pending_columns.empty?
            alter_columns_sql = pending_columns.map {|c| "ALTER COLUMN #{c} TYPE timestamptz"}.join(', ')
            alter_sql = "ALTER TABLE #{ut} #{alter_columns_sql};"
            #puts alter_sql
            begin
              u.in_database.run(alter_sql)
            rescue StandardError => e
              puts "FAIL in #{alter_sql}"
              puts "REASON: #{e.message}"
              task_errors << {:user => u.username, :alter => alter_sql, :error => e.message}
            end
          end
        end
        cu = cu + 1
      end
      if task_errors.empty?
        puts "All changes succeded"
      else
        puts "Some fails during the process"
        task_errors.each do |value|
          puts "User:  #{value[:user]}"
          puts "Task:  #{value[:alter]}"
          puts "Error: #{value[:error]}"
          puts ""
        end
      end
    end

    desc "Unshare all entities for a given user"
    task :unshare_all_entities, [:user] => :environment do |t, args|
      # First unshare everything owned by the user itself
      user = ::User.find(username: args[:user])
      Carto::Permission.find_each(owner_id: user.id) do |permission|
        unless permission.acl.empty?
          puts "Deleting permission: #{permission.acl}"
          permission.acl = []
          permission.save
        end
      end

      # Then, remove permissions of everything they have access to
      Carto::SharedEntity.where(recipient_id: user.id).find_each do |shared_entity|
        Carto::Permission.find_each(entity_id: shared_entity.entity_id) do |permission|
          acl = permission.acl
          puts "Dropping permission from: #{permission.acl}"
          acl.reject!{|acl_entry| acl_entry[:type] == 'user' && acl_entry[:id] == user.id}
          # Hack to make ACLs be set correctly (input format for permission.acl= is different than permission.acl output)
          acl.map!{|acl_entry| acl_entry[:entity] = {id: acl_entry[:id]}; acl_entry.delete(:id); acl_entry }
          permission.acl = acl
          permission.save
        end
      end
    end

    desc "Remove overview tables"
    task :remove_overview_tables => :environment do
      users_length = ::User.count
      cu = 1
      task_errors = []
      ::User.paged_each do |u|
        puts "#{u.username} (#{cu}/#{users_length})"
        user_tables = u.real_tables.map { |rt| rt[:relname] }
        user_tables.each do |ut|
          next if ut.start_with?("_vovw_")
          drop_overviews_sql = "select CDB_DropOverviews('#{ut}'::regclass)"
          # puts drop_overviews_sql
          begin
            u.in_database.run(drop_overviews_sql)
          rescue PG::Error => e
            puts "FAIL in #{drop_overviews_sql}"
            puts "REASON: #{e.message}"
            task_errors << { :user => u.username, :drop => drop_overviews_sql, :error => e.message }
          end
        end
        cu = cu + 1
      end
      if task_errors.empty?
        puts "All changes succeded"
      else
        puts "Some fails during the process"
        task_errors.each do |value|
          puts "User:  #{value[:user]}"
          puts "Task:  #{value[:drop]}"
          puts "Error: #{value[:error]}"
          puts ""
        end
      end
    end
  end
end

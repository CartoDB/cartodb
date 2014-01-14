namespace :cartodb do
  namespace :db do

    desc "Add timezone to timestamp users columns"
    task :add_timezones_to_timestamps => :environment do
      users_length = User.all.length
      cu = 1
      task_errors = []
      User.all.each do |u|
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
            rescue => e
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
  
  end
end

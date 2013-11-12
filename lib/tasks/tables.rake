namespace :cartodb do
  namespace :db do

    desc "Add timezone to timestamp users columns"
    task :add_timezones_to_timestamps => :environment do
      users_length = User.all.length
      cu = 1
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
            u.in_database.run(alter_sql)
          end
        end
        cu = cu + 1
      end
    end
  
  end
end

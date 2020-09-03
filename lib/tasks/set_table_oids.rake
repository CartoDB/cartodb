namespace :cartodb do
  namespace :db do
    desc 'Sets table_ids for all table metadata recors'
    task :set_table_oids => :environment do
      count = ::User.count
      ::User.all.each_with_index do |user, index|
        puts "Setting table oids for #{user.username}"
        begin
          if %w(development staging).include?(ENV['RAILS_ENV'])
            entries_in_database = Hash[
              user.in_database.fetch(%Q(
                SELECT table_name AS name, table_name::regclass::oid AS oid
                FROM information_schema.tables
                WHERE table_type  = 'BASE TABLE'
                AND table_catalog = 'cartodb_#{ENV['RAILS_ENV']}_user_#{user.id}_db'
                AND table_schema  = 'public';
              )).all.map { |row| [row.fetch(:name), row.fetch(:oid)] }
            ]
          else
            entries_in_database = Hash[
              user.in_database.fetch(%Q(
                SELECT table_name AS name, table_name::regclass::oid AS oid
                FROM information_schema.tables
                WHERE table_type  = 'BASE TABLE'
                AND table_catalog = 'cartodb_user_#{user.id}_db'
                AND table_schema  = 'public';
              )).all.map { |row| [row.fetch(:name), row.fetch(:oid)] }
            ]
          end

          raise 'No tables found!!!!' if entries_in_database.empty?
          entries_in_metadata = Hash[
            Table.fetch(%Q(
              SELECT name, table_id
              FROM user_tables
              WHERE user_id = #{user.id}
            )).map { |table| [table.name, table.table_id] }
          ]
          entries_in_metadata
            .select { |name, oid| entries_in_database[name] != oid }
            .each { |name_in_metadata, oid_in_metadata|
              oid = entries_in_database[name_in_metadata]
              next if oid.nil? || oid.to_s.empty?
              puts "Setting table oid for #{name_in_metadata}"
              Table.db.run(%Q(
                UPDATE user_tables
                SET table_id = #{oid}
                WHERE name = '#{name_in_metadata}'
                AND user_id = #{user.id}
              ))
            }
          entries_in_database_by_oid = entries_in_database
                                        .invert.delete_if { |k, v| k.nil? }
          entries_in_metadata_by_oid = entries_in_metadata
                                        .invert.delete_if { |k, v| k.nil? }
          entries_in_metadata_by_oid
            .select { |oid, name| entries_in_database_by_oid[oid] != name }
            .each { |oid, name|
              name_in_database = entries_in_database_by_oid[oid]
              next unless name_in_database && name
              puts "Renaming #{name} to #{name_in_database}"
              table = Table.find_by_identifier(user.id, name)
              table.name = name_in_database
              table.save
            }

          printf "OK %-#{20}s (%-#{4}s/%-#{4}s)\n", user.username, index, count
        rescue StandardError => exception
          puts exception.backtrace.join("\n")
          printf "FAIL %-#{20}s (%-#{4}s/%-#{4}s) #{exception.message}\n", user.username, index, count
        end
        sleep(1.0/5.0)
      end
    end
  end
end

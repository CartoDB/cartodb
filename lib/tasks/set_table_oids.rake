# encoding: utf-8
namespace :cartodb do
  namespace :db do
    desc 'Sets table_ids for all table metadata recors'
    task :set_table_oids => :environment do
      count = User.count
      User.all.each_with_index do |user, index|
        puts "Setting table oids for #{user.username}"
        begin
          database_entries = Hash[
            user.in_database.fetch(%Q(
              SELECT table_name AS name, table_name::regclass::oid AS oid
              FROM information_schema.tables
              WHERE table_type  = 'BASE TABLE'
              AND table_catalog = 'cartodb_dev_user_1_db'
              AND table_schema  = 'public';
            )).all.map { |row| [row.fetch(:name), row.fetch(:oid)] }
          ]
          puts database_entries.inspect
          metadata_entries = Hash[
            Table.fetch(%Q(
              SELECT name, table_id
              FROM user_tables
              WHERE user_id = #{user.id}
            )).map { |table| [table.name, table.table_id] }
          ]
          puts metadata_entries.inspect
          metadata_entries
            .select { |name, oid| database_entries[name] != oid }
            .each { |metadata_name, metadata_oid|
              oid = database_entries[metadata_name]
              next if oid.nil? || oid.to_s.empty?
              puts "Setting table oid for #{metadata_name}"
              Table.db.run(%Q(
                UPDATE user_tables
                SET table_id = #{oid}
                WHERE name = '#{metadata_name}'
              )) 
            }
          database_entries_by_oid = database_entries
                                      .invert.delete_if { |k, v| k.nil? }
          metadata_entries_by_oid = metadata_entries
                                      .invert.delete_if { |k, v| k.nil? }
          metadata_entries_by_oid
            .select { |oid, name| database_entries_by_oid[oid] != name }
            .each { |oid, name|
              database_name = database_entries_by_oid[oid]
              next unless database_name && name
              puts "Renaming #{database_name} to #{name}"
              user.in_database.run(%Q(
                ALTER TABLE "#{database_name}"
                RENAME TO "#{name}"
              ))
            }

          printf "OK %-#{20}s (%-#{4}s/%-#{4}s)\n", user.username, index, count
        rescue => exception
          puts exception.backtrace.join("\n")
          printf "FAIL %-#{20}s (%-#{4}s/%-#{4}s) #{exception.message}\n", user.username, index, count
        end
        sleep(1.0/5.0)
      end
    end
  end
end

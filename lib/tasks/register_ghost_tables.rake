# encoding: utf-8
namespace :cartodb do

  namespace :db do
    desc 'Register ghost tables in metadata'
    task :register_ghost_tables => :environment do
      block = lambda { false }
      User.send(:define_method, :over_table_quota?, block)

      count = User.count
      def register_table(user, name)
        @table_name = name
        table = Table.new
        table.user_id = user.id
        table.migrate_existing_table = @table_name
        table.save
        puts "------ #{table.name} registered for user #{user.username}"
      rescue
        puts "------ Error registering #{table.name} for user #{user.username}"
        @errors = @errors + 1
      end

      User.all.each_with_index do |user, index|
        puts "Registering ghost tables for #{user.username}"
        begin
          table_names_in_database = user.in_database.fetch(%Q(
            SELECT table_name FROM information_schema.tables
            AS table_name
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            AND table_name NOT IN (
              'cdb_tablemetadata', 'spatial_ref_sys', 'cdb_functionmetadata'
            )
          )).map { |record| record.fetch(:table_name) }

          table_names_in_metadata = user.tables.map(&:name)

          ghost_tables = table_names_in_database - table_names_in_metadata

          @errors = 0
          ghost_tables.map { |name|
            puts "***** Registering #{name}"
	          register_table(user, name)
          }
          raise "------ Couldn't register #{@errors} tables" if @errors > 0
          printf "OK %-#{20}s (%-#{4}s/%-#{4}s)\n", user.username, index, count
        rescue => exception
          printf "FAIL %-#{20}s (%-#{4}s/%-#{4}s) #{exception.message}\n", user.username, index, count
        end
        sleep(1.0/5.0)
      end
    end
  end
end

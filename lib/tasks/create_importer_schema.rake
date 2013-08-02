# encoding: utf-8
namespace :cartodb do
  namespace :db do
    desc 'Create importer schema and assign privileges to owner'
    task :create_importer_schema => :environment do
      def needs_importer_schema?(user)
        !user.in_database[%Q(SELECT * FROM pg_namespace)]
          .map { |record| record.fetch(:nspname) }
          .include?('cdb_importer')
      rescue => exception
        false
      end #needs_importer_schema?

      count = User.count
      User.all
        .select { |user| needs_importer_schema?(user) }
        .each_with_index { |user, index|
          begin
            puts "Creating cdb_importer schema for #{user.username}"
            user.create_importer_schema
            user.set_database_permissions_in_importer_schema
            printf "OK %-#{20}s (%-#{4}s/%-#{4}s)\n", user.username, index, count
          rescue => exception
            printf "FAIL %-#{20}s (%-#{4}s/%-#{4}s) #{exception.message}\n", user.username, index, count
          end
          sleep(1.0/5.0)
        }
    end
  end
end
  

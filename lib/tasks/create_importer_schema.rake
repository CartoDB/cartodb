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

      User.all
        .select { |user| needs_importer_schema?(user) }
        .each { |user|
          puts "Creating cdb_importer schema for #{user.inspect}"
          user.create_importer_schema
          user.set_database_permissions_in_importer_schema
        }
    end
  end
end
  

# encoding: utf-8
namespace :db do
  desc 'Create importer schema and assign privileges to owner'
  task :create_importer_schema => :environment do
    def needs_importer_schema?(user)
      !user.in_database[%Q(SELECT * FROM pg_namespace)]
        .map { |record| record.fetch(:nspname) }
        .include?('importer')
    rescue => exception
      false
    end #importer_schema_exists?

    User.all
      .select { |user| needs_importer_schema?(user) }
      .each { |user|
        puts user.inspect
        user.create_importer_schema
        user.set_database_permissions
      }
  end
end
  

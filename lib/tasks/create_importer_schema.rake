namespace :cartodb do
  namespace :db do
    desc 'Create importer schema and assign privileges to owner'
    task :create_importer_schema => :environment do
      count = ::User.count
      ::User.all.each_with_index do |user, index|
        begin
          puts "Creating importer schema for #{user.username}"
          user.db_service.create_importer_schema
          user.db_service.set_user_privileges_in_importer_schema
          printf "OK %-#{20}s (%-#{4}s/%-#{4}s)\n", user.username, index, count
        rescue StandardError => exception
          printf "FAIL %-#{20}s (%-#{4}s/%-#{4}s) #{exception.message}\n", user.username, index, count
        end
        sleep(1.0/5.0)
      end

    end
  end
end

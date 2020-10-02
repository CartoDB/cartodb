namespace :cartodb do
  namespace :db do
    desc 'Create importer schema and assign privileges to owner'
    task create_importer_schema: :environment do
      count = ::User.count
      ::User.all.each_with_index do |user, index|
        begin
          puts "Creating importer schema for #{user.username}"
          user.db_service.create_importer_schema
          user.db_service.set_user_privileges_in_importer_schema
          printf "OK %-20s (%-4s/%-4s)\n", user.username, index, count
        rescue StandardError => e
          printf "FAIL %-20s (%-4s/%-4s) #{e.message}\n", user.username, index, count
        end
        sleep(1.0 / 5.0)
      end
    end
  end
end

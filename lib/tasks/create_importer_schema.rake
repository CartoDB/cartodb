# encoding: utf-8
namespace :cartodb do
  namespace :db do
    desc 'Create cartodb schemas and assign privileges to owner'
    task :create_schemas => :environment do

      count = User.count
      User.all.each_with_index do |user, index|
        begin
          puts "Creating database schemas for #{user.username}"
          user.create_schemas_and_set_permissions
          printf "OK %-#{20}s (%-#{4}s/%-#{4}s)\n", user.username, index, count
        rescue => exception
          printf "FAIL %-#{20}s (%-#{4}s/%-#{4}s) #{exception.message}\n", user.username, index, count
        end
        sleep(1.0/5.0)
      end

    end
  end
end

#encoding: utf-8

namespace :user do
  desc 'Add all the notifications to the users'
  task :add_notifications => [:environment] do
    number_of_users = 0
    Carto::User.select(:id).find_each do |user|
      User.db.execute(%Q[INSERT INTO user_notifications (user_id) VALUES ('#{user.id}')])
      number_of_users += 1
      puts "Migrated #{number_of_users} users by now" if (number_of_users % 10000 == 0)
    end
    puts "End of the migration. All the users has notifications now"
  end
end


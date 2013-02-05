namespace :cartodb do
  namespace :users do

    desc "Update map calls for each user"
    task :update_map_calls => :environment do
      User.all.each do |user|
        begin
          user.set_map_calls(force_update: true)
          puts "#{user.username} => OK"
        rescue => e
          puts "#{user.username} => KO #{e.message}"
        end
      end
    end

  end
end

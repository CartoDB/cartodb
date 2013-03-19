namespace :cartodb do
  namespace :users do

    desc "Update map calls for each user"
    task :update_map_calls => :environment do
      count = User.count
      User.all.each_with_index do |user, i|
        begin
          user.set_api_calls(force_update: true)
          puts "#{user.username} (#{i+1}/#{count}) => OK"
        rescue => e
          puts "#{user.username} (#{i+1}/#{count}) => KO #{e.message}"
        end
      end
    end

  end
end

namespace :cartodb do
  namespace :redis do
    desc "update redis with metadata for every user"
    task :user_metadata => :environment do
      User.all.each do |user|
        puts user.key
        user.save_metadata
      end
    end
  end
end
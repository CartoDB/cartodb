namespace :cartodb do
  namespace :redis do
    desc "update redis with metadata for every user"
    task :user_metadata => :environment do
      User.all.each do |user|
        user.save_metadata
      end
    end

    desc "purge redis vizjson cache"
    task :purge_vizjson => :environment do
      User.each do |user|
        user.purge_redis_vizjson_cache
      end
    end
  end
end

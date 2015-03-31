namespace :cartodb do
  namespace :redis do
    desc "update redis with metadata for every user"
    task :user_metadata => :environment do
      User.all.each do |user|
        user.save_metadata
      end
    end

    desc "purge vizjson redis cache"
    task :purge_vizjson => :environment do
      User.each do |user|
        collection = CartoDB::Visualization::Collection.new.fetch({user_id: user.id})
        collection.each do |visualization|
          visualization.invalidate_redis_cache
        end
      end
    end
  end
end

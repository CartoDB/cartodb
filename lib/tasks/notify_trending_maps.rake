namespace :cartodb do
  namespace :trending_maps do

    desc "Search for yesterday's trending maps to notify"
    task :notify, [:simulation] => :environment do |t,args|
      simulation = (args[:simulation] == false) ? false : true

      trending_maps = CartoDB::TrendingMaps.new.get_trending_maps

      trending_maps.each do |visualization_id,total_mapviews|
        puts "Notifying trending map #{visualization_id} with a total of #{total_mapviews} mapviews"
        ::Resque.enqueue(::Resque::UserJobs::Maps::NotifyTrendingMap, visualization_id, total_mapviews) unless simulation
      end
    end

  end
end

require_relative '../../lib/cartodb/trending_maps'
require_relative '../../lib/static_maps_url_helper'

namespace :cartodb do
  namespace :trending_maps do
    desc "Search for yesterday's trending maps to notify"
    task :notify, [:simulation] => :environment do |_task, args|
      simulation = (args[:simulation] == 'true') ? true : false

      puts "SIMULATION MODE!" if simulation
      trending_maps_lib = CartoDB::TrendingMaps.new
      trending_maps = trending_maps_lib.get_trending_maps

      trending_maps.each do |visualization_id, data|
        views = data[:mapviews]

        puts "Notifying trending map #{visualization_id} with a total of #{views} mapviews"
        visualization = Carto::Visualization.find(visualization_id)
        preview_image = Carto::StaticMapsURLHelper.new.url_for_static_map_without_request(data[:user],
                                                                                          'http',
                                                                                          visualization,
                                                                                          600,
                                                                                          300)
        unless simulation
          trending_maps_lib.notify_trending_map(visualization_id, views, preview_image)

          user_id = visualization.user.id
          Carto::Tracking::Events::ScoredTrendingMap.new(user_id,
                                                         user_id: user_id,
                                                         visualization_id: visualization.id,
                                                         mapviews: views).report
        end
      end

      trending_maps_lib.send_trending_map_report(trending_maps) unless simulation
    end

  end
end

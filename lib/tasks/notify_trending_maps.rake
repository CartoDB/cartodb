require_relative '../../lib/cartodb/trending_maps'
require_relative '../../lib/static_maps_url_helper'

namespace :cartodb do
  namespace :trending_maps do

    desc "Search for yesterday's trending maps to notify"
    task :notify, [:simulation] => :environment do |t,args|
      simulation = (args[:simulation] == 'true') ? true : false
      puts "SIMULATION MODE!" if simulation
      trending_maps_lib = CartoDB::TrendingMaps.new
      trending_maps = trending_maps_lib.get_trending_maps

      trending_maps.each do |visualization_id,data|
        puts "Notifying trending map #{visualization_id} with a total of #{data[:mapviews]} mapviews"
        visualization = CartoDB::Visualization::Member.new(id: visualization_id)
        preview_image = Carto::StaticMapsURLHelper.new.url_for_static_map_without_request(data[:user], 'http' , visualization, 600, 300)
        trending_maps_lib.notify_trending_map(visualization_id, data[:mapviews], preview_image) unless simulation

        event_properties = { map_id: visualization.id, map_name: visualization.fetch.name, mapviews: data[:mapviews] }
        Cartodb::EventTracker.new.send_event(visualization.fetch.user, 'Scored trending map', event_properties) unless simulation
      end

      trending_maps_lib.send_trending_map_report(trending_maps) unless simulation
    end

  end
end

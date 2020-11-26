require './lib/carto/user_creator'
require './lib/carto/user_updater'

module Carto
  module Subscribers
    class MapViewsUpdate

      include ::LoggerHelper

      def initialize()
      end

      def update_map_views(map_views_data)
        log_debug(message: 'Processing :update_map_views')
        log_debug(map_views_data)

        date = map_views_data[:date]
        users_data = map_views[:data]

        users_data.each do |user_data|
          user_id = user_data[:user_id]
          map_views = user_data[:map_views]
          log_debug("TODO: Update user #{user_id} -> #{map_views} (#{date})")
        end
      end
    end
  end
end

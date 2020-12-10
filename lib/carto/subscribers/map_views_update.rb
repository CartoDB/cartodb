
module Carto
  module Subscribers
    class MapViewsUpdate

      include ::LoggerHelper

      def update_map_views(map_views_data)
        log_info(message: 'Processing :update_map_views')

        date = map_views_data[:date]
        users_data = map_views_data[:data]

        users_data.each do |user_data|
          user_id = user_data[:user_id]
          map_views = user_data[:map_views]

          user = Carto::User.find_by(id: user_id)
          next if user.nil?

          user_map_views = Carto::UserMapViews.find_or_initialize_by(
            user: user, metric_date: date
          )
          user_map_views.update!(map_views: map_views)
          log_debug(message: 'Updated user map_views', user_id: user_id, map_views: map_views, date: date)
        end
      end

    end
  end
end

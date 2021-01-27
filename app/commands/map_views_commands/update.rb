module MapViewsCommands
  class Update < ::CartoCommand

    private

    def run_command
      date = params[:date]
      users_data = params[:data]

      users_data.each do |user_data|
        user_id = user_data[:user_id]
        map_views = user_data[:map_views]

        user = Carto::User.find_by(id: user_id)
        next if user.nil?

        user_map_views = Carto::UserMapViews.find_or_initialize_by(
          user: user, metric_date: date
        )
        user_map_views.update!(map_views: map_views)
        logger.debug(message: 'Updated map_views', user_id: user_id, map_views: map_views, date: date)
      end
    end

  end
end

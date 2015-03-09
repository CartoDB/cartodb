module Carto

  class UserVisualizationsQuery

    # Gets visualizations shared with the user, prefetching visualization owner with a join, all in a single query
    def user_shared_visualizations(user_id)
      user = Carto::User.where(id: user_id).first
      user.user_shared_visualizations.joins(:user).includes(:user)
    end

  end

end

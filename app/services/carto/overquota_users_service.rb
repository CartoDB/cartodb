module Carto
  class OverquotaUsersService
    def initialize(date = Date.today)
      @date = date
    end

    def store_overquota_users(delta)
      overquota(delta).each do |user|
        $users_metadata.hmset(date_key, user.id, user.data.to_json)
      end
      # Expire the cache after two months. Enough time to review data if needed
      $users_metadata.expire(date_key, 2.months)
    end

    def get_stored_overquota_users
      if $users_metadata.exists(date_key)
        $users_metadata.hgetall(date_key).values.map { |v| JSON.parse(v) }
      else
        CartoDB::Logger.warning(message: "There is no overquota cached users for date #{formatted_date}")
        []
      end
    end

    private

    def date_key
      "overquota:users:#{formatted_date}"
    end

    def formatted_date
      @date.strftime('%Y%m%d')
    end

    ##
    # SLOW! Checks redis data (geocodings and isolines) for every user
    # delta: get users who are also this percentage below their limit.
    #        example: 0.20 will get all users at 80% of their map view limit
    #
    def overquota(delta)
      overquota_users = []
      ::User.where(enabled: true, organization_id: nil).use_cursor.each do |u|
        overquota_users << u if services_overquota(u, delta)
      end
      overquota_users
    end

    SERVICES = %w(geocoding twitter_datasource here_isolines obs_snapshot obs_general mapzen_routing).freeze
    def services_overquota(user, delta)
      SERVICES.any? do |service|
        user.send("get_#{service}_calls") > user.send("#{service}_quota").to_i * (1 - delta)
      end
    end
  end
end

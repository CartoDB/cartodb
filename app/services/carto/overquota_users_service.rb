module Carto
  class OverquotaUsersService
    def initialize(date)
      @date_key = "overquota:users:#{date.strftime('%Y%m%d')}"
    end

    def store_overquota_users(delta)
      overquota(delta).each do |user|
        $users_metadata.hmset(@date_key, user.id, user.data.to_json)
      end
      # Expire the cache after two months. Enough time to review data if needed
      $users_metadata.expire(@date_key, 2.months)
    end

    def get_stored_overquota_users
      @date_key = key(date)
      if $users_metadata.exists(@date_key)
        $users_metadata.hgetall(@date_key).values.map { |v| JSON.parse(v) }
      else
        CartoDB::Logger.warning(message: "There is no overquota cached users for date #{formated_date}")
        []
      end
    end

    private

    ##
    # SLOW! Checks redis data (geocodings and isolines) for every user
    # delta: get users who are also this percentage below their limit.
    #        example: 0.20 will get all users at 80% of their map view limit
    #
    def overquota(delta)
      ::User.where(enabled: true, organization_id: nil).exclude(account_type: 'FREE').use_cursor.select do |u|
        limit = u.geocoding_quota.to_i - (u.geocoding_quota.to_i * delta)
        over_geocodings = u.get_geocoding_calls > limit

        limit = u.twitter_datasource_quota.to_i - (u.twitter_datasource_quota.to_i * delta)
        over_twitter_imports = u.get_twitter_imports_count > limit

        limit = u.here_isolines_quota.to_i - (u.here_isolines_quota.to_i * delta)
        over_here_isolines = u.get_here_isolines_calls > limit

        limit = u.obs_snapshot_quota.to_i - (u.obs_snapshot_quota.to_i * delta)
        over_obs_snapshot = u.get_obs_snapshot_calls > limit

        limit = u.obs_general_quota.to_i - (u.obs_general_quota.to_i * delta)
        over_obs_general = u.get_obs_general_calls > limit

        limit = u.mapzen_routing_quota.to_i - (u.mapzen_routing_quota.to_i * delta)
        over_mapzen_routing = u.get_mapzen_routing_calls > limit

        over_geocodings || over_twitter_imports || over_here_isolines ||
          over_mapzen_routing || over_obs_snapshot || over_obs_general
      end
    end
  end
end

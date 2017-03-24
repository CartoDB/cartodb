module Carto::Metrics
  class MapviewsUsageMetrics
    VALID_METRICS = [
      :total_views
    ].freeze

    VALID_SERVICES = [
      :mapviews
    ].freeze

    MAPVIEWS_REDIS_KEYS = [
      'mapviews',
      'mapviews_es'
    ].freeze

    def initialize(username, orgname)
      @username = username
      @organization = Carto::Organization.where(name: orgname).first
    end

    def get(_service, _metric, date)
      (@organization ? @organization.users.map(&:username) : [@username]).sum do |username|
        MAPVIEWS_REDIS_KEYS.sum do |redis_key|
          CartoDB::Stats::APICalls.new.get_api_calls_from_redis_source(
            username, redis_key, from: date, to: date
          ).values.first
        end
      end
    end

    def get_date_range(_service, _metric, date_from, date_to)
      stats = CartoDB::Stats::APICalls.new
      ret = {}
      (@organization ? @organization.users.map(&:username) : [@username]).each do |username|
        MAPVIEWS_REDIS_KEYS.each do |redis_key|
          user_map_views = stats.get_api_calls_from_redis_source(
            username,
            redis_key,
            from: date_from,
            to: date_to
          )
          ret.merge!(user_map_views) { |date, accum, value| accum + value }
        end
      end
      ret.reduce({}) { |h, (key, val)| h[Date.parse(key)] = val; h}
    end
  end
end

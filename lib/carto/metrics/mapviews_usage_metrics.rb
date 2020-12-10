require_relative 'usage_metrics_interface'

module Carto::Metrics
  class MapviewsUsageMetrics < UsageMetricsInterface
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
      @stats = CartoDB::Stats::APICalls.new
    end

    def get_date_range(_service, _metric, date_from, date_to)
      map_views = {}
      (@organization ? @organization.users.map(&:username) : [@username]).each do |username|
        MAPVIEWS_REDIS_KEYS.each do |redis_key|
          user_map_views = @stats.get_api_calls_from_redis_source(
            username,
            redis_key,
            from: date_from,
            to: date_to
          )
          map_views.merge!(user_map_views) { |_date, accum, value| accum + value }
        end
      end

      # Return a hash of {Date => Number} pairs instead of { String => Number }
      # in order to abide to the interface.
      map_views.reduce({}) do |new_hash, (date_str_key, value)|
        new_hash[Date.parse(date_str_key)] = value
        new_hash
      end
    end
  end
end

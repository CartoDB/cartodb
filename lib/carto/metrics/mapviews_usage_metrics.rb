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
  end
end

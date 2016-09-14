module Carto::Metrics
  class MapviewsUsageMetrics
    VALID_METRICS = [
      :total_views
    ].freeze

    VALID_SERVICES = [
      :mapviews
    ].freeze

    def initialize(user, _org)
      @user = user
    end

    def get(_service, _metric, date)
      CartoDB::Stats::APICalls.new.get_api_calls_from_redis_source(@user, 'mapviews', from: date, to: date).values[0]
    end
  end
end

module Carto::Metrics
  class MapviewsUsageMetrics
    VALID_METRICS = [
      :total_views
    ].freeze

    VALID_SERVICES = [
      :mapviews,
      :mapviews_es
    ].freeze

    def initialize(user, orgname)
      @user = user
      @organization = Carto::Organization.where(name: orgname).first
    end

    def get(_service, _metric, date)
      if @organization
        @organization.users.map { |user|
          CartoDB::Stats::APICalls.new.get_api_calls_from_redis_source(
            user.username, 'mapviews', from: date, to: date
          ).values[0]
        }.sum
      else
        CartoDB::Stats::APICalls.new.get_api_calls_from_redis_source(@user, 'mapviews', from: date, to: date).values[0]
      end
    end
  end
end

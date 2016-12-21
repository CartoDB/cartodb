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
      (@organization ? @organization.users : @user).sum do |user|
        VALID_SERVICES.sum do |service|
          CartoDB::Stats::APICalls.new.get_api_calls_from_redis_source(
            user.username, service.to_s, from: date, to: date
          ).values.first
        end
      end
    end
  end
end

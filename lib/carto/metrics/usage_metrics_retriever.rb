module Carto::Metrics
  class UsageMetricsRetriever
    def initialize(cls)
      @cls = cls
    end

    def services
      @cls::VALID_SERVICES
    end

    def metrics
      @cls::VALID_METRICS
    end

    def get_range(user, org, service, metric, date_from, date_to)
      user = user
      org = org
      usage_metrics = @cls.new(user.username, org ? org.name : nil)

      result = {}
      date_from.upto(date_to).each do |date|
        result[date] = usage_metrics.get(service, metric, date)
      end
      result
    end
  end
end

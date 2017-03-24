require_relative 'usage_metrics_interface'

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
      usage_metrics = @cls.new(user.try(:username), org.try(:name))
      if !usage_metrics.is_a? UsageMetricsInterface
        raise "#{usage_metrics.class} shall implement UsageMetricsInterface"
      end
      usage_metrics.get_date_range(service, metric, date_from, date_to)
    end
  end
end

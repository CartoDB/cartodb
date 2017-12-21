module Carto::Metrics
  class UsageMetricsInterface
    def initialize(_username, _orgname)
      raise NotImplementedError
    end

    def get_date_range(_service, _metric, _date_from, _date_to)
      raise NotImplementedError, 'Implement a method that returns a hash of { Date => Numeric } pairs'
    end
  end
end

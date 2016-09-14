require_dependency 'carto/metrics/mapviews_usage_metrics'
require_dependency 'carto/metrics/usage_metrics_retriever'
require_dependency 'carto/metrics/twitter_imports_retriever'

module Carto::Superadmin
  module MetricsControllerHelper
    USAGE_METRICS_CLASSES = [
      CartoDB::GeocoderUsageMetrics,
      CartoDB::IsolinesUsageMetrics,
      CartoDB::ObservatoryGeneralUsageMetrics,
      CartoDB::ObservatorySnapshotUsageMetrics,
      CartoDB::RoutingUsageMetrics,
      Carto::Metrics::MapviewsUsageMetrics
    ].freeze

    USAGE_METRICS_RETRIEVERS = (
      USAGE_METRICS_CLASSES.map { |cls| Carto::Metrics::UsageMetricsRetriever.new(cls) } +
      [Carto::Metrics::TwitterImportsRetriever.new]
    ).freeze

    private

    def get_usage(user, org, date_from, date_to)
      usage = {}
      USAGE_METRICS_RETRIEVERS.each do |retriever|
        retriever.services.each do |service|
          usage[service] = {}
          retriever.metrics.each do |metric|
            usage[service][metric] = retriever.get_range(user, org, service, metric, date_from, date_to)
          end
        end
      end

      usage
    end
  end
end

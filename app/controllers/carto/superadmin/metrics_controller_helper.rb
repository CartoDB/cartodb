require_dependency 'carto/metrics/mapviews_usage_metrics'
require_dependency 'carto/metrics/usage_metrics_retriever'
require_dependency 'carto/metrics/twitter_imports_retriever'

module Carto::Superadmin
  module MetricsControllerHelper
    USAGE_METRICS_CLASSES = [
      CartoDB::GeocoderUsageMetrics,
      CartoDB::IsolinesUsageMetrics,
      CartoDB::RoutingUsageMetrics,
      Carto::Metrics::MapviewsUsageMetrics
    ].freeze

    USAGE_METRICS_RETRIEVERS = (
      USAGE_METRICS_CLASSES.map { |cls| Carto::Metrics::UsageMetricsRetriever.new(cls) } +
      [Carto::Metrics::TwitterImportsRetriever.new]
    ).freeze

    private

    def get_usage(user, org, last_billing_cycle)
      only_services = params[:services] || []
      raise ArgumentError.new('services must be an array') unless only_services.is_a?(Array)
      only_services = only_services.map(&:to_sym)
      date_to = params[:to] ? Date.parse(params[:to]) : Date.today
      date_from = params[:from] ? Date.parse(params[:from]) : last_billing_cycle
      totals = params[:totals].present? && params[:totals] == 'true'

      usage = {}
      USAGE_METRICS_RETRIEVERS.each do |retriever|
        services = retriever.services
        services &= only_services if only_services.present?
        services.each do |service|
          usage[service] = {}
          retriever.metrics.each do |metric|
            range = retriever.get_range(user, org, service, metric, date_from, date_to)
            usage[service][metric] = totals ? range.values.sum : range.map { |d, v| { date: d, value: v } }
          end
        end
      end

      usage
    end
  end
end

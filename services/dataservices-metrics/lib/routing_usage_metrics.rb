require 'active_support/time'
require_relative 'service_usage_metrics'

module CartoDB
  # The purpose of this class is to encapsulate storage of usage metrics.
  # This shall be used for billing, quota checking and metrics.
  class RoutingUsageMetrics < ServiceUsageMetrics

    VALID_METRICS = [
      :total_requests,
      :failed_responses,
      :success_responses,
      :empty_responses
    ].freeze

    VALID_SERVICES = [
      :routing_mapzen,
      :routing_mapbox,
      :routing_tomtom
    ].freeze

    ROUTING_KEYS = {
      "mapzen" => :routing_mapzen,
      "mapbox" => :routing_mapbox,
      "tomtom" => :routing_tomtom
    }.freeze

    def initialize(username, orgname = nil, redis = $geocoder_metrics)
      super(username, orgname, redis)
    end

    protected

    def check_valid_data(service, metric)
      raise ArgumentError.new('Invalid service') unless VALID_SERVICES.include?(service)
      raise ArgumentError.new('Invalid metric') unless VALID_METRICS.include?(metric)
    end
  end
end

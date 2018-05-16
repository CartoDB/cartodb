# encoding: utf-8

require 'active_support/time'
require_relative 'service_usage_metrics'

module CartoDB
  # The purpose of this class is to encapsulate storage of usage metrics.
  # This shall be used for billing, quota checking and metrics.
  class IsolinesUsageMetrics < ServiceUsageMetrics

    VALID_METRICS = [
      :total_requests,
      :failed_responses,
      :success_responses,
      :empty_responses,
      :isolines_generated
    ].freeze

    VALID_SERVICES = [
      :here_isolines,
      :mapzen_isolines,
      :mapbox_isolines,
      :tomtom_isolines
    ].freeze

    ISOLINES_KEYS = {
      "heremaps" => :here_isolines,
      "mapzen" => :mapzen_isolines,
      "mapbox" => :mapbox_isolines,
      "tomtom" => :tomtom_isolines
    }.freeze

    def initialize(username, orgname = nil, redis=$geocoder_metrics)
      super(username, orgname, redis)
    end

    protected

    def check_valid_data(service, metric)
      raise ArgumentError.new('Invalid service') unless VALID_SERVICES.include?(service)
      raise ArgumentError.new('Invalid metric') unless VALID_METRICS.include?(metric)
    end
  end
end

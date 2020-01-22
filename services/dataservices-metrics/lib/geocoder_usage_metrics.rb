require 'active_support/time'
require_relative 'service_usage_metrics'

module CartoDB
  # The purpose of this class is to encapsulate storage of usage metrics.
  # This shall be used for billing, quota checking and metrics.
  class GeocoderUsageMetrics < ServiceUsageMetrics

    VALID_METRICS = [
      :total_requests,
      :failed_responses,
      :success_responses,
      :empty_responses,
    ].freeze

    VALID_SERVICES = [
      :geocoder_internal,
      :geocoder_here,
      :geocoder_google,
      :geocoder_cache,
      :geocoder_mapzen,
      :geocoder_mapbox,
      :geocoder_tomtom,
      :geocoder_geocodio
    ].freeze

    GEOCODER_KEYS = {
      "heremaps" => :geocoder_here,
      "google" => :geocoder_google,
      "mapzen" => :geocoder_mapzen,
      "mapbox" => :geocoder_mapbox,
      "tomtom" => :geocoder_tomtom,
      "geocodio" => :geocoder_geocodio
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

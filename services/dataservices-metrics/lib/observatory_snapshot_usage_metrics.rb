# encoding: utf-8

require 'active_support/time'
require_relative 'service_usage_metrics'

module CartoDB
  # The purpose of this class is to encapsulate storage of usage metrics.
  # This shall be used for billing, quota checking and metrics.
  class ObservatorySnapshotUsageMetrics < ServiceUsageMetrics

    VALID_METRICS = [
      :total_requests,
      :failed_responses,
      :success_responses,
      :empty_responses
    ].freeze

    VALID_SERVICES = [
      :obs_snapshot
    ].freeze

    def initialize(username, orgname = nil, redis = $geocoder_metrics)
      super(username, orgname, redis)
    end

    protected

    def check_valid_data(service, metric, amount = 0)
      raise ArgumentError.new('Invalid service') unless VALID_SERVICES.include?(service)
      raise ArgumentError.new('Invalid metric') unless VALID_METRICS.include?(metric)
      raise ArgumentError.new('Invalid data observatory metric amount') if !amount.nil? && amount < 0
    end
  end
end

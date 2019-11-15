require_relative './base_job'

module Resque
  class GeocoderJobs < BaseJob
    @queue = :geocodings

    def self.perform(options = {})
      geocoding = run_action(options, @queue, lambda { |options| geocoding = Geocoding[options.symbolize_keys[:job_id]].run! })
    end
  end
end

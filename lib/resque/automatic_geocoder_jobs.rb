require_relative './base_job'

module Resque
  class AutomaticGeocoderJobs < BaseJob
    @queue = :automatic_geocodings

    def self.perform(options = {})
      run_action(options, @queue, lambda { |options| AutomaticGeocoding[options.symbolize_keys[:job_id]].run })
    end
  end
end
# encoding: utf-8
module Resque
  class AutomaticGeocoderJobs
    @queue = :automatic_geocodings

    def self.perform(options={})
      AutomaticGeocoding[options.symbolize_keys[:job_id]].run
    end
  end
end

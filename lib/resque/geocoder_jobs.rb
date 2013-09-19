module Resque
  class GeocoderJobs
    @queue = :geocodings

    def self.perform(options = {})
      geocoding = Geocodings[options.symbolize_keys[:job_id]].run!
    end

  end
end

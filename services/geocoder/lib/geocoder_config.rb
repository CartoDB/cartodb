require 'singleton'

module CartoDB
  # A facility that abstracts clients from config and also allow for easy injection
  class GeocoderConfig
    include Singleton

    def set(config = {})
      @config = config
    end

    def get()
      @config ||= ::Cartodb.config[:geocoder]
    end
  end
end

# encoding: utf-8

require_relative '../../services/table-geocoder/lib/table_geocoder'
require_relative '../../services/table-geocoder/lib/internal_geocoder'

module CartoDB
  class GeocoderFactory
    def self.get(config)
      geocoder_class = (config[:kind] == 'high-resolution' ? CartoDB::TableGeocoder : CartoDB::InternalGeocoder::Geocoder)
      return geocoder_class.new(config)
    end
  end
end

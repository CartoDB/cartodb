# encoding: utf-8

require_relative '../../services/table-geocoder/lib/table_geocoder'
require_relative '../../services/table-geocoder/lib/internal_geocoder'
require_relative '../../services/table-geocoder/lib/gme/table_geocoder'

module CartoDB
  class GeocoderFactory
    def self.get(config)
      kind = config[:kind]
      
      if kind == 'high-resolution'
        if Carto::Gme::TableGeocoder.enabled?
          geocoder_class = Carto::Gme::TableGeocoder
        else
          geocoder_class = CartoDB::TableGeocoder
        end
      else
        geocoder_class = CartoDB::InternalGeocoder::Geocoder
      end

      return geocoder_class.new(config)
    end
  end
end

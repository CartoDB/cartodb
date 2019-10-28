require 'rack'

module CartoDB
  module Importer2
    module UrlTranslator
      class OSM2
        URL_REGEX               = %r{openstreetmap.org/#map=}
        # New format as of Feb2014
        URL_REGEX2               = %r{openstreetmap.org/export#map=}
        TRANSLATED_URL_REGEX    = /api.openstreetmap.org/
        URL_TEMPLATE  = 'http://api.openstreetmap.org/api/0.6/map?bbox='
        DEFW = 1200.0/2.0
        DEFH = 1000.0/2.0

        def translate(url)
          return url if !supported?(url) || translated?(url) 
          "#{URL_TEMPLATE}#{bounding_box_for(url)}"
        end #translate

        def bounding_box_for(url)
          url_pieces = url.split('/')

          lon   = url_pieces[-1].to_f
          lat   = url_pieces[-2].to_f
          zoom  = is_old_format?(url) ? url_pieces[-3].match(/#map=(\d+)/)[1].to_i : url_pieces[-3].match(/export#map=(\d+)/)[1].to_i

          res   = 180 / 256.0 / 2**zoom
          py    = (90 + lat) / res
          px    = (180 + lon) / res
          lpx   = px - DEFW
          lpy   = py - DEFH
          upx   = px + DEFW
          upy   = py + DEFH

          lon1  = (res * lpx) - 180
          lat1  = (res * lpy) - 90
          lon2  = (res * upx) - 180
          lat2  = (res * upy) - 90

          [lon1, lat1, lon2, lat2].join(',')
        end #bounding_box_for

        def supported?(url)
          !!(url =~ URL_REGEX2) || !!(url =~ URL_REGEX)
        end #supported?

        def translated?(url)
          !!(url =~ TRANSLATED_URL_REGEX)
        end #translated?

        private

        def is_old_format?(url)
          !!(url =~ URL_REGEX)
        end #is_old_format?


      end #OSM2
    end # UrlTranslator
  end # Importer2
end # CartoDB


require 'rack'

module CartoDB
  module Importer2
    module UrlTranslator
      class GoogleMaps
        URL_REGEX               = %r{maps.google.\w+/maps/ms(/|/?)(.*)msid=}
        TRANSLATED_URL_REGEX    = %r{maps.google.(.*)/maps/ms(/|/?)(.*)msid=(.*)output=kml(.*)}
        DOC_ID_REGEX            = %r{msid=([\w-]+)#.*}

        def translate(url)
          return url if !supported?(url) || translated?(url) 
          return url + "&output=kml"
        end #translate

        def supported?(url)
          !!(url =~ URL_REGEX)
        end #supported?

        def translated?(url)
          !!(url =~ TRANSLATED_URL_REGEX)
        end #translated?

        private

        def doc_id_from(url)
          url.match(DOC_ID_REGEX)[1]
        end
      end
    end
  end
end


require 'rack'

module CartoDB
  module Importer2
    module UrlTranslator
      class KimonoLabs
        URL_REGEX               = %r{www.kimonolabs.com/api/csv/(.*)/?apikey=}
        TRANSLATED_URL_REGEX    = %r{www.kimonolabs.com/api/csv/(.*)/?apikey=}

        def translate(url)
          return url if !supported?(url) || translated?(url)
          return url  # No need to translate
        end #translate

        def supported?(url)
          !!(url =~ URL_REGEX)
        end #supported?

        def translated?(url)
          !!(url =~ TRANSLATED_URL_REGEX)
        end #translated?

        def rename_destination(url)
          'kl_' + url.hash.abs.to_s + '.csv'
        end

      end
    end
  end
end


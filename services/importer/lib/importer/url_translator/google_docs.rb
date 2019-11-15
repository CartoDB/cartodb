require 'rack'

module CartoDB
  module Importer2
    module UrlTranslator
      class GoogleDocs
        URL_REGEX               = %r{docs.google.\w+/spreadsheet/ccc.*}
        TRANSLATED_URL_REGEX    = %r{docs.google.\w+/spreadsheet/pub.*output=csv}

        def translate(url)
          return url if !supported?(url) || translated?(url) 
          return url.gsub(%r{#gid=\d+}, '') + "&output=csv"
          # .gsub(%r{spreadsheet/ccc}, 'spreadsheet/pub') 
        end #translate

        def supported?(url)
          !!(url =~ URL_REGEX)
        end #supported?

        def translated?(url)
          !!(url =~ TRANSLATED_URL_REGEX)
        end #translated?
      end # GoogleDocs
    end # UrlTranslator
  end # Importer2
end # CartoDB


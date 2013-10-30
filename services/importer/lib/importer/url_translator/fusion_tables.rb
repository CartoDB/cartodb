# encoding: utf-8
require 'rack'

module CartoDB
  module Importer2
    module UrlTranslator
      class FusionTables
        URL_REGEX               = %r{google.com/fusiontables}
        TRANSLATED_URL_REGEX    = %r{google.com/fusiontables/exporttable}
        URL_TEMPLATE            = "https://www.google.com/fusiontables" +
                                  "/exporttable?query=select+*+from+"
        DOC_ID_REGEX            = %r{\?docid=([\w-]+)#.*}

        def translate(url)
          return url if !supported?(url) || translated?(url) 
          return "#{URL_TEMPLATE}#{doc_id_from(url)}"
        end #translate

        def supported?(url)
          !!(url =~ URL_REGEX || url =~ URL_REGEX)
        end #supported?

        def translated?(url)
          !!(url =~ TRANSLATED_URL_REGEX)
        end #translated?

        private

        def doc_id_from(url)
          url.match(DOC_ID_REGEX)[1]
        end #doc_id_from
      end # FusionTables
    end # UrlTranslator
  end # Importer2
end # CartoDB


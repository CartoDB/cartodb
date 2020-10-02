require 'rack'

module CartoDB
  module Importer2
    module UrlTranslator
      class FusionTables

        URL_REGEX               = %r{google.com/fusiontables}.freeze
        TRANSLATED_URL_REGEX    = %r{google.com/fusiontables/exporttable}.freeze
        URL_TEMPLATE            = 'https://www.google.com/fusiontables' +
                                  '/exporttable?query='
        QUERY_FOR_DOC_ID        = 'select+*+from+'.freeze
        DOC_ID_REGEX            = /\?docid=([\w-]+)#?.*/.freeze
        TABLE_QUERY_REGEX       = /&q=([^&]*)&?.*/.freeze

        def translate(url)
          return url if !supported?(url) || translated?(url)
          return "#{URL_TEMPLATE}#{QUERY_FOR_DOC_ID}#{doc_id_from(url)}" if DOC_ID_REGEX === url
          return "#{URL_TEMPLATE}#{query_from(url)}" if TABLE_QUERY_REGEX === url

          raise "Couldn't translate #{url}"
        end # translate

        def supported?(url)
          !!(url =~ URL_REGEX && (DOC_ID_REGEX === url || TABLE_QUERY_REGEX === url))
        end # supported?

        def translated?(url)
          !!(url =~ TRANSLATED_URL_REGEX)
        end # translated?

        private

        def doc_id_from(url)
          url.match(DOC_ID_REGEX)[1]
        rescue StandardError
          raise "Couldn't extract docid from '#{url}' matching '#{DOC_ID_REGEX}'"
        end # doc_id_from

        def query_from(url)
          url.match(TABLE_QUERY_REGEX)[1]
        rescue StandardError
          raise "Couldn't extract query from '#{url}' matching '#{TABLE_QUERY_REGEX}'"
        end

      end # FusionTables
    end # UrlTranslator
  end # Importer2
end # CartoDB

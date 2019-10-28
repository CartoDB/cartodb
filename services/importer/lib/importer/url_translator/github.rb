require 'rack'

module CartoDB
  module Importer2
    module UrlTranslator 
      class GitHub
        URL_REGEX               = %r{github.com/.*[blob|raw].*}
        TRANSLATED_URL_REGEX    = %r{raw}

        def translate(url)
          return url if !supported?(url) || translated?(url) 
          return url.gsub(%r{/blob/}, '/raw/')
        end #translate

        def supported?(url)
          !!(url =~ URL_REGEX)
        end #supported?

        def translated?(url)
          !!(url =~ TRANSLATED_URL_REGEX)
        end #translated?
      end #GitHub
    end #UrlTranslator
  end # Importer2
end # CartoDB


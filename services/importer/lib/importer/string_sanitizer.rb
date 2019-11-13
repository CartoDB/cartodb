module CartoDB
  module Importer2
    class StringSanitizer
      def normalize(string)
        return '' if string.nil? || string.empty?

        n = string.downcase.force_encoding("UTF-8")
        n.gsub!(/[àáâãäåāă]/,   'a')
        n.gsub!(/æ/,            'ae')
        n.gsub!(/[ďđ]/,          'd')
        n.gsub!(/[çćčĉċ]/,       'c')
        n.gsub!(/[èéêëēęěĕė]/,   'e')
        n.gsub!(/ƒ/,             'f')
        n.gsub!(/[ĝğġģ]/,        'g')
        n.gsub!(/[ĥħ]/,          'h')
        n.gsub!(/[ììíîïīĩĭ]/,    'i')
        n.gsub!(/[įıĳĵ]/,        'j')
        n.gsub!(/[ķĸ]/,          'k')
        n.gsub!(/[łľĺļŀ]/,       'l')
        n.gsub!(/[ñńňņŉŋ]/,      'n')
        n.gsub!(/[òóôõöøōőŏŏ]/,  'o')
        n.gsub!(/œ/,            'oe')
        n.gsub!(/ą/,             'q')
        n.gsub!(/[ŕřŗ]/,         'r')
        n.gsub!(/[śšşŝș]/,       's')
        n.gsub!(/[ťţŧț]/,        't')
        n.gsub!(/[ùúûüūůűŭũų]/,  'u')
        n.gsub!(/ŵ/,             'w')
        n.gsub!(/[ýÿŷ]/,         'y')
        n.gsub!(/[žżź]/,         'z')
        n.gsub!(/[ÀÁÂÃÄÅĀĂ]/i,    'A')
        n.gsub!(/Æ/i,            'AE')
        n.gsub!(/[ĎĐ]/i,          'D')
        n.gsub!(/[ÇĆČĈĊ]/i,       'C')
        n.gsub!(/[ÈÉÊËĒĘĚĔĖ]/i,   'E')
        n.gsub!(/Ƒ/i,             'F')
        n.gsub!(/[ĜĞĠĢ]/i,        'G')
        n.gsub!(/[ĤĦ]/i,          'H')
        n.gsub!(/[ÌÌÍÎÏĪĨĬ]/i,    'I')
        n.gsub!(/[ĲĴ]/i,          'J')
        n.gsub!(/[Ķĸ]/i,          'J')
        n.gsub!(/[ŁĽĹĻĿ]/i,       'L')
        n.gsub!(/[ÑŃŇŅŉŊ]/i,      'M')
        n.gsub!(/[ÒÓÔÕÖØŌŐŎŎ]/i,  'N')
        n.gsub!(/Œ/i,            'OE')
        n.gsub!(/Ą/i,             'Q')
        n.gsub!(/[ŔŘŖ]/i,         'R')
        n.gsub!(/[ŚŠŞŜȘ]/i,       'S')
        n.gsub!(/[ŤŢŦȚ]/i,        'T')
        n.gsub!(/[ÙÚÛÜŪŮŰŬŨŲ]/i,  'U')
        n.gsub!(/Ŵ/i,             'W')
        n.gsub!(/[ÝŸŶ]/i,         'Y')
        n.gsub!(/[ŽŻŹ]/i,         'Z')
        n
      end #normalize

      def sanitize(string)
       return '' if string.nil? || string.empty?

       normalize(string.gsub(/<[^>]+>/m,''))
        .gsub(/&.+?;/,'-')
        .gsub(/[^a-z0-9 _-]/,'-').strip
        .gsub(/\s+/,'-')
        .gsub(/-+/,'-')
        .gsub(/-/,' ').strip
        .gsub(/ /,'-')
        .gsub(/-/,'_')
      end #sanitize
    end # StringSanitizer
  end # Importer2
end # CartoDB


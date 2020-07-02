module CartoDB
  module Importer2
    module StringSanitizer
      module_function

      GREEK_TRANSLITERATION_RULES = [
        [/άι/, 'ai'], [/αι/, 'ai'], [/ΈΥ/, 'ev'], [/ΕΎ/, 'ev'], [/ΕΥ/, 'ev'], [/έυ/, 'ev'], [/εύ/, 'ev'],
        [/ευ/, 'ev'], [/ΑΥ/, 'av'], [/ΑΎ/, 'av'], [/ΆΥ/, 'av'], [/άυ/, 'av'], [/αύ/, 'av'], [/αυ/, 'av'],
        [/ΟΎ/, 'u'], [/ΌΥ/, 'u'], [/ΟΥ/, 'u'], [/ού/, 'u'], [/όυ/, 'u'], [/ου/, 'u'], [/ΈΙ/, 'ei'], [/ΕΊ/, 'ei'],
        [/ΕΙ/, 'ei'], [/έι/, 'ei'], [/ει/, 'ei'], [/ΌΙ/, 'oi'], [/ΟΊ/, 'oi'], [/ΟΙ/, 'oi'], [/όι/, 'oi'],
        [/οί/, 'oi'], [/οι/, 'oi'], [/ΆΙ/, 'ai'], [/ΑΊ/, 'ai'], [/ΑΙ/, 'ai'], [/αί/, 'ai'], [/ϋ/, 'i'],
        [/ϊ/, 'i'], [/Ω/, 'w'], [/Ώ/, 'w'], [/ώ/, 'w'], [/ω/, 'w'], [/Ψ/, 'ps'], [/ψ/, 'ps'], [/Χ/, 'ch'],
        [/χ/, 'ch'], [/Φ/, 'f'], [/φ/, 'f'], [/Ύ/, 'y'], [/Υ/, 'y'], [/ύ/, 'y'], [/υ/, 'y'], [/Τ/, 't'],
        [/τ/, 't'], [/ς/, 's'], [/Σ/, 's'], [/σ/, 's'], [/Ρ/, 'r'], [/ρ/, 'r'], [/Π/, 'p'], [/π/, 'p'],
        [/Ό/, 'o'], [/ό/, 'o'], [/Ο/, 'o'], [/ο/, 'o'], [/Ξ/, 'x'], [/ξ/, 'x'], [/Ν/, 'n'], [/ν/, 'n'],
        [/Μ/, 'm'], [/μ/, 'm'], [/Λ/, 'l'], [/λ/, 'l'], [/Κ/, 'k'], [/κ/, 'k'], [/Ί/, 'I'], [/α/, 'a'],
        [/ί/, 'I'], [/ι/, 'I'], [/Θ/, 'th'], [/θ/, 'th'], [/Ή/, 'h'], [/Η/, 'h'], [/ή/, 'h'], [/η/, 'h'],
        [/Ζ/, 'z'], [/ζ/, 'z'], [/Έ/, 'e'], [/Ε/, 'e'], [/έ/, 'e'], [/ε/, 'e'], [/Δ/, 'd'], [/δ/, 'd'],
        [/Γ/, 'g'], [/γ/, 'g'], [/Β/, 'v'], [/β/, 'v'], [/Ά/, 'a'], [/Α/, 'a'], [/ά/, 'a'], [/Ι/, 'I']
      ]

      def normalize(string, transliterate_cyrillic: false, transliterate_greek: false)
        return '' if string.nil? || string.empty?

        n = string.force_encoding("UTF-8")
        n.gsub!(/[àáâãäåāă]/,    'a')
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
        n.gsub!(/[ÀÁÂÃÄÅĀĂ]/,    'A')
        n.gsub!(/Æ/,            'AE')
        n.gsub!(/[ĎĐ]/,          'D')
        n.gsub!(/[ÇĆČĈĊ]/,       'C')
        n.gsub!(/[ÈÉÊËĒĘĚĔĖ]/,   'E')
        n.gsub!(/Ƒ/i,            'F')
        n.gsub!(/[ĜĞĠĢ]/,        'G')
        n.gsub!(/[ĤĦ]/i,         'H')
        n.gsub!(/[ÌÌÍÎÏĪĨĬ]/,    'I')
        n.gsub!(/[ĲĴ]/,          'J')
        n.gsub!(/[Ķĸ]/,          'K')
        n.gsub!(/[ŁĽĹĻĿ]/,       'L')
        n.gsub!(/[ÑŃŇŅŉŊ]/,      'N')
        n.gsub!(/[ÒÓÔÕÖØŌŐŎŎ]/,  'O')
        n.gsub!(/Œ/,            'OE')
        n.gsub!(/Ą/,             'Q')
        n.gsub!(/[ŔŘŖ]/,         'R')
        n.gsub!(/[ŚŠŞŜȘ]/,       'S')
        n.gsub!(/[ŤŢŦȚ]/,        'T')
        n.gsub!(/[ÙÚÛÜŪŮŰŬŨŲ]/,  'U')
        n.gsub!(/Ŵ/,             'W')
        n.gsub!(/[ÝŸŶ]/,         'Y')
        n.gsub!(/[ŽŻŹ]/,         'Z')
        if transliterate_cyrillic
          n.gsub!(/Б/, 'B')
          n.gsub!(/б/, 'b')
          n.gsub!(/В/, 'V')
          n.gsub!(/в/, 'v')
          n.gsub!(/Г/, 'G')
          n.gsub!(/г/, 'g')
          n.gsub!(/Д/, 'D')
          n.gsub!(/д/, 'd')
          n.gsub!(/Е/, 'E')
          n.gsub!(/е/, 'e')
          n.gsub!(/Ё/, 'Yo')
          n.gsub!(/ё/, 'yo')
          n.gsub!(/Ж/, 'Zh')
          n.gsub!(/ж/, 'zh')
          n.gsub!(/З/, 'Z')
          n.gsub!(/з/, 'z')
          n.gsub!(/И/, 'I')
          n.gsub!(/и/, 'i')
          n.gsub!(/Й/, 'J')
          n.gsub!(/й/, 'j')
          n.gsub!(/К/, 'K')
          n.gsub!(/к/, 'k')
          n.gsub!(/Л/, 'L')
          n.gsub!(/л/, 'l')
          n.gsub!(/М/, 'M')
          n.gsub!(/м/, 'm')
          n.gsub!(/Н/, 'N')
          n.gsub!(/н/, 'n')
          n.gsub!(/О/, 'O')
          n.gsub!(/о/, 'o')
          n.gsub!(/П/, 'P')
          n.gsub!(/п/, 'p')
          n.gsub!(/Р/, 'R')
          n.gsub!(/р/, 'r')
          n.gsub!(/С/, 'S')
          n.gsub!(/с/, 's')
          n.gsub!(/Т/, 'T')
          n.gsub!(/т/, 't')
          n.gsub!(/У/, 'U')
          n.gsub!(/у/, 'u')
          n.gsub!(/Ф/, 'F')
          n.gsub!(/ф/, 'f')
          n.gsub!(/Х/, 'X')
          n.gsub!(/х/, 'x')
          n.gsub!(/Ц/, 'Cz')
          n.gsub!(/ц/, 'cz')
          n.gsub!(/Ч/, 'Ch')
          n.gsub!(/ч/, 'ch')
          n.gsub!(/Ш/, 'Sh')
          n.gsub!(/ш/, 'sh')
          n.gsub!(/Щ/, 'Shh')
          n.gsub!(/щ/, 'shh')
          n.gsub!(/Ъ/, '')
          n.gsub!(/ъ/, '')
          n.gsub!(/Ы/, 'Y')
          n.gsub!(/ы/, 'y')
          n.gsub!(/Ь/, '')
          n.gsub!(/ь/, '')
          n.gsub!(/Э/, 'E')
          n.gsub!(/э/, 'e')
          n.gsub!(/Ю/, 'Yu')
          n.gsub!(/ю/, 'yu')
          n.gsub!(/Я/, 'Ya')
          n.gsub!(/я/, 'ya')
        end
        GREEK_TRANSLITERATION_RULES.each { |rule| n.gsub!(rule[0], rule[1]) } if transliterate_greek
        n
      end

      def sanitize(string, transliterate_cyrillic: false, transliterate_greek: false)
       return '' if string.nil? || string.empty?
       normalize(
         string.gsub(/<[^>]+>/m,''),
         transliterate_cyrillic: transliterate_cyrillic,
         transliterate_greek: transliterate_greek
       ).downcase
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

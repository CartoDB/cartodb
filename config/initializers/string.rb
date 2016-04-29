# coding: UTF-8

class String
  def self.random(length=10)
  ('a'..'z').sort_by {rand}[0,length].join
  end

  def normalize
    str = self.downcase
    return '' if str.blank?
    n = str.force_encoding("UTF-8")
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
    n.gsub!(/[ÑŃŇŅŉŊ]/i,      'N')
    n.gsub!(/[ÒÓÔÕÖØŌŐŎŎ]/i,  'O')
    n.gsub!(/Œ/i,            'OE')
    n.gsub!(/Ą/i,             'Q')
    n.gsub!(/[ŔŘŖ]/i,         'R')
    n.gsub!(/[ŚŠŞŜȘ]/i,       'S')
    n.gsub!(/[ŤŢŦȚ]/i,        'T')
    n.gsub!(/[ÙÚÛÜŪŮŰŬŨŲ]/i,  'U')
    n.gsub!(/Ŵ/i,             'W')
    n.gsub!(/[ÝŸŶ]/i,         'Y')
    n.gsub!(/[ŽŻŹ]/i,         'Z')
    n.gsub!(/A/i, 'A')
    n.gsub!(/а/i, 'a')
    n.gsub!(/Б/i, 'B')
    n.gsub!(/б/i, 'b')
    n.gsub!(/В/i, 'V')
    n.gsub!(/в/i, 'v')
    n.gsub!(/Г/i, 'G')
    n.gsub!(/г/i, 'g')
    n.gsub!(/Д/i, 'D')
    n.gsub!(/д/i, 'd')
    n.gsub!(/Е/i, 'E')
    n.gsub!(/е/i, 'e')
    n.gsub!(/Ё/i, 'Yo')
    n.gsub!(/ё/i, 'yo')
    n.gsub!(/Ж/i, 'Zh')
    n.gsub!(/ж/i, 'zh')
    n.gsub!(/З/i, 'Z')
    n.gsub!(/з/i, 'z')
    n.gsub!(/И/i, 'I')
    n.gsub!(/и/i, 'i')
    n.gsub!(/Й/i, 'J')
    n.gsub!(/й/i, 'j')
    n.gsub!(/К/i, 'K')
    n.gsub!(/к/i, 'k')
    n.gsub!(/Л/i, 'L')
    n.gsub!(/л/i, 'l')
    n.gsub!(/М/i, 'M')
    n.gsub!(/м/i, 'm')
    n.gsub!(/Н/i, 'N')
    n.gsub!(/н/i, 'n')
    n.gsub!(/О/i, 'O')
    n.gsub!(/о/i, 'o')
    n.gsub!(/П/i, 'P')
    n.gsub!(/п/i, 'p')
    n.gsub!(/Р/i, 'R')
    n.gsub!(/р/i, 'r')
    n.gsub!(/С/i, 'S')
    n.gsub!(/с/i, 's')
    n.gsub!(/Т/i, 'T')
    n.gsub!(/т/i, 't')
    n.gsub!(/У/i, 'U')
    n.gsub!(/у/i, 'u')
    n.gsub!(/Ф/i, 'F')
    n.gsub!(/ф/i, 'f')
    n.gsub!(/Х/i, 'X')
    n.gsub!(/х/i, 'x')
    n.gsub!(/Ц/i, 'Cz')
    n.gsub!(/ц/i, 'cz')
    n.gsub!(/Ч/i, 'Ch')
    n.gsub!(/ч/i, 'ch')
    n.gsub!(/Ш/i, 'Sh')
    n.gsub!(/ш/i, 'sh')
    n.gsub!(/Щ/i, 'Shh')
    n.gsub!(/щ/i, 'shh')
    n.gsub!(/Ъ/i, '')
    n.gsub!(/ъ/i, '')
    n.gsub!(/Ы/i, 'Y')
    n.gsub!(/ы/i, 'y')
    n.gsub!(/Ь/i, '')
    n.gsub!(/ь/i, '')
    n.gsub!(/Э/i, 'E')
    n.gsub!(/э/i, 'e')
    n.gsub!(/Ю/i, 'Yu')
    n.gsub!(/ю/i, 'yu')
    n.gsub!(/Я/i, 'Ya')
    n.gsub!(/я/i, 'ya')
    n
  end

  def sanitize
   return if self.blank?
   self.gsub(/<[^>]+>/m,'').normalize.downcase.gsub(/&.+?;/,'-').
        gsub(/[^a-z0-9 _-]/,'-').strip.gsub(/\s+/,'-').gsub(/-+/,'-').
        gsub(/-/,' ').strip.gsub(/ /,'-').gsub(/-/,'_')
  end

  def strip_tags
    self.gsub(/<[^>]+>/m,'').strip
  end


  def get_cartodb_types
    {
      "number"  => ["smallint", /numeric\(\d+,\d+\)/, "integer", "bigint", "decimal", "numeric", "double precision", "serial", "big serial", "real"],
      "string"  => ["varchar", "character varying", "text", /character\svarying\(\d+\)/, /char\s*\(\d+\)/, /character\s*\(\d+\)/],
      "boolean" => ["boolean"],
      "date"    => [
        "timestamptz",
        "timestamp with time zone",
        "timestamp without time zone"
      ]
    }
  end

  def convert_to_db_type
    cartodb_types = get_cartodb_types

    if cartodb_types.keys.include?(downcase)
      case downcase
      when "number"
        "double precision"
      when "string"
        "text"
      else
        cartodb_types[downcase].first
      end
    else
      downcase
    end
  end

  # {"integer"=>:number, "real"=>:number, "varchar"=>:string, "text"=>:string, "timestamp"=>:date, "boolean"=>:boolean}
  def convert_to_cartodb_type
    inverse_types = get_cartodb_types.invert.inject({}){ |h, e| e.first.each{ |k| h[k] = e.last }; h}
    if inverse_types.keys.include?(self.downcase)
      inverse_types[self.downcase]
    else
      inverse_types.keys.select{ |t| !t.is_a?(String) }.each do |re|
        if self.downcase.match(re)
          return inverse_types[re]
        end
      end
      self.downcase
    end
  end

  def sanitize_sql
    self.gsub(/\\/, '\&\&').gsub(/'/, "''")
  end

  def sanitize_column_name
    temporal_name = sanitize || ''

    if temporal_name !~ /^[a-zA-Z_]/ ||
      Carto::DB::Sanitize::RESERVED_WORDS.include?(downcase) ||
      CartoDB::RESERVED_COLUMN_NAMES.include?(self.upcase)
      return '_' + temporal_name
    else
      temporal_name
    end
  end

end

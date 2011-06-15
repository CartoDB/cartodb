# coding: UTF-8

class String
  
  POSTGRESQL_RESERVED_WORDS = %W{ ALL ANALYSE ANALYZE AND ANY ARRAY AS ASC ASYMMETRIC AUTHORIZATION BETWEEN BINARY BOTH CASE CAST 
                                  CHECK COLLATE COLUMN CONSTRAINT CREATE CROSS CURRENT_DATE CURRENT_ROLE CURRENT_TIME CURRENT_TIMESTAMP 
                                  CURRENT_USER DEFAULT DEFERRABLE DESC DISTINCT DO ELSE END EXCEPT FALSE FOR FOREIGN FREEZE FROM FULL
                                  GRANT GROUP HAVING ILIKE IN INITIALLY INNER INTERSECT INTO IS ISNULL JOIN LEADING LEFT LIKE LIMIT LOCALTIME 
                                  LOCALTIMESTAMP NATURAL NEW NOT NOTNULL NULL OFF OFFSET OLD ON ONLY OR ORDER OUTER OVERLAPS PLACING PRIMARY 
                                  REFERENCES RIGHT SELECT SESSION_USER SIMILAR SOME SYMMETRIC TABLE THEN TO TRAILING TRUE UNION UNIQUE USER 
                                  USING VERBOSE WHEN WHERE }
  
  
  def blank?
    self !~ /\S/
  end
  
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
  end

  def sanitize
   return if self.blank?
   self.gsub(/<[^>]+>/m,'').normalize.downcase.gsub(/&.+?;/,'-').
        gsub(/[^a-z0-9 _-]/,'-').strip.gsub(/\s+/,'-').gsub(/-+/,'-').
        gsub(/-/,' ').strip.gsub(/ /,'-').gsub(/-/,'_')
  end

  def sanitize_column_name
    temporal_name = self.sanitize
    if temporal_name !~ /^[a-zA-Z_]/ || POSTGRESQL_RESERVED_WORDS.include?(self.upcase)
      return '_' + temporal_name
    else
      temporal_name
    end
  end

end
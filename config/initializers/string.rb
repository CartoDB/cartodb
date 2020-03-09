class String
  def self.random(length=10)
  ('a'..'z').sort_by {rand}[0,length].join
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
end

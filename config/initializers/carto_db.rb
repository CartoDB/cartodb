module CartoDB
  module API
    VERSION_1 = "v1"
  end

  PUBLIC_DB_USER = 'publicuser'
  GOOGLE_SRID = 3857
  SRID        = 4326
  
  USER_REQUESTS_PER_DAY = 10000

  TYPES = {
    "number"  => ["smallint", /numeric\(\d+,\d+\)/, "integer", "real", "double precision"],
    "string"  => ["varchar", "character varying", "text", /character\svarying\(\d+\)/],
    "date"    => ["timestamp", "timestamp without time zone"],
    "boolean" => ["boolean"]
  }
  
  VALID_GEOMETRY_TYPES = %W{ multipolygon point multilinestring multipoint}
  
end
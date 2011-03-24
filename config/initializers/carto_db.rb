module CartoDB

  PUBLIC_DB_USER = 'publicuser'

  GOOGLE_SRID = 3785

  SRID = 4326

  TYPES = {
    "number"  => ["smallint", /numeric\(\d+,\d+\)/, "integer", "real", "double precision"],
    "string"  => ["varchar", "character varying", "text", /character\svarying\(\d+\)/],
    "date"    => ["timestamp", "timestamp without time zone"],
    "boolean" => ["boolean"]
  }

  module API

    VERSION_1 = "v1"

  end

end
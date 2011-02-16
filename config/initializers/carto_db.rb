module CartoDB
  TYPES = {
    "number"  => ["integer", "real", "double precision"],
    "string"  => ["varchar", "character varying", "text"],
    "date"    => ["timestamp", "timestamp without time zone"],
    "boolean" => ["boolean"]
  }
end
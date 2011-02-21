module CartoDB
  TYPES = {
    "number"  => ["integer", "real", "double precision"],
    "string"  => ["varchar", "character varying", "text", "character varying(255)"],
    "date"    => ["timestamp", "timestamp without time zone"],
    "boolean" => ["boolean"]
  }
end
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
  
  POSTGRESQL_RESERVED_WORDS = %W{ ALL ANALYSE ANALYZE AND ANY ARRAY AS ASC ASYMMETRIC AUTHORIZATION BETWEEN BINARY BOTH CASE CAST 
                                  CHECK COLLATE COLUMN CONSTRAINT CREATE CROSS CURRENT_DATE CURRENT_ROLE CURRENT_TIME CURRENT_TIMESTAMP 
                                  CURRENT_USER DEFAULT DEFERRABLE DESC DISTINCT DO ELSE END EXCEPT FALSE FOR FOREIGN FREEZE FROM FULL
                                  GRANT GROUP HAVING ILIKE IN INITIALLY INNER INTERSECT INTO IS ISNULL JOIN LEADING LEFT LIKE LIMIT LOCALTIME 
                                  LOCALTIMESTAMP NATURAL NEW NOT NOTNULL NULL OFF OFFSET OLD ON ONLY OR ORDER OUTER OVERLAPS PLACING PRIMARY 
                                  REFERENCES RIGHT SELECT SESSION_USER SIMILAR SOME SYMMETRIC TABLE THEN TO TRAILING TRUE UNION UNIQUE USER 
                                  USING VERBOSE WHEN WHERE }
  
end
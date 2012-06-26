module CartoDB
  
  def self.session_domain
    APP_CONFIG[:session_domain]
  end
  
  def self.secret_token
    APP_CONFIG[:secret_token]
  end
  
  def self.domain
    @@domain ||= if Rails.env.production?
      `hostname -f`.strip
    elsif Rails.env.development?
      "vizzuality#{session_domain}"
    else
      "vizzuality#{session_domain}"      
    end
  end
  
  def self.hostname
    @@hostname ||= if Rails.env.production?
      "https://#{domain}"
    elsif Rails.env.development?
      "http://#{domain}:3000"
    else
      "http://#{domain}:53716"      
    end
  end
  
  def self.account_host
    APP_CONFIG[:account_host]
  end
  
  def self.account_path
    APP_CONFIG[:account_path]
  end
  
  module API
    VERSION_1 = "v1"
  end

  PUBLIC_DB_USER  = 'publicuser'
  TILE_DB_USER    = 'tileuser'
  GOOGLE_SRID     = 3857
  SRID            = 4326
  USER_REQUESTS_PER_DAY = 10000

  TYPES = {
    "number"  => ["smallint", /numeric\(\d+,\d+\)/, "integer", "bigint", "decimal", "numeric", "double precision", "serial", "big serial", "real"],
    "string"  => ["varchar", "character varying", "text", /character\svarying\(\d+\)/, /char\s*\(\d+\)/, /character\s*\(\d+\)/],
    "date"    => ["timestamp", "timestamp without time zone"],
    "boolean" => ["boolean"]
  }
  
  NEXT_TYPE = {
    "number" => "double precision",
    "string" => "text"
  }
  
  VALID_GEOMETRY_TYPES = %W{ multipolygon point multilinestring}
  
  POSTGRESQL_RESERVED_WORDS = %W{ ALL ANALYSE ANALYZE AND ANY ARRAY AS ASC ASYMMETRIC AUTHORIZATION BETWEEN BINARY BOTH CASE CAST 
                                  CHECK COLLATE COLUMN CONSTRAINT CREATE CROSS CURRENT_DATE CURRENT_ROLE CURRENT_TIME CURRENT_TIMESTAMP 
                                  CURRENT_USER DEFAULT DEFERRABLE DESC DISTINCT DO ELSE END EXCEPT FALSE FOR FOREIGN FREEZE FROM FULL
                                  GRANT GROUP HAVING ILIKE IN INITIALLY INNER INTERSECT INTO IS ISNULL JOIN LEADING LEFT LIKE LIMIT LOCALTIME 
                                  LOCALTIMESTAMP NATURAL NEW NOT NOTNULL NULL OFF OFFSET OLD ON ONLY OR ORDER OUTER OVERLAPS PLACING PRIMARY 
                                  REFERENCES RIGHT SELECT SESSION_USER SIMILAR SOME SYMMETRIC TABLE THEN TO TRAILING TRUE UNION UNIQUE USER 
                                  USING VERBOSE WHEN WHERE XMIN XMAX }
  
  LAST_BLOG_POSTS_FILE_PATH = "#{Rails.root}/public/system/last_blog_posts.html"

  ERROR_CODES = {
    1000 => 'File I/O error',
    1001 => 'Unable to open file',
    1002 => 'Unsupported file type',
    1003 => 'Decompression error',
    1004 => 'File encoding error',
    1005 => 'Zero byte file',
    1006 => 'Invalid SHP file',
    1007 => 'Multifile import errors',
    2000 => 'File conversion errors',
    3000 => 'Geometry error',
    3004 => 'Unable to read SHP file',
    3005 => 'SHP to PGSQL error',
    3006 => 'CSV to PGSQL error',
    3007 => 'JSON may not be valid GeoJSON',
    3100 => 'Projection error',
    3101 => 'Missing projection (.prj) file',
    3102 => 'Unsupported projection',
    3110 => 'Unable to force geometry to 2-dimensions',
    3200 => 'Unsupported geometry type',
    3201 => 'Geometry Collection not supported',
    4000 => 'Raster errors',
    4001 => 'Raster import error',
    5000 => 'Database import error',
    5001 => 'Empty table',
    5002 => 'Reserved column names',
    6000 => 'OSM data import error',
    8000 => 'CartoDB account error',
    8001 => 'Over account storage limit, please upgrade',
    8002 => 'Over account table limit, please upgrade',
    99999 => 'Unknown' }
end
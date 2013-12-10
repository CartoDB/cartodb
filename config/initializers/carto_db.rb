module CartoDB

  def self.session_domain
    Cartodb.config[:session_domain]
  end

  def self.secret_token
    Cartodb.config[:secret_token]
  end

  def self.domain
    @@domain ||= if Rails.env.production? || Rails.env.staging?
      `hostname -f`.strip
    elsif Rails.env.development?
      "vizzuality#{session_domain}"
    else
      "test#{session_domain}"
    end
  end

  def self.hostname
    @@hostname ||= if Rails.env.production? || Rails.env.staging?
      "https://#{domain}"
    elsif Rails.env.development?
      "http://#{domain}:3000"
    else
      "http://#{domain}:53716"
    end
  end

  def self.account_host
    Cartodb.config[:account_host]
  end

  def self.account_path
    Cartodb.config[:account_path]
  end

  module API
    VERSION_1 = "v1"
  end

  PUBLIC_DB_USER  = 'publicuser'
  PUBLIC_DB_USER_PASSWORD  = 'publicuser'
  TILE_DB_USER    = 'tileuser'
  GOOGLE_SRID     = 3857
  SRID            = 4326
  USER_REQUESTS_PER_DAY = 10000

  TYPES = {
    "number"  => ["smallint", /numeric\(\d+,\d+\)/, "integer", "bigint", "decimal", "numeric", "double precision", "serial", "big serial", "real"],
    "string"  => ["varchar", "character varying", "text", /character\svarying\(\d+\)/, /char\s*\(\d+\)/, /character\s*\(\d+\)/],
    "boolean" => ["boolean"],
    "date"    => [
      "timestamptz",
      "timestamp with time zone",
      "timestamp without time zone"
    ]
  }

  NEXT_TYPE = {
    "number" => "double precision",
    "string" => "text"
  }

  VALID_GEOMETRY_TYPES = %W{ geometry multipolygon point multilinestring }

  POSTGRESQL_RESERVED_WORDS = %W{ ALL ANALYSE ANALYZE AND ANY ARRAY AS ASC ASYMMETRIC AUTHORIZATION BETWEEN BINARY BOTH CASE CAST
                                  CHECK COLLATE COLUMN CONSTRAINT CREATE CROSS CURRENT_DATE CURRENT_ROLE CURRENT_TIME CURRENT_TIMESTAMP
                                  CURRENT_USER DEFAULT DEFERRABLE DESC DISTINCT DO ELSE END EXCEPT FALSE FOR FOREIGN FREEZE FROM FULL
                                  GRANT GROUP HAVING ILIKE IN INITIALLY INNER INTERSECT INTO IS ISNULL JOIN LEADING LEFT LIKE LIMIT LOCALTIME
                                  LOCALTIMESTAMP NATURAL NEW NOT NOTNULL NULL OFF OFFSET OLD ON ONLY OR ORDER OUTER OVERLAPS PLACING PRIMARY
                                  REFERENCES RIGHT SELECT SESSION_USER SIMILAR SOME SYMMETRIC TABLE THEN TO TRAILING TRUE UNION UNIQUE USER
                                  USING VERBOSE WHEN WHERE XMIN XMAX }

  LAST_BLOG_POSTS_FILE_PATH = "#{Rails.root}/public/system/last_blog_posts.html"

  IMPORTER_ERROR_CODES = {
    1000 => {
      title: 'File I/O error',
      what_about: "Something seems to be wrong with the file you uploaded. Check that it is loading fine locally and try uploading it again."
    },
    1001 => {
      title: 'Download error',
      what_about: "The remote URL returned an error. Please verify your file is available at that URL."
    },
    1002 => {
      title: 'Unsupported file type',
      what_about: "Should we support this filetype? Let us know in our <a href='mailto:support-suggestions@cartodb.com'>support email</a>!"
    },
    1003 => {
      title: 'Decompression error',
      what_about: "The archive you uploaded didn't seem to unpack properly. Try recreating it from the original files again and uploading the new version."
    },
    1005 => {
      title: 'Zero byte file',
      what_about: "The file appears to have no information. Double check using a local tool such as QGIS that the file is indeed correct. If everything appears fine, try uploading it again or <a href='mailto:support@cartodb.com?subject=Zero byte file'>contact us</a>."
    },
    1006 => {
      title: 'Invalid SHP file',
      what_about: "Your file appears broken. Double check that all the necessary parts of the file are included in your ZIP archive (including .shp, .prj etc.). Also, try opening the file locally using QGIS or another tool. If everything appears okay, <a href='mailto:support@cartodb.com?subject=Invalid SHP file'>contact us</a>."
    },
    1008 => {
      title: 'Unable to download file',
      what_about: "We couldn't download your file, check the URL and try again."
    },
    1009 => {
      title: 'OpenStreetMaps API limit reached',
      what_about: "You requested too many nodes (limit is 50000). Either request a smaller area, or use planet.osm"
    },
    1010 => {
      title: 'Private Google Spreadsheet',
      what_about: "This spreadsheet seems to be private. Please check in Goolge Spreadsheet sharing options that the file is public or accessible for those who know the link"
    },
    2001 => {
      title: 'Unable to load data',
      what_about: "We couldn't load data from your file into the database.  Please <a href='mailto:support@cartodb.com?subject=Import load error'>contact us</a> and we will help you to load your data."
    },
    2002 => {
      title: 'Encoding detection error',
      what_about: "We couldn't detect the encoding of your file. Please <a href='mailto:support@cartodb?subject=Encoding error in import'>contact us</a> and we will help you to load your data."
    },
    3007 => {
      title: 'JSON may not be valid GeoJSON',
      what_about: "We can only import GeoJSON formated JSON files. See if the source of this data supports GeoJSON or another file format for download."
    },
    3008 => {
      title: 'Unknown SRID',
      what_about: "The SRID of the provided file it's not in the spatial_ref_sys table. You can get rid of this error inserting the SRID specific data in the spatial_ref_sys table."
    },
    3009 => {
      title: 'SHP Normalization error', 
      what_about: "We where unable to detect the encoding or projection of your Shapefile. Try converting the file to UTF-8 and a 4326 SRID"
    },
    3101 => {
      title: 'Missing projection (.prj) file',
      what_about: "CartoDB needs a PRJ file for all Shapefile archives uploaded. Contact your data provider to see about aquiring one if it was missing. Otherwise see spatialreference.org to locate the right one if you know it. Remember, the file name for your .prj must be the same as your .shp."
    },
    3201 => {
      title: 'Geometry Collection not supported',
      what_about: "We are working to support more formats every day, but currently we cannot take mixed geometry types. Take a look at your data source and see if other formats are available, otherwise, look into tools like OGR to split this file into valid ESRI Shapefiles prior to importing. "
    },
    3202 => {
      title: 'Empty KML', 
      what_about: "This KML doesn't include actual data, but a link to another KML with the data. Please extract the URL from this KML and try to import it"
    },
    8001 => {
      title: 'Over account storage limit, please upgrade',
      what_about: "To upgrade your account, go to your Dashboard and click Settings. Click 'Upgrade your server'. Follow the directions for choosing a larger size and setting up your payment information."
    },
    8002 => {
      title: 'Over account table limit, please upgrade',
      what_about: "To upgrade your account, go to your Dashboard and click Settings. Click 'Upgrade your server'. Follow the directions for choosing a larger size and setting up your payment information."
    },
    8003 => {
      title: 'Error creating table from SQL query',
      what_about: "We couldn't create a table from your query. Please check it doesn't return duplicate column names. Please <a href='mailto:support@cartodb.com?subject=Unknown error'>contact us</a> if you need help editing your query."
    },
    8004 => {
      title: 'Merge with unmatching column types',
      what_about: "The columns you have chosen don't have the same column type in both tables. Please change the types so the columns will have the same type and try again."
    },
    99999 => {
      title: 'Unknown',
      what_about: "Sorry, something went wrong and we're not sure what. Try
      uploading your file again, or <a href='mailto:support@cartodb.com?subject=Unknown error'>contact us</a> and we'll try to help you quickly."
    }
  }
end


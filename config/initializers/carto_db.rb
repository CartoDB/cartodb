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

  IMPORTER_ERROR_CODES = {
    1000 => { 
      title: 'File I/O error', 
      what_about: "Something seems to be wrong with the file you uploaded. Check that it is loading fine locally and try uploading it again."
    },
    1001 => { 
      title: 'Unable to open file', 
      what_about: "Something seems to be wrong with the file you uploaded. Check that it is loading fine locally and try uploading it again."
    },
    1002 => { 
      title: 'Unsupported file type', 
      what_about: "Should we support this filetype? Email our user thread and let us know!"
    },
    1003 => { 
      title: 'Decompression error', 
      what_about: "The archive you uploaded didn't seem to unpack properly. Try recreating it from the original files again and uploading the new version."
    },
    1004 => { 
      title: 'File encoding error',
      what_about: "CartoDB tried to make the encoding of your file work but failed. Try changing the encoding locally first to something sure to work. For reference see. https://vimeo.com/32228078."
    },
    1005 => { 
      title: 'Zero byte file',
      what_about: "The file appears to have no information. Double check using a local tool such as QGIS that the file is indeed correct. If everything appears fine, try uploading it again or emailing our support thread."
    },
    1006 => {
      title: 'Invalid SHP file',
      what_about: "Your file appears broken. Double check that all the necessary parts of the file are included in your ZIP archive (including .shp, .prj etc.). Also, try opening the file locally using QGIS or another tool. If everything appears okay, email our support thread."
    },
    1007 => {
      title: 'Multifile import errors',
      what_about: ""
    },
    2000 => {
      title: 'File conversion errors',
      what_about: "To process your file, we tried to convert it to a more common geospatial format and failed. Try converting it to a Shapefile or a CSV locally before you upload."
    },
    3000 => {
      title: 'Geometry error',
      what_about: "There were problems processing the geometry data in your file. Check that it opens locally first, using QGIS or other first. It is always good to try other file formats if the first attempt fails."
    },
    3004 => {
      title: 'Unable to read SHP file',
      what_about: "Try opening your SHP file locally first using a tool like QGIS. If that doesn't work, submit a question to our user thread."
    },
    3005 => {
      title: 'SHP to PGSQL error',
      what_about: "There was a problem reading your Shapefile. Try opening it locally and check that all files are included in the ZIP you are uploading."
    },
    3006 => {
      title: 'CSV to PGSQL error',
      what_about: "There was a problem reading your CSV. Try opening it locally and check that it is a valid CSV. If you can't find anything wrong, contact us on the user thread and we will try to find a solution."
    },
    3007 => {
      title: 'JSON may not be valid GeoJSON',
      what_about: "We can only import GeoJSON formated JSON files. See if the source of this data supports GeoJSON or another file format for download."
    },
    3100 => {
      title: 'Projection error',
      what_about: "Try converting your file to a common projection, such as EPSG:4326, prior to uploading. You can do that with OGR or QGIS."
    },
    3101 => {
      title: 'Missing projection (.prj) file',
      what_about: "CartoDB needs a PRJ file for all Shapefile archives uploaded. Contact your data provider to see about aquiring one if it was missing. Otherwise see spatialreference.org to locate the right one if you know it. Remember, the file name for you .prj must be the same as you .shp."
    },
    3102 => {
      title: 'Unsupported projection',
      what_about: "The projection (.prj) included with your Shapefile is not one we recognize. Double check that it is correct, if it is, try using OGR to locally convert the file to 4326 prior to upload."
    },
    3110 => {
      title: 'Unable to force geometry to 2-dimensions',
      what_about: "You are trying to upload a shapefile that has more than 2-dimensions, but Unable to force geometry to 2-dimensions"
    },
    3200 => {
      title: 'Unsupported geometry type',
      what_about: "CartoDB currently supports Multi and single versions of Poings, LineStrings, and Polygons. If your data is of another type, try using OGR or another tool to convert it first."
    },
    3201 => {
      title: 'Geometry Collection not supported',
      what_about: "We are working to support more formats every day, but currently we cannot take mixed geometry types. Take a look at your data source and see if other formats are avialable, otherwise, look into tools like OGR to split this file into valid ESRI Shapefiles prior to importing. "
    },
    4000 => {
      title: 'Raster errors',
      what_about: "We don't officially support raster yet but hope to in the future. If you are having a hard time getting your file loaded, be sure that it is a valid GeoTiff and that it opens locally. Otherwise, please report this error to us so we can improve the service."
    },
    4001 => {
      title: 'Raster import error',
      what_about: "We don't officially support raster yet but hope to in the future. If you are having a hard time getting your file loaded, be sure that it is a valid GeoTiff and that it opens locally. Otherwise, please report this error to us so we can improve the service."
    },
    5000 => {
      title: 'Database import error',
      what_about: "This looks like a problem on our end. Try uploading your file again. If that fails, please contact us on the user thread and we will help resolve this promptly."
    },
    5001 => {
      title: 'Empty table',
      what_about: "The file you uploaded resulted in no rows generated. Open it up in a local file editor and see if there is something unexpected."
    },
    5002 => {
      title: 'Reserved column names',
      what_about: "Look through your file and check that all column names are valid. See, http://www.postgresql.org/docs/8.1/static/sql-keywords-appendix.html"
    },
    6000 => {
      title: 'OSM data import error',
      what_about: "CartoDB failed to import your OSM file. Try converting it to another format locally before importing. osm2pgsql is a good commandline utility to convert OSM data."
    },
    8000 => {
      title: 'CartoDB account error',
      what_about: "Sorry, something went wrong. Try refreshing the page and performing an upload again. If the failure persists, please let us know and we'll try to get it fixed immediately."
    },
    8001 => {
      title: 'Over account storage limit, please upgrade',
      what_about: "To upgrade your account, go to your Dashboard and click Settings. Click 'Upgrade your server'. Follow the directions for choosing a larger size and setting up your payment information."
    },
    8002 => {
      title: 'Over account table limit, please upgrade',
      what_about: "To upgrade your account, go to your Dashboard and click Settings. Click 'Upgrade your server'. Follow the directions for choosing a larger size and setting up your payment information."
    },
    99999 => {
      title: 'Unknown',
      what_about: "Sorry, something went wrong and we're not sure what. Try uploading your file again. If not, read through the log here and see if there are some clues. Finally, email our user thread and we'll try to help you quickly."
    }
  }
end


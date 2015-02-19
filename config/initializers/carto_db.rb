module CartoDB

  # Param enforced by app/controllers/application_controller -> ensure_user_domain_param (before_filter)
  def self.extract_subdomain(request)
    self.subdomains_allowed? ? self.extract_subdomain_flexible(request) : self.extract_subdomain_strict(request)
  end

  def self.extract_host_subdomain(request)
    if request.params[:user_domain].nil?
      nil
    else
      request.host.to_s.gsub(self.session_domain, '')
    end
  end

  # Actually the two previous methods return the requested username, not the real subdomain
  def self.extract_real_subdomain(request)
    request.host.to_s.gsub(self.session_domain, '')
  end

  # Warning, if subdomains are allowed includes the username as the subdomain,
  #  but else returns a base url WITHOUT '/u/username'
  def self.base_url(subdomain, org_username=nil)
    protocol = Rails.env.production? || Rails.env.staging? ? 'https' : 'http'

    if self.subdomains_allowed?
      base_url ="#{protocol}://#{subdomain}#{self.session_domain}#{self.http_port}"
      unless org_username.nil?
        base_url << "/u/#{org_username}"
      end
    else
      base_url ="#{protocol}://#{self.session_domain}#{self.http_port}"
    end

    base_url
  end

  def self.hostname
    @@hostname ||= self.get_hostname
  end

  def self.http_port
    @@http_port ||= self.get_http_port
  end

  # Stores the non-user part of the domain (e.g. '.cartodb.com')
  def self.session_domain
    @@session_domain ||= Cartodb.config[:session_domain]
  end

  def self.domain
    @@domain ||= self.get_domain
  end

  # If true, we allow both 'user.cartodb.com' and 'org.cartodb.com/u/user'
  # if false, only cartodb.com/u/user is allowed (and organizations won't work)
  def self.subdomains_allowed?
    @@subdomains_allowed ||= Cartodb.config[:subdomains_allowed]
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

  begin
    CARTODB_REV = File.read("#{Rails.root}/REVISION").strip
  rescue
    CARTODB_REV = nil
  end

  PUBLIC_DB_USER  = 'publicuser'
  PUBLIC_DB_USER_PASSWORD  = 'publicuser'
  TILE_DB_USER    = 'tileuser'
  SRID            = 4326

  # @see services/importer/lib/importer/column.rb -> RESERVED_WORDS
  # @see app/models/table.rb -> RESERVED_COLUMN_NAMES
  POSTGRESQL_RESERVED_WORDS = %W{ ALL ANALYSE ANALYZE AND ANY ARRAY AS ASC ASYMMETRIC AUTHORIZATION BETWEEN BINARY BOTH CASE CAST
                                  CHECK COLLATE COLUMN CONSTRAINT CREATE CROSS CURRENT_DATE CURRENT_ROLE CURRENT_TIME CURRENT_TIMESTAMP
                                  CURRENT_USER DEFAULT DEFERRABLE DESC DISTINCT DO ELSE END EXCEPT FALSE FOR FOREIGN FREEZE FROM FULL
                                  GRANT GROUP HAVING ILIKE IN INITIALLY INNER INTERSECT INTO IS ISNULL JOIN LEADING LEFT LIKE LIMIT LOCALTIME
                                  LOCALTIMESTAMP NATURAL NEW NOT NOTNULL NULL OFF OFFSET OLD ON ONLY OR ORDER OUTER OVERLAPS PLACING PRIMARY
                                  REFERENCES RIGHT SELECT SESSION_USER SIMILAR SOME SYMMETRIC TABLE THEN TO TRAILING TRUE UNION UNIQUE USER
                                  USING VERBOSE WHEN WHERE XMIN XMAX }

  RESERVED_COLUMN_NAMES = %W{ FORMAT CONTROLLER ACTION oid tableoid xmin cmin xmax cmax ctid ogc_fid }

  LAST_BLOG_POSTS_FILE_PATH = "#{Rails.root}/public/system/last_blog_posts.html"

  # @see services/importer/lib/importer/exceptions.rb For mapping between exceptions and errors
  IMPORTER_ERROR_CODES = {
    1 => {
      title: 'Install error',
      what_about: "Something seems to be wrong with the cartodb install. Please <a href='mailto:support@cartob.com?subject=Install error'>contact us</a> and we'll try to fix that quickly."
    },
    1000 => {
      title: 'File I/O error',
      what_about: "Something seems to be wrong with the file you uploaded. Check that it is loading fine locally and try uploading it again."
    },
    1001 => {
      title: 'Download error',
      what_about: "The remote URL returned an error. Please verify your file is available at that URL."
    },
    1002 => {
      title: 'Unsupported/Unrecognized file type',
      what_about: "Should we support this filetype? Let us know in our <a href='mailto:support-suggestions@cartodb.com'>support email</a>!"
    },
    1003 => {
      title: 'Decompression error',
      what_about: "The archive you uploaded didn't seem to unpack properly. Try recreating it from the original files again and uploading the new version."
    },
    1004 => {
      title: 'XLS/XLSX Error',
      what_about: "The XLS/XLSX archive could not be opened or contains data that cannot be imported. Try exporting it into CSV and uploading the CSV instead."
    },
    1005 => {
      title: 'Zero byte file',
      what_about: "The file appears to have no information. Double check using a local tool such as QGIS that the file is indeed correct. If everything appears fine, try uploading it again or <a href='mailto:support@cartodb.com?subject=Zero byte file'>contact us</a>."
    },
    1006 => {
      title: 'Invalid SHP file',
      what_about: "Your file appears broken. Double check that all the necessary parts of the file are included in your ZIP archive (including .shp, .prj etc.). Also, try opening the file locally using QGIS or another tool. If everything appears okay, <a href='mailto:support@cartodb.com?subject=Invalid SHP file'>contact us</a>."
    },
    1007 => {
      title: 'Too many nodes',
      what_about: 'You requested too many nodes. Either request a smaller area, or use planet.osm.'
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
      what_about: "This spreadsheet seems to be private. Please check in Google Spreadsheet sharing options that the file is public or accessible for those who know the link"
    },
    1011 => {
        title: 'Error retrieving data from datasource',
        what_about: "There was an error retrieving data from the datasource. Check that the file/data is still present."
    },
    1012 => {
        title: 'Error connecting to datasource',
        what_about: "There was an error trying to connect to the datasource. This might be caused due to a configuration problem, server being unavaliable, revoked access token or similar cause."
    },
    1013 => {
      title: 'Invalid ArcGIS version',
      what_about: "The specified ArcGIS server runs an unsupported version. Supported versions are 10.1 onwards."
    },
    1014 => {
      title: 'Invalid name',
      what_about: "File name is not valid. Maybe too many tables with similar names. Please change file name and try again."
    },
    1015 => {
      title: 'No results',
      what_about: "Query was correct but returned no results, please change the parameters and run it again."
    },
    1016 => {
      title: 'Dropbox permission revoked',
      what_about: "CartoDB has not permission to access your files at Dropbox. Please import file again."
    },
    1017 => {
      title: 'GDrive file was deleted',
      what_about: "GDrive file was removed and can't be synced, please import file again."
    },
    1018 => {
      title: 'File is password protected',
      what_about: "File is password protected and can't be imported. Please remove password protection or create a new compressed file without password and try again."
    },
    1019 => {
      title: 'Too Many Layers',
      what_about: "The file has too many layers. It can have 50 as maximum." # ./services/importer/lib/importer/kml_splitter.rb
    },
    2001 => {
      title: 'Unable to load data',
      what_about: "We couldn't load data from your file into the database.  Please <a href='mailto:support@cartodb.com?subject=Import load error'>contact us</a> and we will help you to load your data."
    },
    2002 => {
      title: 'Encoding detection error',
      what_about: "We couldn't detect the encoding of your file. Please <a href='mailto:support@cartodb?subject=Encoding error in import'>contact us</a> and we will help you to load your data."
    },
    2003 => {
      title: 'Malformed CSV',
      what_about: "The CSV or converted XLS/XLSX to CSV file contains malformed or invalid characters. Some reasons for this error can be for example multiline header fields or multiline cells at Excel files or unquoted CSV."
    },
    2004 => {
      title: 'Too many columns',
      what_about: "Data has too many columns. You can only import up to 1600 columns. You can delete the columns you're not interested in, or split the file into smaller ones."
    },
    2005 => {
      title: 'Duplicated column',
      what_about: 'Your file has the same header for two or more columns. Please make column names unique and try again.'
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
      what_about: "We were unable to detect the encoding or projection of your Shapefile. Try converting the file to UTF-8 and a 4326 SRID."
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
    6666 => {
      title: 'Dataset too big',
      what_about: "The dataset you tried to import is too big and cannot be processed. If the dataset allows it, you can try splitting it into smaller files and then using the 'Merge Tables' functionality, or contact our support team at <a href='mailto:support@cartodb.com?subject=Dataset%20too%20big%20import%20error'>support@cartodb.com</a>."
    },
    6667 => {
      title: 'Import timed out',
      what_about: "There is been a problem importing your file due to the time is been taking to process it. Please try again and contact us if the problem persist."
    },
    6668 => {
      title: 'Too many table rows',
      what_about: "The resulting table would contain too many rows. Contact our support team at <a href='mailto:support@cartodb.com?subject=Dataset%20too%20many%20table%20rows%20import%20error'>support@cartodb.com</a>."
    },
    6669 => {
      title: 'Too many concurrent imports',
      what_about: "You cannot import more data until one of your active imports finishes. If you need further import slots contact our support team at <a href='mailto:support@cartodb.com?subject=Dataset%20too%20many%20concurrent%20imports%20error'>support@cartodb.com</a>."
    },
    99999 => {
      title: 'Unknown',
      what_about: "Sorry, something went wrong and we're not sure what. Try
      uploading your file again, or <a href='mailto:support@cartodb.com?subject=Unknown error'>contact us</a> and we'll try to help you quickly."
    }
  }

  # "private" methods, not intended for direct usage

  # Allows both 'user.cartodb.com' and 'org.cartodb.com/u/user'
  def self.extract_subdomain_flexible(request)
    if request.params[:user_domain].nil?
      request.host.to_s.gsub(self.session_domain, '')
    else
      request.params[:user_domain]
    end
  end

  # Allows 'org.cartodb.com/u/user' only
  def self.extract_subdomain_strict(request)
    request.params[:user_domain]
  end

  def self.get_hostname
    protocol = Rails.env.production? || Rails.env.staging? ? 'https' : 'http'
    "#{protocol}://#{self.domain}#{self.http_port}"
  end

  def self.get_http_port
    config_port = Cartodb.config[:http_port]
    config_port.nil? ? '' : ":#{config_port}"
  end

  def self.get_domain
    if Rails.env.production? || Rails.env.staging?
      `hostname -f`.strip
    elsif Rails.env.development?
      "vizzuality#{self.session_domain}"
    else
      "test#{self.session_domain}"
    end
  end

end


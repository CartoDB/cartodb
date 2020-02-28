module CartoDB

  NO_ERROR_CODE = nil

  ERROR_SOURCE_CARTODB = 'cartodb'
  ERROR_SOURCE_USER = 'user'
  ERROR_SOURCE_EXTERNAL = 'external'

# @see services/importer/lib/importer/exceptions.rb For mapping between exceptions and errors
# @see https://github.com/CartoDB/docs/edit/master/cartodb-editor.md Whenever you add a relevant error, add there please
  IMPORTER_ERROR_CODES = {
    1 => {
      title: 'Install error',
      what_about: "Something seems to be wrong with the CARTO install. Please <a href='mailto:support@cartob.com?subject=Install error'>contact us</a> and we'll try to fix that quickly.",
      source: ERROR_SOURCE_CARTODB
    },
    1000 => {
      title: 'File I/O error',
      what_about: "Something seems to be wrong with the file you uploaded. Check that it is loading fine locally and try uploading it again.",
      source: ERROR_SOURCE_CARTODB
    },
    1001 => {
      title: 'Download error',
      what_about: "The remote URL returned an error. Please verify your file is available at that URL.",
      source: ERROR_SOURCE_USER
    },
    1002 => {
      title: 'Unsupported/Unrecognized file type',
      what_about: "Should we support this filetype? Let us know in our <a href='mailto:support@carto.com'>support email</a>!",
      source: ERROR_SOURCE_USER
    },
    1003 => {
      title: 'Decompression error',
      what_about: "The archive you uploaded didn't seem to unpack properly. Try recreating it from the original files again and uploading the new version.",
      source: ERROR_SOURCE_USER
    },
    1004 => {
      title: 'XLS/XLSX Error',
      what_about: "The XLS/XLSX archive could not be opened or contains data that cannot be imported. Try exporting it into CSV and uploading the CSV instead.",
      source: ERROR_SOURCE_USER
    },
    1005 => {
      title: 'Empty file',
      what_about: "The file appears to have no processable information. Double check that the file is indeed correct and it contains supported data. If everything appears fine, try uploading it again or <a href='mailto:support@carto.com?subject=Empty file'>contact us</a>.",
      source: ERROR_SOURCE_USER
    },
    1006 => {
      title: 'Invalid SHP file',
      what_about: "Your file appears broken. Double check that all the necessary parts of the file are included in your ZIP archive (including .shp, .prj etc.). Also, try opening the file locally using QGIS or another tool. If everything appears okay, <a href='mailto:support@carto.com?subject=Invalid SHP file'>contact us</a>.",
      source: ERROR_SOURCE_USER
    },
    1007 => {
      title: 'Too many nodes',
      what_about: 'You requested too many nodes. Either request a smaller area, or use planet.osm.',
      source: ERROR_SOURCE_USER
    },
    1008 => {
      title: 'GDrive access forbidden',
      what_about: "Google denied access to GDrive. If you use Google Apps contact your administrator to allow third party Drive applications and try again.",
      source: ERROR_SOURCE_USER
    },
    1009 => {
      title: 'Twitter Server Error',
      what_about: "There was an error connecting to Twitter service to retrieve your tweets. The server might be temporally unavaliable, please try again later.",
      source: ERROR_SOURCE_EXTERNAL
    },
    1011 => {
      title: 'Error retrieving data from datasource',
      what_about: "There was an error retrieving data from the datasource. Check that the file/data is still present.",
      source: ERROR_SOURCE_USER
    },
    1012 => {
      title: 'Error connecting to datasource',
      what_about: "There was an error trying to connect to the datasource. If this problem stays, please contact <a href='mailto:support@carto.com?subject=Error connecting to datasource'>support@carto.com</a>.",
      source: ERROR_SOURCE_EXTERNAL
    },
    1013 => {
      title: 'Invalid ArcGIS version',
      what_about: "The specified ArcGIS server runs an unsupported version. Supported versions are 10.1 onwards.",
      source: ERROR_SOURCE_USER
    },
    1014 => {
      title: 'Invalid name',
      what_about: "File name is not valid. Maybe too many tables with similar names. Please change file name and try again.",
      source: ERROR_SOURCE_USER
    },
    1015 => {
      title: 'No results',
      what_about: "Query was correct but returned no results, please change the parameters and run it again.",
      source: ERROR_SOURCE_USER
    },
    1016 => {
      title: 'Dropbox permission revoked',
      what_about: "CARTO has not permission to access your files at Dropbox. Please import file again.",
      source: ERROR_SOURCE_USER
    },
    1017 => {
      title: 'GDrive file was deleted',
      what_about: "GDrive file was removed and can't be synced, please import file again.",
      source: ERROR_SOURCE_USER
    },
    1018 => {
      title: 'File is password protected',
      what_about: "File is password protected and can't be imported. Please remove password protection or create a new compressed file without password and try again.",
      source: ERROR_SOURCE_USER
    },
    1019 => {
      title: 'Too Many Layers',
      what_about: "The file has too many layers. It can have 50 as maximum.", # ./services/importer/lib/importer/kml_splitter.rb
      source: ERROR_SOURCE_USER
    },
    1020 => {
      title: 'Download timeout',
      what_about: "Data download timed out. Check the source is not running slow and/or try again.",
      source: ERROR_SOURCE_USER
    },
    1021 => {
      title: 'Box permission revoked',
      what_about: "CARTO has not permission to access your files at Box. Please import file again.",
      source: ERROR_SOURCE_USER
    },
    1022 => {
      title: 'All tables were skipped',
      what_about: "You set 'skip' collision strategy and all tables already exist, so nothing was imported.",
      source: ERROR_SOURCE_USER
    },
    1023 => {
      title: 'ArcGIS server misconfiguration',
      what_about: 'We could not import your data from the ArcGIS server. Please contact your ArcGIS server administrator and ensure that the server has the "execute queries capability" enabled.',
      source: ERROR_SOURCE_USER
    },
    1100 => {
      title: 'Download file not found',
      what_about: "Provided URL doesn't return a file (error 404). Please check that URL is still valid and that you can download the file and try again.",
      source: ERROR_SOURCE_USER
    },
    1101 => {
      title: 'Forbidden file URL',
      what_about: "Provided URL returns authentication error. Maybe it's private, or requires user and password. Please provide a valid, public URL and try again.",
      source: ERROR_SOURCE_USER
    },
    1102 => {
      title: 'Unknown server URL',
      what_about: "Provided URL can't be resolved to a known server. Maybe that URL is wrong or behind a private network. Please provide a valid, public URL and try again.",
      source: ERROR_SOURCE_USER
    },
    1103 => {
      title: 'Partial file error',
      what_about: "The resource you are trying to reach is accessible but the file transfer was shorter or larger than expected. This happens when the server first reports an expected transfer size, and then delivers data that doesn't match the previously given size. Please, try again.",
      source: ERROR_SOURCE_USER
    },
    1500 => {
      title: 'Connector error',
      what_about: "The connector used to fetch the resourced failed.",
      source: ERROR_SOURCE_USER
    },
    1501 => {
      title: 'Connectors disabled',
      what_about: "The type of connector you were trying to use is not enabled",
      source: ERROR_SOURCE_USER
    },
    1502 => {
      title: 'Connector invalid parameters',
      what_about: "The connector couldn't be configured because the parameters were not valid.",
      source: ERROR_SOURCE_USER
    },
    2001 => {
      title: 'Unable to load data',
      what_about: "We couldn't load data from your file into the database.  Please <a href='mailto:support@carto.com?subject=Import load error'>contact us</a> and we will help you to load your data.",
      source: ERROR_SOURCE_USER
    },
    2002 => {
      title: 'Encoding detection error',
      what_about: "We couldn't detect the encoding of your file. Please, try saving your file with encoding UTF-8 or <a href='mailto:support@cartodb?subject=Encoding error in import'>contact us</a> and we will help you to load your data.",
      source: ERROR_SOURCE_USER
    },
    2003 => {
      title: 'Malformed CSV',
      what_about: "The CSV or converted XLS/XLSX to CSV file contains malformed or invalid characters. Some reasons for this error can be for example multiline header fields or multiline cells at Excel files or unquoted CSV.",
      source: ERROR_SOURCE_USER
    },
    2004 => {
      title: 'Too many columns',
      what_about: "Data has too many columns. You can only import up to 250 columns. You can delete the columns you're not interested in, or split the file into smaller ones.",
      source: ERROR_SOURCE_USER
    },
    2005 => {
      title: 'Duplicated column',
      what_about: 'Your file has the same header for two or more columns. Please make column names unique and try again.',
      source: ERROR_SOURCE_USER
    },
    2006 => {
      title: 'Encoding error',
      what_about: "There was a problem reading your file. Encoding seems wrong, probably because there's a wrong character. In order to sort it out, open your file with a text editor, save it with encoding UTF-8 and try again.",
      source: ERROR_SOURCE_USER
    },
    2007 => {
      title: 'Encoding error',
      what_about: "The file you tried to import failed due to encoding issues. To fix this, force the encoding of your file using a text editor or a tool like QGis. You just need to export your files in \"UTF-8\" format.",
      source: ERROR_SOURCE_USER
    },
    2008 => {
      title: 'Malformed XLS',
      what_about: "The Excel file has an unsupported format or is corrupt. To fix this, open it and save as CSV or XLSX.",
      source: ERROR_SOURCE_USER
    },
    2009 => {
      title: 'KML without style Id',
      what_about: "The KML file you tried to import failed because a style element doesn't have an ID attribute. To fix this error, please open the file and add an ID to all the style tags.",
      source: ERROR_SOURCE_USER
    },
    2010 => {
      title: 'Incompatible CARTO table',
      what_about: "There was an error when converting your table into a CARTO table. Please <a href='mailto:support@carto.com?subject=CartoDBfy error'>contact us</a> and we will help you to load your data.",
      source: ERROR_SOURCE_USER
    },
    2011 => {
      title: 'Invalid cartodb_id column',
      what_about: "The import failed because your table contains an invalid cartodb_id column. If you want to use it as a primary key, its values must be integers, non-null, and unique. Otherwise, try renaming your current cartodb_id column.",
      source: ERROR_SOURCE_USER
    },
    2012 => {
      title: 'Incompatible schemas',
      what_about: "The import failed because you are trying to overwrite a table but the data you are providing is not compatible with the data that table already has. You may me changing some types or removing a column. Please check and try again",
      source: ERROR_SOURCE_USER
    },
    2013 => {
      title: 'Cannot overwrite table',
      what_about: "The synchronization failed because the destination table could not be overwritten. Please make sure that there are no database objects (e.g: views) that depend on it.",
      source: ERROR_SOURCE_USER
    },
    2014 => {
      title: 'Invalid geometries',
      what_about: "Your file appears to contain invalid geometries. Try opening the file with another GIS tool and checking the geometry validity. If everything appears to be okay, <a href='mailto:support@carto.com?subject=Invalid Geometries'>contact us</a>.",
      source: ERROR_SOURCE_USER
    },
    3007 => {
      title: 'JSON may not be valid GeoJSON',
      what_about: "We can only import GeoJSON formated JSON files. See if the source of this data supports GeoJSON or another file format for download.",
      source: ERROR_SOURCE_USER
    },
    3008 => {
      title: 'Unknown SRID',
      what_about: "The SRID of the provided file it's not in the spatial_ref_sys table. You can get rid of this error inserting the SRID specific data in the spatial_ref_sys table.",
      source: ERROR_SOURCE_USER
    },
    3009 => {
      title: 'SHP Normalization error',
      what_about: "We were unable to detect the encoding or projection of your Shapefile. Try converting the file to UTF-8 and a 4326 SRID.",
      source: ERROR_SOURCE_USER
    },
    3101 => {
      title: 'Missing projection (.prj) file',
      what_about: "CARTO needs a PRJ file for all Shapefile archives uploaded. Contact your data provider to see about aquiring one if it was missing. Otherwise see spatialreference.org to locate the right one if you know it. Remember, the file name for your .prj must be the same as your .shp.",
      source: ERROR_SOURCE_USER
    },
    3201 => {
      title: 'Geometry Collection not supported',
      what_about: "We are working to support more formats every day, but currently we cannot take mixed geometry types. Take a look at your data source and see if other formats are available, otherwise, look into tools like OGR to split this file into valid ESRI Shapefiles prior to importing. ",
      source: ERROR_SOURCE_USER
    },
    3202 => {
      title: 'Empty KML',
      what_about: "This KML doesn't include actual data, but a link to another KML with the data. Please extract the URL from this KML and try to import it",
      source: ERROR_SOURCE_USER
    },
    8001 => {
      title: 'Over account storage limit, please upgrade',
      what_about: "To upgrade your account, go to your Dashboard and click Settings. Click 'Upgrade your server'. Follow the directions for choosing a larger size and setting up your payment information.",
      source: ERROR_SOURCE_USER
    },
    8002 => {
      title: 'You have reached the limit of datasets for your plan. Upgrade your account to get unlimited datasets',
      what_about: "To upgrade your account, go to your Dashboard and click Settings. Click 'Upgrade your server'. Follow the directions for choosing a larger size and setting up your payment information.",
      source: ERROR_SOURCE_USER
    },
    8003 => {
      title: 'Error creating table from SQL query',
      what_about: "We couldn't create a table from your query. Please check it doesn't return duplicate column names. Please <a href='mailto:support@carto.com?subject=Unknown error'>contact us</a> if you need help editing your query.",
      source: ERROR_SOURCE_USER
    },
    8004 => {
      title: 'Merge with unmatching column types',
      what_about: "The columns you have chosen don't have the same column type in both tables. Please change the types so the columns will have the same type and try again.",
      source: ERROR_SOURCE_USER
    },
    8005 => {
      title: "Max layers per map reached",
      what_about: "You can't add more layers to your map. Please upgrade your account.",
      source: ERROR_SOURCE_USER
    },
    8006 => {
      title: "Not enough Twitter credits",
      what_about: "Unfortunately, you don't have enough Twitter credits to proceed. Please contact <a href='mailto:sales@carto.com?subject=Exceeded%20Twitter%20quota'>" \
                  "Sales</a> if you have questions about how to obtain more credits.",
      source: ERROR_SOURCE_USER
    },
    8007 => {
      title: 'Over account maps limit, please upgrade',
      what_about: "To upgrade your account, go to your Dashboard and click Settings. Click 'Upgrade your server'. Follow the directions for choosing a larger size and setting up your payment information.",
      source: ERROR_SOURCE_USER
    },
    8008 => {
      title: 'Over account datasets limit or publication is disabled in your account',
      what_about: "Please contact us at support@carto.com indicating this error code for more information.",
      source: ERROR_SOURCE_USER
    },
    6666 => {
      title: 'Dataset too big',
      what_about: "The dataset you tried to import is too big and cannot be processed. If the dataset allows it, you can try splitting it into smaller files and then append them once imported, or contact our support team at <a href='mailto:support@carto.com?subject=Dataset%20too%20big%20import%20error'>support@carto.com</a>.",
      source: ERROR_SOURCE_USER
    },
    6667 => {
      title: 'Import timed out',
      what_about: "There is been a problem importing your file due to the time is been taking to process it. Please try again and contact us if the problem persist.",
      source: ERROR_SOURCE_CARTODB
    },
    6668 => {
      title: 'Too many table rows',
      what_about: "You cannot import this dataset. The number of rows exceeds the maximum dataset quota permitted " \
                  "for your account. Please contact <a href='mailto:sales@carto.com?subject=Dataset%20too%20many" \
                  "%20table%20rows%20import%20error'>Sales</a> if you have questions about importing this dataset.",
      source: ERROR_SOURCE_USER
    },
    6669 => {
      title: 'Too many concurrent imports',
      what_about: "You cannot import more data until one of your active imports finishes. If you need further import slots contact our support team at <a href='mailto:support@carto.com?subject=Dataset%20too%20many%20concurrent%20imports%20error'>support@carto.com</a>.",
      source: ERROR_SOURCE_USER
    },
    6670 => {
      title: 'Too many named map templates',
      what_about: "You reached the limit on the number of named map templates.",
      source: ERROR_SOURCE_USER
    },
    6671 => {
      title: 'Stuck import job',
      what_about: "The import job was stuck and we marked it as failed. Please try importing again.",
      source: ERROR_SOURCE_CARTODB
    },
    99999 => {
      title: 'Unknown',
      what_about: "Sorry, something went wrong and we're not sure what. Try
      uploading your file again, or <a href='mailto:support@carto.com?subject=Unknown error'>contact us</a> and we'll try to help you quickly.",
      source: ERROR_SOURCE_CARTODB
    }
  }

end


## Import Errors

You may receive an error during the import process when connecting a dataset. This section contains any known error codes, and provides descriptions to help you troubleshoot why your import may have failed. Please [contact us](mailto:support@carto.com) if you need assistance.

The following table contains a list of known errors codes and possible solutions.

<table>
  <thead>
    <tr>
      <th>Code</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1000</td>
      <td>File I/O error - Something seems to be wrong with the file you uploaded. Check that it is loading fine locally and try uploading it again.</td>
    </tr>
    <tr>
      <td>1001</td>
      <td>Download error - The remote URL returned an error. Please verify your file is available at that URL.</td>
    </tr>
    <tr>
      <td>1002</td>
      <td>Unsupported file type - Check our <a href="{{site.importapi_docs}}/guides/importing-geospatial-data/#supported-geospatial-data-formats">list of supported files</a>. See if you can convert your file to one of these file types. If importing from a URL, make sure the remote server is returning the appropriate HTTP Content Type headers for the file type.</td>
    </tr>
    <tr>
      <td>1003</td>
      <td>Decompression error - Try decompressing and regenerating your compressed file on your computer. If that fails, then locate the original file and make a new compressed version.</td>
    </tr>
    <tr>
      <td>1004</td>
      <td>XLS/XLSX Error - The XLS/XLSX archive could not be opened or contains data that cannot be imported. Try exporting it into CSV and uploading the CSV instead.</td>
    </tr>
    <tr>
      <td>1005</td>
      <td>Empty file - The file appears to have no processable information. Double check that the file is indeed correct and that it contains supported data.</td>
    </tr>
    <tr>
      <td>1006</td>
      <td>Invalid SHP file - Your file appears broken. Double check that all the necessary parts of the file are included in your ZIP archive (including .SHP, .PRJ, etc.). Also, try opening the file locally using QGIS or another tool.</td>
    </tr>
    <tr>
      <td>1007</td>
      <td>Too many nodes - You requested too many nodes. Either request a smaller area, or use planet.osm.</td>
    </tr>
    <tr>
      <td>1008</td>
      <td>GDrive access forbidden - Google denied access to GDrive. If you use Google Apps contact your administrator to allow third party Drive applications and try again.</td>
    </tr>
    <tr>
      <td>1009</td>
      <td>Twitter Server Error - There was an error connecting to Twitter service to retrieve your tweets. The server might be temporally unavaliable, please try again later.</td>
    </tr>
    <tr>
      <td>1010</td>
      <td>Not a file - Your import request does not contain a file. Make sure that the request is correctly formatted and/or a file is being posted.</td>
    </tr>
     <tr>
      <td>1011</td>
      <td>Error retrieving data from datasource - There was an error retrieving data from the datasource. Check that the file/data is still present.</td>
    </tr>
    <tr>
      <td>1012</td>
      <td>Error connecting to datasource - There was an error trying to connect to the datasource. If this problem stays, please contact <a href='mailto:support@carto.com?subject=Error connecting to datasource'>support@carto.com</a>.</td>
    </tr>
    <tr>
      <td>1013</td>
      <td>Invalid ArcGIS version - The specified ArcGIS server runs an unsupported version. Supported versions are 10.1 onwards.</td>
    </tr>
    <tr>
      <td>1014</td>
      <td>Invalid name - File name is not valid. Maybe too many tables with similar names. Please change file name and try again.</td>
    </tr>
    <tr>
      <td>1015</td>
      <td>No results - Query was correct but returned no results, please change the parameters and run it again.</td>
    </tr>
    <tr>
      <td>1016</td>
      <td>Dropbox permission revoked - CARTO has no permission to access your files at Dropbox. Please import file again.</td>
    </tr>
    <tr>
      <td>1017</td>
      <td>GDrive file was deleted - GDrive file was removed and can't be synced, please import file again.</td>
    </tr>
    <tr>
      <td>1018</td>
      <td>File is password protected - File is password protected and can't be imported. Please remove password protection or create a new compressed file without password and try again.</td>
    </tr>
    <tr>
      <td>1019</td>
      <td>Too Many Layers - The file has too many layers. It can have 50 as maximum.</td>
    </tr>
    <tr>
      <td>1020</td>
      <td>Download timeout - Data download timed out. Check the source is not running slow and/or try again.</td>
    </tr>
    <tr>
      <td>1021</td>
      <td>Box permission revoked - CARTO has no permission to access your files at Box. Please import file again.</td>
    </tr>
    <tr>
      <td>1100</td>
      <td>Download file not found - Provided URL doesn't return a file (error 404). Please check that URL is still valid and that you can download the file and try again.</td>
    </tr>
    <tr>
      <td>1101</td>
      <td>Forbidden file URL - Provided URL returns authentication error. Maybe it's private, or requires user and password. Please provide a valid, public URL and try again.</td>
    </tr>
    <tr>
      <td>1102</td>
      <td>Unknown server URL - Provided URL can't be resolved to a known server. Maybe that URL is wrong or behind a private network. Please provide a valid, public URL and try again.</td>
    </tr>
    <tr>
      <td>2001</td>
      <td>Unable to load data - We couldn't load data from your file into the database.  Please <a href='mailto:support@carto.com?subject=Import load error'>contact us</a> and we will help you to load your data.</td>
    </tr>
    <tr>
      <td>2002</td>
      <td>Encoding detection error - We couldn't detect the encoding of your file. Please, try saving your file with encoding UTF-8 or <a href='mailto:support@carto?subject=Encoding error in import'>contact us</a> and we will help you to load your data.</td>
    </tr>
    <tr>
      <td>2003</td>
      <td>Malformed CSV - The CSV or converted XLS/XLSX to CSV file contains malformed or invalid characters. Some reasons for this error can be for example multiline header fields or multiline cells at Excel files or unquoted CSV.</td>
    </tr>
    <tr>
      <td>2004</td>
      <td>Too many columns - Data has too many columns. You can only import up to 250 columns.</td>
    </tr>
    <tr>
      <td>2005</td>
      <td>Duplicated column - File has the same header for two or more columns. Please make column names unique and try again.</td>
    </tr>
    <tr>
      <td>2006</td>
      <td>Encoding error - Problem reading the file. Encoding seems wrong, probably because there's a wrong character. In order to sort it out, open your file with a text editor, save it with encoding UTF-8 and try again.</td>
    </tr>
    <tr>
      <td>2007</td>
      <td>Encoding error - The file you tried to import failed due to encoding issues. To fix this, force the encoding of your file using a text editor or a tool like QGis. You just need to export your files in UTF-8 format.</td>
    </tr>
    <tr>
      <td>2008</td>
      <td>Malformed XLS - The Excel file has an unsupported format or is corrupt. To fix this, open it and save as CSV or XLSX.</td>
    </tr>
    <tr>
      <td>2009</td>
      <td>KML without style Id - The KML file you tried to import failed because a style element doesn't have an ID attribute. To fix this error, please open the file and add an ID to all the style tags.</td>
    </tr>
    <tr>
      <td>2010</td>
      <td>Incompatible CARTO table - There was an error when converting your table into a CARTO table. Please <a href='mailto:support@carto.com?subject=CartoDBfy error'>contact us</a> and we will help you load your data.</td>
    </tr>
    <tr>
      <td>2011</td>
      <td>Invalid `cartodb_id` column - The import failed because your table contains an invalid `cartodb_id` column. If you want to use it as a primary key, its values must be integers, non-null, and unique. Otherwise, try renaming your current `cartodb_id` column.</td>
    </tr>
    <tr>
      <td>2012</td>
      <td>Incompatible schemas - The import failed because you are trying to overwrite a table but the data you are providing is not compatible with the data that table already has. You may me changing some types or removing a column. Please check and try again.</td>
    </tr>
     <tr>
      <td>2013</td>
      <td>Cannot overwrite table - The synchronization failed because the destination table could not be overwritten. Please make sure that there are no database objects (e.g: views) that depend on it.</td>
    </tr>
     <tr>
      <td>2014</td>
      <td>Invalid geometries - Your file appears to contain invalid geometries. Try opening the file with another GIS tool and checking the geometry validity.</td>
    </tr>
    <tr>
      <td>3007</td>
      <td>JSON may not be valid GeoJSON - We can only import GeoJSON formated JSON files. See if the source of this data supports GeoJSON or another file format for download.</td>
    </tr>
    <tr>
      <td>3008</td>
      <td>Unknown SRID - The SRID of the provided file it's not in the spatial_ref_sys table. You can get rid of this error inserting the SRID specific data in the spatial_ref_sys table.</td>
    </tr>
    <tr>
      <td>3009</td>
      <td>SHP Normalization error - We were unable to detect the encoding or projection of your Shapefile. Try converting the file to UTF-8 and a 4326 SRID.</td>
    </tr>
    <tr>
      <td>3101</td>
      <td>Missing projection (.prj) file - CARTO needs a PRJ file for all Shapefile archives uploaded. Contact your data provider to see about aquiring one if it was missing. Otherwise see spatialreference.org to locate the right one if you know it. Remember, the file name for your .prj must be the same as your .shp.</td>
    </tr>
    <tr>
      <td>3201</td>
      <td>Geometry Collection not supported - We are working to support more formats every day, but currently we cannot take mixed geometry types. Take a look at your data source and see if other formats are available, otherwise, look into tools like OGR to split this file into valid ESRI Shapefiles prior to importing.</td>
    </tr>
    <tr>
      <td>3202</td>
      <td>Empty KML - This KML doesn't include actual data, but a link to another KML with the data. Please extract the URL from this KML and try to import it.</td>
    </tr>
    <tr>
      <td>8001</td>
      <td>Over account storage limit, please upgrade - To upgrade your account, go to your Dashboard and click Settings. Click 'Upgrade your server'. Follow the directions for choosing a larger size and setting up your payment information.</td>
    </tr>
    <tr>
      <td>8002</td>
      <td>You have reached the limit of datasets for your plan. Upgrade your account to get unlimited datasets - To upgrade your account, go to your Dashboard and click Settings. Click 'Upgrade your server'. Follow the directions for choosing a larger size and setting up your payment information.</td>
    </tr>
    <tr>
      <td>8003</td>
      <td>Error creating table from SQL query - We couldn't create a table from your query. Please check that it doesn't return duplicate column names.</td>
    </tr>
    <tr>
      <td>8004</td>
      <td>Merge with unmatching column types - The columns you have chosen don't have the same column type in both tables. Please change the types so the columns will have the same type and try again.</td>
    </tr>
    <tr>
      <td>8005</td>
      <td>Max layers per map reached - You can't add more layers to your map. Please upgrade your account.</td>
    </tr>
    <tr>
      <td>8006</td>
      <td>Not enough Twitter credits - Unfortunately, you don't have enough Twitter credits to proceed. Please contact <a href='mailto:sales@carto.com?subject=Exceeded%20Twitter%20quota'>Sales</a> if you have questions about how to obtain more credits.</td>
    </tr>
    <tr>
      <td>8007</td>
      <td>Over account maps limit, please upgrade - To upgrade your account, go to your Dashboard and click Settings. Click 'Upgrade your server'. Follow the directions for choosing a larger size and setting up your payment information.</td>
    </tr>
    <tr>
      <td>8008</td>
      <td>Over account public datasets limit or publication is disabled in your account, please contact us at support@carto.com indicating this error code for more information.</td>
    </tr>
    <tr>
      <td>6666</td>
      <td>Dataset too big - The dataset you tried to import is too big and cannot be processed. If the dataset allows it, you can try splitting it into smaller files and then append them once imported, or contact our support team at <a href='mailto:support@carto.com?subject=Dataset%20too%20big%20import%20error'>support@carto.com</a>.</td>
    </tr>
    <tr>
      <td>6667</td>
      <td>Import timed out - There is been a problem importing your file due to the time is been taking to process it. Please try again and contact us if the problem persist.</td>
    </tr>
    <tr>
      <td>6668</td>
      <td>Too many table rows - You cannot import this dataset. The number of rows exceeds the maximum dataset quota permitted for your account. Please contact <a href='mailto:sales@carto.com?subject=Dataset%20too%20many%20table%20rows%20import%20error'>Sales</a> if you have questions about importing this dataset.</td>
    </tr>
    <tr>
      <td>6669</td>
      <td>Too many concurrent imports - You cannot import more data until one of your active imports finishes. If you need further import slots contact our support team at <a href='mailto:support@carto.com?subject=Dataset%20too%20many%20concurrent%20imports%20error'>support@carto.com</a>.</td>
    </tr>
    <tr>
      <td>6670</td>
      <td>Too many map templates - You reached the limit of Named Map templates. If you are programatically generating these templates, check how to delete them in the <a href="{{site.mapsapi_docs}}/guides/quickstart/#named-maps">Maps API documentation</a>. Otherwise, contact our support team at <a href='mailto:support@carto.com?subject=Dataset%20too%20many%20concurrent%20imports%20error'>support@carto.com</a>.</td>
    </tr>
    <tr>
      <td>6671</td>
      <td>Stuck import job - The import job was stuck and we marked it as failed. Please try again and contact our support team at <a href='mailto:support@carto.com?subject=Dataset%20import%20stuck%20error'>support@carto.com</a> if the problem persists.</td>
    </tr>
    <tr>
      <td>99999</td>
      <td>Unknown - Sorry, something went wrong and we're not sure what. Try
      uploading your file again, or <a href='mailto:support@carto.com?subject=Unknown error'>contact us</a> and we'll try to help you quickly.</td>
    </tr>
  </tbody>
</table>

### cURL Commands in Windows

If you are running cURL commands through a PC console, note that Windows only supports double quotes "" for cURL commands.

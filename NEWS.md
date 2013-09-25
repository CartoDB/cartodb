2.1.5
-----
* Fixed Bugs
  * Geometry editing can mess up interactivity layer
  * layergroup should always return 200 when the call is jsonp
  * When there are more layers than legends applied, the layer selector can break the legends
  * Merge tables sets all values the same for every column
  * styles could be overriden in tables created before version 2.1.3.4.2
  * Problem with custom quotas in central
  * Removing a visualization from the dashboard reload the list in a weird order
  * Tables in the 'Create new visualization' window should be by updated_at
  * Contradictory messages when changing a password
  * Trying to create a table from a query fails
  * Support files with Chinese data
  * HTML template generated without the content of the title fields
  * Hide opened infowindow when hiding a layer that has an infowindow opened.
  * Fix enabled/disabled state for sync checkbox in legend editor
  * When you deselect a title from the infowindow fields pane, and then go to the infowindow custom editor, appears the title line empty
  * Problem with IE browsers in compatibility mode
  * https viz.json url redirects to http and it should not
  * if embed is https and uses google maps it is blocked by chrome
  * When entering to this view it says there is a query applied (but not)
  * After editing geometries, interactivity ceases to work
  * when execute a query without the_geom_webmercator styles are not properly reset
  * Error when trying to access the drobox uploader twice
  * Image header template fails when first field selected is null

* Improvements
  * Developer page spelling mistake exited => 'excited'
  * Add Dropbox and file-import tests
  * Unify marker-width with marker fill row on the wizards
  * Improve the way we detect the geometry column on the geojson files

2.1.4
-----
* Fixed Bugs
  * Disabling a layer on a visualization causes interactivity to be obtained from wrong layer
  * If you click over Select fields button in the infowindow when there isn't any field selected should open the right tab pane in infowindow panel
  * Show the blue bar on every table independently until it gets closed by the user.
  * Can't make a density map
  * change wizards according to the geometry type returned by the query
  * assert infowindow doesn't have fields which are not in the table before save
  * When having a SQL applied and clearing it the applied wizard is set to default
  * race condition when query switch from one geometry type to another
  * Not possible to parse geometry type when first rows don't have any geometry
  * When you try to filter by date (using created_at for example), it fails
  * Fix the height of the blocking message in the infowindow editor
  * If you click over Select fields button in the infowindow when there isn't any field selected should open the right tab pane in infowindow panel
  * When the geometry is a polygon instead of a multipolygon, the geometry editor fails
  * [INFOWINDOW] Column names in the title pane should be sorted like in the fields pane
  * Wrong styles when appliying and removing a filter
  * Trying to edit a feature in the map, fails saving the new geometry
  * The cell editing box is not shown in front of the row in Firefox
  * Scrolling down removes "Create table from query" string from the top of a table (in Firefox)
  * A point cannot be edited on a map
  * Wrong wizard thumbnails
  * Autocomplete openning when it shouldn't open
  * Adding a layer from a private table creates a public visualization instead of a private one
  * Only allow to change the titles of the table fields that are active.
  * [infowindow] name change pane should list the fields in the same order than field selector
  * fix available fields when table schema changes on custom infowindows

* Improvement
  * Improve infowindows editor
  * When you have a legend for a choropleth and customize the labels, they get replaced when changed
  * Change title checkbox behaviour in CartoDB application

2.1.3.6
-------
* Fixed Bugs
  * Can't filter by tag when on page >1
  * Export of CSV is failing on many tables
  * On the list to "Add an existing table" the order of the tables there is wrongly sorted
  * Float values on export [again?] 16.2 => 16.199999999999999
  * Don't allow to export to SHP when not having geometries
  * Error on over quota message
  * Fix alignement of the support text with the rest of the dashboard.

* Improvement
  * Optimize commercial website resources (PageSpeed)
  * Improve filter queries
  * Suggestion: different green color for the dashboard message
  * Improve loader indicator of the assets on the assets modal window

2.1.3.5
-------
* Fixed Bugs
  * Add good legend icon. The actual one is wrong
  * Performance problems on map views checking task
  * Problem with embed iframe when it is hidden
  * assert infowindow doesn't have fields which are not in the table before save
  * When having a SQL applied and clearing it the applied wizard is set to default
  * Add the map views checking task to central cron
  * race condition when query switch from one geometry type to another
  * Not possible to parse geometry type when first rows don't have any geometry
  * When you try to filter by date (using created_at for example), it fails
  * If you edit the infowindow HTML and refreshes the page, the HTML doesn't appear again if you activate that pane
  * Fix the color of the active/inactive tab buttons in the Infowindow editor
  * When the "title?" checkbox of a field is modified, the HTML of the Infowindow should change accordingly
  * When closing the blue bar realize of the space available
  * Scroll is appearing when having a pretty small content on the infowindow
  * When applying HTML template null values are not rendered as null (on the CartoDB editor)
  * On the header template the first value is not rendered where it should be. In terms of HTML code
  * Change labels in the intensity map legend

* Improvements
  * Updgrade codemirror
  * Title support in legends
  * Add autocomplete for column names on the HTML infowindow
  * Implement 'blocked' state in the infowindow editor.
  * Select all the used interactivity fields in the Custom HTML editor
  * Generate the infowindow's HTML template based on the selected fields
  * Make the infowindow html pane bigger
  * Add selected infowindow template to HTML editor when is activated
  * Add a div wrapper to all header infowindow templates.
  * Increase the opacity of the white layer when showing the forbidden indicator

2.1.3.4.1
---------
* Improvements:
  * Support for SHP imports in a wide range of projections and encodings
  * Specific support for Cyrillic encoding in SHP and TAB files
  * Improved encoding detection for file imports
* Bugs:
  * Removed POINT default constraint in tables created by an import

2.1.3.4
-------
* Fixed bugs
  * Don't allow to select unsupported formats from Google Drive & Dropbox & filesystem
  * GPX imports produce empty tables
  * Import .tiff files
  * After importing the vacuum full is not being made
  * Importer should not report as failures those files with unsupported formats
  * Importer should ignore unsupported files inside zip files
  * Process multipoint geometries when importing
  * CSVs with polygons don't import correctly
  * Importer failures aren't being handled
  * Import files with ' or " in the name
  * Tune encoding detection in importer
  * Link importer errors to online documentation
  * Raise UnsupportedGeometryCollection error from importer, before cartodbfication
  * CSV normalizer breaks with empty lines
  * Give preference to comma when detecting row delimiter

* Improvements
  * Import Google Docs spreadsheets

2.1.3.3
-------
* Fixed bugs
  * Remove 'support address' behaviour from here
  * Replace updated_at & trial_ends_at with the new flags

* Improvements
  * Save user IP on signup and login

2.1.3.2
-------
* Fixed bugs
  * Color map wizard behaves different than the others
  * Add marker-width to the color wizard
  * Importer is not reporting specific errors, just the generic one
  * Fix Xlsx2Csv
  * Add support for ';' as CSV separator
  * Support CSV files with ^M EOLs (Windows)
  * Support SHP / KMZ from US Drought Monitor Data
  * Fix missing method to mark an import as failed when stuck

* Improvements
  * Upgrade "Color map wizard" to "Category map"
  * Please, advise in this text for color map wizard
  * URL translator for Google Maps URLs

2.1.3.1
-------
* Fixed bugs
  * Add a loader to the thumbnails on the asset window
  * Fix padding in legend editor items
  * There is no way to add an icon for a marker using a URL
  * Not all expected keys save the state of my Legend text
  * Geolocation styles are broken


* Improvements
  * Change to "generating...." state everytime the URL on the share textinput is being generated

2.1.2
-----
- Added legends.
- Dropbox file import.
- Icon and images management. Icons and patterns can be set from the wizards
- The importer component now uses a separate database schema ('cdb_importer') 
  for all imports, with the exception of OSM files. To create the schema in
  existing installations, run:
  ```
  $ bundle exec rake cartodb:db:create_importer_schema
  ```
- Added support for MapInfo files (.tab) in the importer

2.1
---
After updating to 2.1 you'll need to upgrade your system:

```
$ bundle install
$ bundle exec rake db:migrate
$ bundle exec rake cartodb:db:load_functions
$ bundle exec rake cartodb:db:migrate_to[2.1]
```

* Updated the dashboard with a visualizations page
* Changed the way the maps can be shared
* Added visualization with multilayer support
* New color wizard
* Layer selector widget
* Map view stats per visualization

2.0.15
------
* Fixed OSM imports
* General bug fixes

2.0.14
------
* Fixes error when importing OSM files
* Fix error editing color basemap
* Workaround exporting CSV with latitude or longitude column names

2.0.13
------
* Adds booleans filters feature.
* Allows adding filters from the column name tooltip.
* Fixed public table view
* Fixes some importer errors


2.0.12
------
* Adds new filter feature.
* Fixed problem some compressed imports
* Fixed some problems with xls imports

2.0.11
------
* Imports now never get stuck on the UI
* Imports will populate created_at and updated_at fields as strings
  as a fallback if dates cannot be parsed.
* Conversion of a numeric column to date is properly handled, 
  by nullifying data in the column.
* Vizjson now works with and without SSL
* Fixed various errors when changing column types using the UI
* Invalidates varnish cache after column modifications using the UI
* Fixed error when trying to import urls with query string parameters
* Added function CDB_UserTables to get user tables list
* Added function CDB_ColumnType to get a user table column type

2.0.8 (25/03/13)
-----
You'll have to run database migrations and reload sql functions after
upgrating (yep, again, sorry):

bundle exec rake db:migrate
bundle exec rake cartodb:db:load_functions

* Huge importer refactor. Now import jobs shouldn't get stuck.
* Excludes some system tables from user quota calculation.
* Script url is only formed with table name and not id.
* Fixed problem importing files with accents in the name.

2.0.6 (15/03/13)
-----
* If the the_geom value is null, it appears as null in the table and not as GeoJSON.
* Table hover styles fixed.
* Embeding map with an script is possible now (iframe still supported).
* Brand new share window.
* Enable/disable scroll wheel zoom in the embeded maps.
* Revamped visualization wizard's selector.
* Added new cool wizard for point maps: Intensity.
* New upgrade window.
* when converting a column from string type to number type, figures using
  decimal comma and point as grouping separator (e.g. 1.234.567,1234), are 
  appropriately casted to floats using a decimal point separator 
  (e.g. 1234567.1234)

2.0.5 (05/03/13)
-----
* Add new quantification methods, CDB_JenksBins etc.
* Modal confirmation when deletes a row.
* Modal confirmation when deletes a feature in the map.
* Edit geometry window confirmation doesn't stop edition, it is just an advice.

2.0.4 (19/02/13)
-----
You'll need to run database migrations and reload sql functions after upgrating:

bundle exec rake db:migrate
bundle exec rake cartodb:db:load_functions

* Adds a track_updates trigger to keep track of the last time any table is modified
* Persisted updated_at on vizjson, this saves a lot of traffic to the tiler if Varnish crashes or is not running
* Fixes a importer bug when decoding content-disposition http header
* Fixes a bug that causes VACUUM FULL to be run more than once after table creation
* Added 'loading state' for infowindows.
* Replaced submodule URL's with read-only ones
* Adds new merge option: spatial merge.
* Edit fields from the map.

2.0.3 (31/01/13)
-----
* Add cartodb:db:update_test_quota_trigger rake task.
* Added new infowindow theme: 'header with image'.
* Brand new basemap layer selector. 
* Changed user quota calculation method.
* Changed default basemap to Nokia.

2.0.2 (21/01/13)
-----
* Added composite operations combo in style wizards
* The list of public tables has been moved to a new page and is now accesible from the header
* Fixed table pagination animation for new Firefox 18 version
* User deletion now removes all the user data
* Added a VACUUM FULL after table creation
* Fixed error when importing GeoJSON files with wkb_geometry columns
* Removed 20 char table limit on the importer
* Fixed error when importing shapefiles with invalid cartodb_id columns
* Fixed the incorrect "missing prj" error on the importer
* Added 'show/hide' CartoDB logo in embed maps

2.0.1 (5/12/12)
-----
* Fixing a bug when adding a XYZ url as a base layer.
* Embed maps now should work on IE10
* Fixed bugs when changing the password.
* Fixed a bug with disappearing CartoCSS/InfoWindow buttons after a failed query.
* Feature creation added.
* Fixed bugs with vizz.json invalidation.
* Fixed bugs with the geocoding dialog.
* Increased number of tables per page on the dashboard and fixed bugs on the dashboard.
* Filling empty boolean columns with null values.
* Deactivate KML and SHP when not having geometries selected.
* Fixed a bug when renaming a table.
* Adding loader events when deleting features from the map.
* Fixed a bug with the sign-in on FF 15.0.1

2.0.0 (30/11/12)
-----
* CartoDB 2.0

2.5.6
-----
* Improvement
  * Allow to customize the colors and its number on the choropleth legend.

* Fixed Bugs
  * Make infowindow keep state for a SQL query.
  * Custom infowindow with image is not adding correctly <img> tag.
  * Fixed redis configuration in sync tables.

2.5.5
-----
* Improvements
  * Move varnish triggers from user tables to CDB_TableMetadata (#241)
  * Changed empty dashboard page

2.5.4
-----
* Improvements
  * Implemented Torque accumulative visualization.
  * Faster CDB_TransformToWebmercator when input is already mercator.
  * Added the type of the columns shown on the column selector for the filters.
  * Added autocomplete in legends.
  * Way to Activate/deactivate automatic geocoder.
  * Running the testsuite is easier now.
  * Disabled geocoder on sync tables.
  * Enabled default max/min zoom for google basemaps.
  * Deprecated the getLayerByIndex method and added a more descriptive one.

* Fixed Bugs
  * Torque visualization doesn't work as expected for a multiday GPS track.
  * Table rename errors aren't shown in the UI.
  * Torque visualizations under IE9 + Windows 7 are not showing canvas layer.
  * Density legend is not showing the min,max values. It's showing left and right value.
  * Sanitize in-cell line breaks (<8d> unicode character) when processing CSV and Excel files.
  * When moving from CategoryLegend to CustomLegend, copy the items.
  * Removed the persist param on calls to tiles at cartodb.js
  * Deactivate zoom when not having more levels available.
  * Unix timestamp not being correctly converted to date (#290).
  * Changed ZXY url to XYZ.
  * Selecting an Intensity Wizard disables the associated legend.
  * User can't add a Mapbox basemap.
  * Clean up Importer2::Ogr2ogr spec.
  * last_visualization_created_at is causing a ton of queries.
  * Layers visibility is not working in embed map.
  * Explain that a user needs to publicly share a file in GDrive before importing.
  * Label allow-overlap changed to toggle on the Wizards.
  * Fixed broken acceptance specs.
  * Fixed typo in carto_db.rb (by @robinkraft #301).

2.5.3
-----
* Improvements
  * Start storing the api_key in the database.
  * Created a rake task that copies the api_key from redis to PSQL.
    * Existing installations, please run:
    ```
    $ bundle exec rake cartodb:db:copy_api_keys_from_redis
    ```
  * Improved sprite compilation time + CSS rendering
  * Created a notification model.
  * Re-enable save_metadata during user after_save.

* Fixed Bugs
  * GMaps attribution is above Legend when it is applied.
  * Date filters depend on the system timezone.
  * Query box: field suggestion menu goes out of the canvas.
  * Deactivate by default layer-selector when visualization has only one layer.
  * Deactivate by default legend when none of the layers has a legend applied.
  * Drop type guess based on column names.
  * When trying to import a file and being overquota it reports an unknown error.
  * Geocoding error on tables with cartodb_georef_status column.
  * Infowindow variables are changed after renaming the table.
  * HTTP is not added on basemap wms.
  * Error saving a cell that contains a date.
  * Views: dashboard: vizs: long description overflows.
  * Change text in filters' tooltip.
  * Pass encoding and shape_encoding as separate options to ogr2ogr.
  * Provide a missing 'down' step for some migrations.
  * Problem applying a polygon-patter-file from simple wizard and changing any value inside CartoCSS editor.
  * [regression] All importable files in a zip file should be imported.

2.5.2
-----
* Improvements
  * WMS / TMS basemap import
  * WMS Proxy Service implementation
  * Better integration with MapBox basemaps

* Fixed Bugs
  * Basemap 404 should throw an error.
  * CSS with exponents is not parsed correctly.
  * Google maps layers should not have max/min zoom.
  * Basemap distribution on the selector is wrong. It should have 3 columns in total.
  * Geocoding error on tables with double-quoted strings.
  * Fixed convert_to_cartodb_type spec.
  * When the geocoder process fails, the progress bar is hidden but no error message is shown up. 
  * Dialog to load a marker is the same than to import a file.

2.5.1
-----
* Improvements 
  * Legend is disabled when "torque" wizard is applied.
  * Dragging the time slider stops the animation, and when dragging ends the animation starts.

* Fixed Bugs
  * Can't open "New table dialog" when quota was full and one table was deleted.
  * If you set an invalid value in a CartoCSS property, it is displayed in the wizard.
  * New category wizard may reset previous configurations.
  * If two layers, one torque, and leaflet, data appears moved in the embed at certain zoom levels.
  * In the category wizard if the column is changed the 'Getting colors' text appears twice.
  * In a table made of points, if you apply a torque visualization and then create a visualization within that table, time slider stops working.
  * 'select fields' button within infowindow doesn't work when a visualization is created from a table.
  * In a points table, with torque wizard applied, if you want to add a new layer (not another torque table), it isn't converted to a visualization.
  * Right module links in api keys or oauth pages are broken.
  * Torque layer doesn't add CartoDB logo in the visualization.
  * It's no longer possible to remove tags from a visualization or a table.
  * Geocoding bar continues spinning after a geocoding failure.
  * Fix typo in support browsers for torque layer.
  * Add 120px more to the public iframe.
  * Fixed CartoDB test suite.
  * Map is not refreshed after editing a field on the map view.

2.5.0
-----
* Improvements
  * Time-animated visualization wizard (torque).
  * Adapt torque timeline to the screen in mobile.
  * Created a migration to add timezone to timestamp models columns.
  * Added database_host attribute to user model.
  * Replicate database_password to redis when creating a username.
  * viz.json includes https urls in embeds.
  * Improved privacy in torque visualizations.
  * Clean headers from tiler/varnish/nginx.
  * Created support dialog in embed page when torque layer is applied.
  * Added cartodb:test:prepare rake task and document its usage for testing.
  * User configuration change: sql_api config names normalization.
    Change the following sql_api parameters in the config/app_config.yml file in current installations:
    - sql_api_protocol -> protocol
    - sql_api_domain -> domain
    - sql_api_endpoint -> endpoint
    - sql_api_port -> port

* Fixed Bugs
  * Embed layer selector should show torque layers.
  * Trying to 'Duplicate' or 'Table from query' when tables over quota doesn't give back a reasonable error.
  * If you cancel a file upload the close button is not being shown anymore on the new table window.
  * Removed table api_keys from rails migration.
  * Revamp basemap selector.
  * Infowindows don't show any content when they contain a column name which is a reserved SQL word.
  * Reviewed table and map styles using new Safari under Mavericks system.
  * Clear filter on the filters panel layout is broken in safari + mavericks.
  * Out of sync between steps and time slider.
  * Columns with an unique value does not render anything.
  * Basemap selector dropdown lost the right border radius and has the wrong caption under the 'Add yours' button.
  * Scrubbar dissapears when going from map to table and then back to map.
  * Exporting doesn't include the subdomain.
  * Line breaks on geocoding strings cause geocoder to crash.
  * Cancelling a geocoding job is not working sometimes.
  * Numeric type is not well mapped.
  * Sublayer_options make embed fails.
  * Prevent layergroup GETs to be cached.

2.4.0
-----
* Improvements
  * Allow to set an image to each category, not only a color.
  * Display remote URL in synchronization options modal window.
  * Add new basemaps to the list.
  * Implement geocoding API on CartoDB.
  * Use different schema for temporal geocoding tables.
  * Improve the way we detect the date columns.
  * Implement interface to HERE geocoding API.
  * Implement CartoDB bindings to HERE interface.
  * Link the new geocoding API to the UI.
  * Change timestamps by timestamptz.

* Fixed Bugs
  * Allow image besides of color in the legends.
  * False values in color wizard are interpreted as null in the legends.
  * Add privacy explanation on the create new table window.
  * Test category wizard, checking old color wizard applied.
  * Layout error when searching tables.
  * Remove marker-allow-overlap property from choropleth points wizard.
  * Fix header visualization frontend tests.
  * Add .tsv to supported import formats.
  * Implement changes on the georeference window UI.
  * Rename a table with capital letter fails.
  * NAD83 Projection not working.
  * When changing sync table freq you need to reload in order to get the correct "next sync time".
  * Dropbox 401 gets imported on sync tables.
  * Dashboard URL with parameters makes the page to fail partially.
  * Add .txt .tsv to the list of supported extensions in the importer.
  * HTML problem with geocoding limit copy.
  * Each time you open sync "view options", the dropdown removes first option.
  * Dashboard pagination not switching page content.
  * Error while using the wizards.
  * Error on geocoder window when being over quota.
  * Make CDB_UserTables test more stable by ordering multirecord results.
  * Add "make check" rule.
  * Features/cdb transform to webmercator improvement.

2.3.2
-----
* Improvements
  * Color the 'empty' message in the legend title in a subtle gray
  * chrolopleth for points
  * Hookup importer checksum mechanisms with synchronizations
  * Force follow redirects in importer
  * Update run_at when changing synchronization interval of a table

* Fixed Bugs
  * Generate the_geom only from wkb_geometry for SHPs
  * Create your first table button does not work
  * If a sync table is added to a visualization, we don't provide any information about this current layer (synced table)
  * Timezone skew on sync tables display
  * Update Sync table table UI components
  * When deleting a table that is syncronized a message with a warning is displayed and is not neccesary
  * Support alternative formats for Google Fusion Tables urls
  * Show when a sync table will be synced again in the dashboard
  * Add privacy explanation on the create new table window
  * Fix visualizations list in Safari under Mavericks
  * Import successful stopped working
  * Trying to add a row after passed the quota limit returns a ugly error
  * In a synced table, when the next sync is in a hour, the a letter appear as capital.
  * Display 'Next sync will be in a few minutes' when run_at is in the past
  * If legend title is empty and you fill it, it should enable by default
  * Trivial typo within table rename (by @rfc2616)

2.3.1
-----
* Improvements
  * A way to change the name of the layers used in a visualization
  * Update CDB_UserTables() to return name, permissions
  * Possibility of adding a pattern image as map background.
  * Load OSM files through ogr2ogr
  * [importer] Use PROMOTE_TO_MULTI as geometry when loading files through ogr2ogr

* Fixed Bugs
  * More than one upgrade message on dashboard
  * Can't see the trial reminder when having 0 tables
  * Tiles from private tables can be seen without api_key
  * Wrong error message when being over table or disk quota
  * Changing the api key doesn't invalidate requests with the old api key
  * Hook-up importer cache mechanisms with synchronizations
  * Sync dialog is not shown when importing a csv from dropbox (private file)
  * Labels on the intensity map legend shouldn't be synced never
  * Replace 'sync' term in the legend editor with 'lock'
  * Change side of the dropbox and gdrive buttons, they will be at right, and when any file is selected, move them to left
  * Dashboard table's sync indicator is not aligned correctly.
  * '...' is missing from the Sync tables item on the table options menu
  * Change pulse animation for synced tables
  * Timezone skew on sync tables display
  * When sync table fails, error should be red or other color
  * Change new CartoDB text border opacity from embed maps
  * If the gdrive api_key is empty don't show the gdrive import tab
  * [importer] Make Content-Disposition regex more permissive
  * The "Error with sync" link in the dashboard should stop the propagation of the click
  * Google Drive API key shouldn't be needed on Development
  * Fix current front-end failed tests
  * Table names within layer selector in embed view should be the table name alias if they are available
  * Merging numeric columns throws an error

2.3.0
-----
* Improvements
  * Finished google drive integration on Create / add new layer modal window
  * Big CSV fixture generator
  * Prototype an EventMachine-based dispatcher to poll remote files
  * Get synctables configuration (sources, intervals, next poll) from Postgres
  * Optimize sync-tables download based on Last-Modified and ETag
  * Work on Sync tables UI changes
  * Implement synctables endpoint
  * We need a flag to know if a user can create sync tables or not
  * Configure long-running process for sync-tables
  * Implemented sync indicator in dashboard tables.
  * Implemented new 'sync table' option for new tables dialog
  * Implemented necessary changes in table view when it is sync type
  * Improve loader indicator of the assets on the assets modal window
  * Add comma separators on the row count on the dashboard
  * Add Create your own maps with CartoDB module to the embed maps
  * Improved filter queries
  * After upgrading set the plan property to the user
  * Improved names of stuff sent to mixpanel
  * Find a way to track the first time ever that people enter to their dashboard
  * Extension is being set two times in the mixpanel event for importing (success and failed)
  * Set some parameters to the user for tracking on mixpanel
  * Remove account_type parameter from the user model on mixpanel
  * Access tiler services via 'http' protocol by default.
  * Make point-stroke opacity to 1 by default and with to 2
  * when adding consequtive basemap layers the name of the custom basemap concatenates
  * Users can set more basemaps than 'basemap dropdown' supports
  * Add event for when an user visualizes the dashboard
  * Add new config parameters for GDrive keys

* Fixed Bugs
  * Design all sync tables related stuff
  * The red dot on the sync tables was supposed to be blinking
  * Make the "Create your own custom maps with CartoDB" area less high and add the top-border (similar to the header)
  * Input field errors don't appear
  * Tiles from private tables can be seen without api_key
  * Export of CSV is failing on many tables
  * On the list to "Add an existing table" the order of the tables there is wrongly sorted
  * Float values on export [again?] 16.2 => 16.199999999999999
  * Weird scrolling issue
  * Fix dashboard message animation
  * Error on over quota message
  * Fix alignement of the support text with the rest of the dashboard.
  * Double click over the legend is propagated to the map and zoom it
  * If a legend is customized and the query is changed it is overriden
  * Sql editor does not show the_geom_webmercator in autcomplete options
  * Scrub bar for radius / opacity / etc stays open in some cases
  * Add tutorials to the menu on the dashboard
  * Dashboard notification opens always
  * Account upgraded event duplicated
  * Upgraded to Windshaft-Cartodb 1.3.6
  * Changing the api key doesn't invalidate requests with the old api key
  * Looks like the import event is broken in mixpanel. No metadata
  * Import events always reported as failure
  * Dedicated badge doesn't appear in dedicated accounts
  * Support new? OSM url format
  * Add point separator on the dashboard table list (for number of rows)
  * The_geom column is being shown as 'P'
  * Add widget to ducksboard with the AVG time of response on supportbee
  * Geometry rows in the table shows only first letter
  * Review CSV export query
  * Compare strings in lowercase when doing a merge
  * A just importer csv (synced) shows "synced 18 hours ago"
  * Map is now show on sync tables
  * 'Basemap adder' dialog bugs and improvements

2.2.1
-----
* Fixed Bugs
  * Refreshing a table view with a query applied on the visualization view it doesn't get the table correctly rendered
  * Public table rendering nothing
  * Table view rows missing columns
  * Type being reported as an actual number in SQL API
  * Exporting POINT table with many NULL geoms as a SHP file fails
  * Single quotes aren't escaped on CartoCSS
  * Missing .prj on shp files exported by CartoDB
  * Investigate account provisioning issues
  * When there is a value with " ' " in the table and you try the category wizard it fails
  * Error adding polygon
  * Duplicated layer added to a visualization
  * Cannot export mixed geometry resultsets to shp
  * Error when not selecting the cartodb_id column
  * Green bar when applying a query is over the column submenu
  * When a query is cleared to default infowindow fields should return to selected ones
  * Spinners in color wizard are not working
  * Particular error for KML files
  * Issues on the public view
  * When having a query applied with a wizard using a foreign column, if you clear the wizard the style should be set to default
  * When not having results for a query, the clear view link is not being shown on the green bar
  * wizard styles are not preserved when changing geometry
  * Close submenu when clicking on the active column name
  * Detect when a encoding error in order to show a different message than Unknown
  * Error "cartodb_id column does not exist" when interaction is disabled
  * Detect when a SHP has more than 256 columns
  * Dashboard shows "Dedicated plan" after downgrade
  * Fix regression: assume LATIN1 for Shapefiles we can't detect the encoding
  * Fix regression: assume LATIN1 for Shapefiles we can't detect the encoding
  * Imports from URLs get created twice
  * Importing a table when you have one left raises a quota error

* Improvements
  * Use the requested string as identifier when geocoding
  * Use DBF gem to detect encoding of Shapefiles
  * Force encoding in file name
  * Implement 'overwrite' mode in importer

2.2.0
-----
* Fixed Bugs
  * Malformed polygons fail without warning

* Improvements
  * Ported cartodb to leaflet 0.6

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

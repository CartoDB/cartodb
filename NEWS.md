3.12.* (2016-XX-XX)
-------------------
## Features
* Adds optional strong passwords for organization signups
* Add new function User#direct_db_connection which uses a new direct_port paramerer to be specified in database.yml to connect to the database. Usage instructions:
  * Use `port` in database.yml to specify the port through which the db is accessed for regular queries (such as pgbouncer connections)
  * Use `direct_port` in database.yml to specify the port through which the db can be directly accessed (i.e. the port in which Postgres is running)
  * This change is backwards compatible and will fallback to `port` whenever `direct_port` is not specified in the database configuration file.
* Update ogr2ogr version to 2.1, configurable in `app_config.yml`. To install it in the system, run:
  * `sudo apt-get install gdal2.1-static-bin`

## Bug Fixes
* Updating CartoDB.js submodule with last changes sanitizing attribution.
* Fixes a problem with select2 arrow icon.
* Disable `PROMOTE_TO_MULTI` ogr2ogr option for CSV imports with guessing enabled to avoid MultiPoint imports. (https://github.com/CartoDB/cartodb/pull/6793)
* Source and attributions copied to visualizations when you import a dataset from the Data Library (https://github.com/CartoDB/cartodb/issues/5970).
* Fixes a memory leak when connecting to user databases
* Fixed error when accessing an SQL API renamed table through the editor.
* Refactored and fixed error handling for visualization overlays.
* Ignore non-downloadable GDrive files that made file listing fail (https://github.com/CartoDB/cartodb/pull/6871)
* Update CartoDB PostgreSQL extension to 0.14.3 to support `cartodb_id` text columns in the CartoDBfy process.
  * See instructions to upgrade to the latest extension version [here](https://github.com/CartoDB/cartodb-postgresql#update-cartodb-extension)
* Fix slow search of visualizations by name
* Update and improve logging system
* Fix broken syncs after setting sync options to "Never"
* Make `layers.kind` not null. Run `bundle exec rake db:migrate` to update your database.

## Security fixes

3.12.4 (2016-03-09)
-------------------

## Bug Fixes
* Fixes in HTTP Header authentication.
* Fixes in avatar urls
* Fixes in organization sigup
* Fixes in high resolution geocoder when using google provider
* Fixed rake to setup google maps

3.12.3 (2016-02-11)
-------------------

## Features
* Group support for organizations.
* User quota slider in organizations management.
* Update navigation in public pages.
* Support for HTTP Header authentication.
* New visualization backups.
* GPX multilayer file creates a multilayer map
* Allow to create sync tables with a map if setting up onw from "connect dataset" from the Maps view

## Bug Fixes
* Now the owner of the dataset is going to receive an email when the synchronization fails hits the max allowed number [#3501](https://github.com/CartoDB/cartodb/issues/3501)
* If the dataset don't have an associated map we avoid to use the zoom property [#5447](https://github.com/CartoDB/cartodb/issues/5447)
* Display custom attribution of layers in the editor and embeds
  [#5388](https://github.com/CartoDB/cartodb/pull/5388)
* Fix for #5477 bug moving users with non-cartodbfied tables
* Added a rake task to notify trendy maps to the map owner when reach a certain mapviews
amount (500, 1000, 2000 and so on). This task takes into account the day before so it should
be exectuded daily
* Fixed negative geocoding quota in georeference modal
[#5622](https://github.com/CartoDB/cartodb/pull/5622)
* Fully removed Layer parent_id from backend and frontend as wasn't used.
* Added [#5975 Box integration](https://github.com/CartoDB/cartodb/issues/5975).
* Fixed geocoding in onpremise versions

## Security fixes
* Removing Bitly shortener.
* Several XSS fixes in organization accounts
* API fixes that allows.

3.12.2 (2016-05-15)
-------------------
* Support for HTTP Header authentication.
* Update navigation in public pages.
* New feature in organizations management: user quota slider.
* Widgets (experimental) API.
* Added `data_library` to the config. Usage instructions:
  1. Configure data-library path. You can copy `data_library` config from `config/app_config.yml.sample` into your `config/app_config.yml`.

3.12.0 (2016-01-05)
-------------------
* Ruby 2 support in CartoDB. Ruby 1.9 is now deprecated and not supported from this moment.

3.11.1 (2016-01-05)
-------------------
* Now the owner of the dataset is going to receive an email when the synchronization fails hits the max allowed number [#3501](https://github.com/CartoDB/cartodb/issues/3501)
* If the dataset don't have an associated map we avoid to use the zoom property [#5447](https://github.com/CartoDB/cartodb/issues/5447)
* Display custom attribution of layers in the editor and embeds [#5388](https://github.com/CartoDB/cartodb/pull/5388)
* Adapted Hound configuration to use default .rubocop.yml file so we can have [Rubocop](https://github.com/bbatsov/rubocop) style checks integrated at Sublime Text via [SublimeLinter](http://sublimelinter.readthedocs.org/en/latest/) + [SublimeLinter-rubocop](https://github.com/SublimeLinter/SublimeLinter-rubocop)
* Migrated `Synchronization` id field to `uuid`
* Fix for #5477 bug moving users with non-cartodbfied tables
* Added a rake task to notify trendy maps to the map owner when reach a certain mapviews amount (500, 1000, 2000 and so on). This task takes into account the day before so it should be exectuded daily
* Fixed negative geocoding quota in georeference modal [#5622](https://github.com/CartoDB/cartodb/pull/5622)
* Now create a map from a GPX multilayer file is going to create a multilayer map
* Group support for organizations. Usage instructions:
  1. Update CartoDB PostgreSQL extension to the latest version ([instructions](https://github.com/CartoDB/cartodb/blob/master/UPGRADE#L43)).
  2. Configure metadata api credentials and timeout. You can copy `org_metadata_api` config from `config/app_config.yml.sample` into your `config/app_config.yml`.
  3. Trigger existing orgs configuration: `RAILS_ENV=development bundle exec rake cartodb:db:configure_extension_org_metadata_api_endpoint`.
  4. Trigger existing org owner role assignment: `RAILS_ENV=development bundle exec rake cartodb:db:assign_org_owner_role`.
  5. Increase your database pool size to 50 (10 x # threads, see next line) at config/database.yml. Sample development configuration: config/database.yml.sample
  6. From now on you must run the server in multithread mode: `bundle exec thin start --threaded -p 3000 --threadpool-size 5`.
* New visualization backups feature. Upon viz deletion a special vizjson will be stored in a new DB table. Backups live for Carto::VisualizationsExportService::DAYS_TO_KEEP_BACKUP days and can be recovered with `cartodb:vizs:import_user_visualization` rake by visualization id. Needs new feature flag `visualizations_backup`. Check https://github.com/CartoDB/cartodb/issues/5710 for additional details
* Fully removed Layer parent_id from backend and frontend as wasn't used.
* Added new (optional) config parameters `unp_temporal_folder` & `uploads_path` under `importer` section to allow custom UNP and file upload paths.
* Added new (optional) config parameters `unp_temporal_folder` & `uploads_path` under `importer` section to allow custom UNP and file upload paths.
* Data-library page for common-data and accounts with data_library feature flag [#5712](https://github.com/CartoDB/cartodb/pull/5712)
* Removed config option `maps_api_cdn_template`, reusing now instead `cdn_url`
* Allow to create sync tables with a map if setting up onw from "connect dataset" from the Maps view
* Added [#5975 Box integration](https://github.com/CartoDB/cartodb/issues/5975).
* New rake to install in user or organization the geocoder extension
* Removing Bitly shortener.


3.11.0 (2015-09-09)
-------------------
* Synchronizations model now has a new field (and FK) to visualizations.id and joins to them using that instead of by matching name to canonical visualization's table name. It also gets deleted if FK dissapears.
* Code also switches to using syncrhonizations.visualization_id for linking, so in order to have back existing synchronizations, the following rake needs to be run: `bundle exec rake cartodb:populate_synchronization_visualization_ids`
* StatsD data gathering refactored. Check /lib/cartodb/stats for details
* Data library feature is not cartodb user dependent anymore. By default the username you defined in the common-data config section, will be used with your base url to query for public datasets to build your own data-library based on that user. You can define the `base_url` property and point to other domain to retreive the public datasets from that user. For example set to `https://common-data.cartodb.com` you are going to keep using the cartodb data-library. Please refer to the example configuration file (app_config.yml.sample) `common_data`section  to check how it could be configured
* New modals (removing old code & feature flag restricting access to new ones) [#5068](https://github.com/CartoDB/cartodb/pull/5068)
* Updated (most of) frontend dependencies [#5171](https://github.com/CartoDB/cartodb/pull/5171)
* Metadata is editable when datasets have a SQL Query is applied [#5195](https://github.com/CartoDB/cartodb/pull/5195)
* LDAP configuration & authentication system. If active deactivates standard CartoDB & Google authentications. See cartodb:ldap:create_ldap_configuration rake for how to create one, and source code of /app/models/carto/ldap for more details.
* Upgrade cartodb-postgresql extension to 0.9.4, which includes the new cartodbfy process. As part of this change new user tables won't have the columns `created_at` nor `updated_at`. See the [release notes](https://github.com/CartoDB/cartodb-postgresql/blob/0.9.4/NEWS.md) for more details.
* Added code coverage generation for tests suite. After a run, results will be stored at `coverage` subfolder
* Organizations can choose their authentication mechanisms.
* Fixed street addr tab for georeference modal for google maps/geocoder usage [#5281](https://github.com/CartoDB/cartodb/pull/5281)
* Privacy toggler within create dataset dialog [#5340](https://github.com/CartoDB/cartodb/pull/5340)
* Fixed maps disappearing after creation + navigation to dashboard [#5264](https://github.com/CartoDB/cartodb/issues/5264)
* Log.append now allows to disable truncating (by default active)
* Detection of lat/long columns now is done in `ogr2ogr2` rather than rails code [#5349](https://github.com/CartoDB/cartodb/pull/5349). In order to get this feature working (and some related tests), execute this to get the ogr2ogr2 package updated: `sudo apt-get update; sudo apt-get upgrade`. From this version on, the ogr2ogr2 package is mandatory. In order to install it: `sudo apt-get install ogr2ogr2-static-bin`.
* Removed Mixpanel tracking code [#5410](https://github.com/CartoDB/cartodb/pull/5410)
* Newly imported datasets now properly calculate the map bounds and zoom and store them
* Don't try to short url with bitly if credentials are not present in app_config.yml

### components versions
- [CartoDB v3.11.0](https://github.com/CartoDB/cartodb/tree/v3.11.0)
- [Windshaft-cartodb 2.12.0](https://github.com/CartoDB/Windshaft-cartodb/tree/2.12.0)
- [CartoDB-SQL-API 1.24.0](https://github.com/CartoDB/CartoDB-SQL-API/tree/1.24.1)
- [CartoDB.js 3.15.3](https://github.com/CartoDB/cartodb.js/tree/3.15.3)

3.10.3 (2015-08-13)
---
* Mailchimp decorator enables category wizard and legends [#3874](https://github.com/CartoDB/cartodb/pull/3874)
* Cache public and with link embeds in redis [#3733](https://github.com/CartoDB/cartodb/pull/3733)
* Unify caching of vizjsons and version keys [#3726](https://github.com/CartoDB/cartodb/pull/3726)
* Named maps created for all visualizations, regardless of layers privacy [#3879](https://github.com/CartoDB/cartodb/issues/3879)
* Added an [http client for ruby](https://github.com/CartoDB/cartodb/wiki/The-CartoDB-ruby-http-client) with some cool features
* SQLViews are editable when filtering [#3812](https://github.com/CartoDB/cartodb/pull/3812)
* Defaults Time Column to first date column or cartodb_id in Torque wizards [#4136](https://github.com/CartoDB/cartodb/pull/4136)
* Added more customized Google basemaps.
* New optional config option `maps_api_cdn_template` for static maps [#4153](https://github.com/CartoDB/cartodb/issues/4153)
* New `api/v2/viz/{id}/static/{width}/{height}.png` endpoint for retrieving static maps
* New twitter cards [#4153](https://github.com/CartoDB/cartodb/issues/4153)
* New facebook cards [#4280](https://github.com/CartoDB/cartodb/pull/4280)
* Improve email template [#4190](https://github.com/CartoDB/cartodb/pull/4190)
* Added `filter` option to layer_definition and named_map in vizjson [#4197](https://github.com/CartoDB/cartodb/pull/4197)
* Organization owners can reset users API keys.
* Log model improvements: Stores only upon finish (to hit way less the DB) and size constraints
* Updated cartodb.js to 3.15.1.
* [Stat loading times improves with Redis ZSCAN](https://github.com/CartoDB/cartodb/issues/3943). Redis 3.0.0+ is now required.
* Upgraded [cartodb-postgresql](https://github.com/CartoDB/cartodb-postgresql) extension to `0.8.0`. Run the following commands to get it installed in your system:
```
git submodule init && git submodule update
cd lib/sql; sudo make all install
```
* General security improvements: CookieStore now expires cookies after 7 days, always use SecureRandom for SID generation; Session management now invalidates other sessions upon password change
* Support for large (5k users) organizations.
* Added support for new basemaps with labels on top [4286](https://github.com/CartoDB/cartodb/pull/4286).
* Fixed multi-resource import (ZIP with >1 supported files, ArcGIS, etc.). Limited to 10 tables/files, except in the case of ArcGIS
* Ability to geocode tables shared with write permissions within an organization [#4509](https://github.com/CartoDB/cartodb/pull/4509)
* Layers are saved in bulk when re-ordered [#4251](https://github.com/CartoDB/cartodb/pull/4251)
* Improving test suite speed. Whenever possible, use global test users $user_1 and $user_2 (see TESTING.md for details)
* New optional config values varnish_management[:trigger_verbose] & invalidation_service[:trigger_verbose] to control output verbosity of invalidation services (set now by default to off only at testing)
* Better number normalization to support casting of currency strings [#4530](https://github.com/CartoDB/cartodb/pull/4530)
* Added in-database logging capabilities to geocodings [#4625](https://github.com/CartoDB/cartodb/pull/4625)
* New Maps without geometries no longer have zeroed-bounds
* Rake task `cartodb:redis:purge_vizjson` now also purges embeds [#4653](https://github.com/CartoDB/cartodb/pull/4653)
* Properly and fully disallowing multilogins, by killing other existing sessions upon login
* Added new Platform Limit for concurrent syncs per user. Currently 2 hours TTL, 3 syncs per user max. allowed
* Importer now tries to import shapefile zips without .prj file, by setting 4326 projection.
* Prevent geocoding and import polling requests from being queued up [#4980](https://github.com/CartoDB/cartodb/pull/4980)
* Prevent geocoding and import polling requests from being queued up [#4980](https://github.com/CartoDB/cartodb/pull/4980)
* Added new fields source, attributions, and license, to metadata modal [#5016](https://github.com/CartoDB/cartodb/pull/5016)
* Code related to pecan extracted to separate module [#4999](https://github.com/CartoDB/cartodb/pull/4999)
  * requires a `npm install` for grunt tasks
* New modals [#5068](https://github.com/CartoDB/cartodb/pull/5068)
* Now canonical tables store the bounding box at import time. It's also recalculated when `the_geom` change. This need to install the postgis extension in the metadata database

Bugfixes:
* Fixed deletion of layers upon disconnecting synced datasources [#3718](https://github.com/CartoDB/cartodb/pull/3718)
* Fixed some cache invalidation problems upon changes in privacy (embeds & vizjson) [#3755](https://github.com/CartoDB/cartodb/pull/3755)
* Fixed corner case with ghost table renames [#3762](https://github.com/CartoDB/cartodb/pull/3762)
* Added options to create dataset from query while on the map view [#3771](https://github.com/CartoDB/cartodb/pull/3771)
* Do not cache geocodes if the_geom is NULL [#3793](https://github.com/CartoDB/cartodb/pull/3793)
* Reverse order of varnish/redis invalidation [#3555](https://github.com/CartoDB/cartodb/pull/3945)

New features:
* Organization signup: [#3902](https://github.com/CartoDB/cartodb/issues/3902)
* Diagnosis page at http://localhost.lan:3000/diagnosis
* Remote/External sources now imported via a synchronization (that will sync monthly), and dissapear from the data-library section until the user unsyncs the dataset.

3.10.2 (2015-05-20)
---------
* Ongoing backend refactor and migration from Sequel to ActiveRecord.
* Frontend assets cleaning [PR 3563](https://github.com/CartoDB/cartodb/pull/3563).

#### Steps to avoid problems with submodules changes
```shell
# Before get last changes from master, let's remove the
# common submodule
git submodule deinit app/assets/stylesheets/common
# Clean tmp sass folder, avoiding possible compass problems
rm -rf tmp/sass/*
git pull origin master
git submodule sync
git submodule update --init
```

Bugfixes:
* Create import view throws uncaught error on canceling selected a file (2nd time) [#3379](https://github.com/CartoDB/cartodb/issues/3379).
* Removed old tags endpoint (https://github.com/CartoDB/cartodb/issues/3691).

3.10.1 (2015-05-05)
-------------------
* Fixes bug in the "No georeferenced data" dialog [#3449](https://github.com/CartoDB/cartodb/pull/3449)
* Adds user search/filter to the Share Dialog [3417](https://github.com/CartoDB/cartodb/pull/3417)
* Change default CartoCSS properties of polygon strokes [3375](https://github.com/CartoDB/cartodb/pull/3375)
* Fix custom image header templates [3378](https://github.com/CartoDB/cartodb/pull/3378)
* Adds field to select or type an administrative region in the georeferenciation by city name pane [3306](https://github.com/CartoDB/cartodb/pull/3306)
* Fix tooltips in the legend editor [3341](https://github.com/CartoDB/cartodb/pull/3341)
* Sort category names alphabetically in legends [3218](https://github.com/CartoDB/cartodb/pull/3218)
* Editable descriptions and tags in the maps and datasets view [3129](https://github.com/CartoDB/cartodb/pull/3129)
* Add caching of geometry types [#3157](https://github.com/CartoDB/cartodb/pull/3157)
* New public map [#3120](https://github.com/CartoDB/cartodb/issues/3120)
* Do not store session for api_key auth [#3208](https://github.com/CartoDB/cartodb/pull/3208)
* All connected services available in account page [#3025](https://github.com/CartoDB/cartodb/issues/3025)
* Fixed script to purge vizjson redis [#3354](https://github.com/CartoDB/cartodb/pull/3354)
* Fix guessing warnings when there are no rows [#3024](https://github.com/CartoDB/cartodb/pull/3363)
* Send geocoding duration metrics [#3381](https://github.com/CartoDB/cartodb/pull/3381)
* Several fixes for subdomainless configs [#3393](https://github.com/CartoDB/cartodb/pull/3393)
* Disable any kind of import guessing from create dialog [#3456](https://github.com/CartoDB/cartodb/issues/3456)
* Enable new dashboard for everyone by means of migration [#3509](https://github.com/CartoDB/cartodb/pull/3509)
* Enabled Google Maps Basemaps [#3429](https://github.com/CartoDB/cartodb/pull/3429)
* Remove need of api_key to enjoy common-data "Data library" [#3523](https://github.com/CartoDB/cartodb/pull/3523)

Bugfixes:
* Fixed interaction when there are hidden layers [#3090](https://github.com/CartoDB/cartodb/pull/3090)
* Fix http cancelled requests [#3227](https://github.com/CartoDB/cartodb/pull/3227)
* Added HTTP timeouts for all HTTP calls on imports and syncs. Connect timeout is 60 secs, data requests calculate using (user quota / 50KB/sec) estimation.
* Fix for "Cannot read property 'layers'" [#3302](https://github.com/CartoDB/cartodb/pull/3302)
* Fix for type guessing in synchronization imports [#3264](http://github.com/CartoDB/cartodb/issues/3264)
* Deleted unused endpoints for POST/DELETE api/v1/maps
* Avoid infinite recursion when renaming table [#3330](https://github.com/CartoDB/cartodb/pull/3330)
* Script to delete inconsistent vizs [#3342](https://github.com/CartoDB/cartodb/pull/3342)
* Fixed problem rendering Lato font [#3461](https://github.com/CartoDB/cartodb/issues/3461)

3.10.0 (2015-04-08)
-------------------
* Internal code refactor to allow to disable subdomain-based general application behaviour, to rely instead on URIs like 'domain.com/u/USER/...', or allow to have both systems working at the same time (subdomainless and with subdomain)
  - New Config entry: 'http_port' (see config/app_config.yml.sample for further details)
  - New Config entry: 'https_port' (see config/app_config.yml.sample for further details)
  - New Config entry: 'subdomainless_urls' (see config/app_config.yml.sample for further details)
  - More info about this feature can be read at https://github.com/CartoDB/cartodb/wiki/How-to-setup-subdomainless-URLS
* Major refactor of the `Table` class: extract the `UserTable` model from it [#2775](https://github.com/CartoDB/cartodb/pull/2775)
* Update common data metadata task [#2741](https://github.com/CartoDB/cartodb/pull/2741)
* Guessing of namedplaces on import [#2809](https://github.com/CartoDB/cartodb/pull/2809)
* Fixed Google+ disconnection in new dashboard [#2378](https://github.com/CartoDB/cartodb/issues/2378)
* Added script to purge redis vizjson cache [#2968](https://github.com/CartoDB/cartodb/pull/2968)
* Allows to generate a static map of a password protected visualization [#3028](https://github.com/CartoDB/cartodb/pull/3028)

Bugfixes:
* Removes duplicated maps in the delete warning dialog [3055](https://github.com/CartoDB/cartodb/pull/3055)
* Fix "all" infowindow field switch [3021](https://github.com/CartoDB/cartodb/pull/3021)
* Fix "create table from query or clear view" banner covers zoom overlay and search box [#2762](https://github.com/CartoDB/cartodb/pull/2762)
* Fix Changing email requires new password [#2764](https://github.com/CartoDB/cartodb/pull/2764)
* Fix "Update in multi-user account" [#2794](https://github.com/CartoDB/cartodb/pull/2794)
* Fix incorrect quota value in dropdown [#2804](https://github.com/CartoDB/cartodb/issues/2804)
* Fix Columns are no longer alphabetically ordered in the table view [#2825](https://github.com/CartoDB/cartodb/pull/2825)
* Fix user creation with org [#2831](https://github.com/CartoDB/cartodb/pull/2831)
* Fix sync tables state changes [#2838](https://github.com/CartoDB/cartodb/pull/2838)
* Add specific error for wrongly encoded CSV files [#2847](https://github.com/CartoDB/cartodb/pull/2847)
* Fixed infinite loop saving overlays #2827
* New index for visualizations.parent_id [#3017](https://github.com/CartoDB/cartodb/pull/3017)
* Fix sanitization issues in custom HTML infowindows [#3059](https://github.com/CartoDB/cartodb/pull/3059)

3.9.0 (2015-02-13)
------------------
* New user account & profile management pages, inside CartoDB Editor.
* Fixed UNIX timestamps converted to a date column loses time [#990](https://github.com/CartoDB/cartodb/issues/990)
* Fixed Column wkb_geometry appears when importing [#2107](https://github.com/CartoDB/cartodb/issues/2107). Needs updating `ogr2ogr2-static-bin` package.
* Added Hubspot for usage statistics [#2575](https://github.com/CartoDB/cartodb/pull/2575)
* Updates cartodb.js to 3.12.11
* Fixes update table as statements from the editor #2620
* Fixes the showing of map previews in the delete items dialog #2639
* New organization pages done
* Hiding SaaS links in open source edition [#2646](https://github.com/CartoDB/cartodb/pull/2646)
* Allows to remove overlays using the backspace key.
* Update favicon to retina [#2686](https://github.com/CartoDB/cartodb/issues/2686)
* Change new dashboard search behaviour [#2628](https://github.com/CartoDB/cartodb/issues/2628).

Bugfixes:
* Fix layer refresh when the method of a density visualization changes [#2673](https://github.com/CartoDB/cartodb/issues/2673)
* Fixes an error that preventing the load of WMS layers.
* Fixes an unncessary binding that made the dashboard reloading twice.
* Fix markdown from descriptions not rendered correctly in dashboard view [#2572](https://github.com/CartoDB/cartodb/issues/2572)
* Fix new dashboard URLs creation [#2662](https://github.com/CartoDB/cartodb/pull/2662)
* Redirect to list on delete table vis [#2697](https://github.com/CartoDB/cartodb/pull/2697)
* Fix account settings order [#2700](https://github.com/CartoDB/cartodb/pull/2700)
* Fix geocoding by Lon/Lat: refresh the table [#2699](https://github.com/CartoDB/cartodb/pull/2699)
* Fix multiuser quota is not well calculated in multiuser dashboard [#2722](https://github.com/CartoDB/cartodb/pull/2722)
* Fix new public pagination [#2716](https://github.com/CartoDB/cartodb/pull/2716)
* Fix contrast for nav buttons [#2696](https://github.com/CartoDB/cartodb/pull/2696)
* Fix top/bottom padding for delete dialog [#2721](https://github.com/CartoDB/cartodb/pull/2721)
* Fix filters view's search component behavior [#2708](https://github.com/CartoDB/cartodb/pull/2708)
* Fix bubble wizard legend not being updated on column change [#2747](https://github.com/CartoDB/cartodb/pull/2747)

3.8.1 (2015-02-26)
------------------
* Added config for basemaps [#1954], see
  [documentation](https://github.com/CartoDB/cartodb/wiki/How-to-configure-basemaps-in-CartoDB)
* Added oEmbed support for visualizations [#1965](https://github.com/CartoDB/cartodb/issues/1965)
* [content guessing] Prioritize ip over country guessing [#2089](https://github.com/CartoDB/cartodb/issues/2089)
* Added new import error code (6667) for detecting and reporting statement timeouts.
* Fixes creation of a visualization from a table [#2145](https://github.com/CartoDB/cartodb/issues/2145)
* Changes the way geometry types are loaded client side (performance), see PR [#2189](https://github.com/CartoDB/cartodb/pull/218)
* Cache the geometry types in table model server side (performance), see PR [#2165](https://github.com/CartoDB/cartodb/pull/2165)
* Added PlatformLimits service. Includes an importer maximum file size limit.
* Added PlatformLimits importer max resulting table row count limit.
* Fixed incompatible data for wizards [#1942](https://github.com/CartoDB/cartodb/issues/1942)
* Added map previews in the delete table dialog
* Fixed adding Mapbox basemaps.
* Captures 4XX exceptions when loading faulty map preview
* Adds static maps export dialog
* Added new public pages [#2034](https://github.com/CartoDB/cartodb/pull/2142)
* Added API keys and OAuth pages [#2142](https://github.com/CartoDB/cartodb/pull/2142)
* Replace 404 error page
* Only send JS errors+stats in production [#1987](https://github.com/CartoDB/cartodb/pull/1987)
* Read Content-Type header for downloads without extension [#2275](https://github.com/CartoDB/cartodb/issues/2275).
* Cache vizjson in redis to avoid hitting DB [#2194](https://github.com/CartoDB/cartodb/pull/2194)
* Update Browserify to latest version (9.0.3) [#2449](https://github.com/CartoDB/cartodb/pull/2449)
* Remove tmp and unused files [#2328](https://github.com/CartoDB/cartodb/pull/2328)
* Open privacy dialog directly from items [#2442](https://github.com/CartoDB/cartodb/pull/2442)
* Fixes error handling when adding an erroneous WMS URL.
* Do not send visible=false layers for static previews
* Add new fields to data_import [#2257] and the feature of being able to create and redirect to a derived visualization after importing data (via import api new param `create_vis`)
* Add loading+error state for privacy dialog [#2484](https://github.com/CartoDB/cartodb/pull/2484)
* Change visuals in share view of privacy dialog [#2492](https://github.com/CartoDB/cartodb/pull/2492)
* Added back Twitter import for new create dialog.
* Adds random quotes in the loading screens.
* Improved speed in dashboard caching frontend side [#2465](https://github.com/CartoDB/cartodb/pull/2465)
* Add user_defined_limits to DataImport, and the feature of imports to support certain user defined limits. Currently only used for `twitter_credits_limit` at importer create endpoint.
* Improve new pagination [#2529](https://github.com/CartoDB/cartodb/pull/2529)

Bugfixes:
* When being in any configuration page remove the arrow from the breadcrumb [#2312](https://github.com/CartoDB/cartodb/pull/2312)
* Pressing enter when deleting a table opens a new modal [#2126](https://github.com/CartoDB/cartodb/pull/2126)
* Deselect all doesn't work [#2341](https://github.com/CartoDB/cartodb/issues/2341)
* Fixes for new dashboard texts [#2499](https://github.com/CartoDB/cartodb/pull/2499)
* Fixes a problem generating images from private visualizations of private org users.
* Remove lighter font weights [#2513](https://github.com/CartoDB/cartodb/pull/2513)
* Fix quota usage rounding [#2561](https://github.com/CartoDB/cartodb/pull/2561)

3.8.0 (2015-01-30)
------------------
* Mailchimp user lists importer dataset.
  New Config entry-set: ['oauth']['mailchimp'] (see config/app_config.yml.sample for further details)
  Requires also a feature_flag enabled either globally or to a specific users: 'mailchimp_import'
* Added icon font source ([how to make changes](http://github.com/CartoDB/cartodb/blob/master/app/assets/fonts/icon_font/README.md))
* Integrated Olark chat within CartoDB editor
* IP guessing on import: try to georeference the imported table by IP if there's no other geocodifiable column [#1149](https://github.com/CartoDB/cartodb/issues/1149) [#1822](https://github.com/CartoDB/cartodb/pull/1822)
* Disable georeference by feature flag (georef_disabled) [#1227](https://github.com/CartoDB/cartodb/issues/1227)
* Faster excel imports [#913](https://github.com/CartoDB/cartodb/issues/913). You'll need to install `csvkit`. Either do `pip install --no-use-wheel -r python_requirements.txt` or `pip install csvkit`.
* Added `total_user_entries` to viz endpoint, to know the total amount of own visualizations/tables/both (shared don't count). If unauthenticated counts only public items.
* Added Mailchimp 'members count' info [#1701](https://github.com/CartoDB/cartodb/issues/1701)
* Added slides support for visualization
* Added guessing of types for geojson (boolean and dates) via ogr2ogr2 [#1036](https://github.com/CartoDB/cartodb/issues/1036). Update `ogr2ogr2-static-bin` package for this to work
* Fixed param `quoted_fields_guessing` on imports and syncs [#1966](https://github.com/CartoDB/cartodb/issues/1966)
* Background importer for new dashboard.

3.7.1 (2014-12-30)
------------------
* New features
  - GET /api/v1/viz/ always sorts by descending order if `order` param set, and this supports new filters: `mapviews`, `likes`, `size`, `row_count`
  - GET /api/v1/viz/ returns more totals:
        `total_likes` (visualizations count with likes, filtered to public for unauthenticated calls,
        `total_shared` (visualizations count shared to the user, 0 for unauthenticated calls)

3.7.0 (2014-12-18)
------------------
* New features
 - Improved import flow for big S3 updates (if configured). Now everything >50MB won't be uploaded synchronously to S3,
   but queued instead (new DataImport state "enqueued"), so that a new cartodb:upload_to_s3 rake (intended to be run
   from a cron) performs asynchronously this upload and then normal import flow proceeds as before.
   New Config entry: ['importer']['s3']['async_long_uploads'] (boolean)
 - GET /api/v1/viz/ now works unauthenticated too, returning only the public tables of the subdomain's cartodb user.
 - GET /api/v1/viz/ supports new 'shared' filter, with values 'yes'/'no'/'only' to return all tables/visualizations including shared, excluding shared or only if are shared.

3.6.1 (2014-12-19)
------------------
* Updates torque library with several fixes
* Adds new fonts

3.6.0 (2014-12-15)
------------------
* New features
 - First version of new dashboard
 - Added Browserify for frontend development (check [this doc](https://github.com/CartoDB/cartodb/blob/master/CONTRIBUTING.md#grunt))
 - Several improvements to raster imports

3.5.0 (2014-12-11)
------------------
* New features
  - Likes on Visualizations & Datasets lists. Also prepared backend code for inminent like button on public map pages.
 * Fixed bugs and improvements
   - fixed metadata tables being dropped if they were in more than one account #1349

3.4.1 (2014-12-01)
------------------
 * Fixed bugs and improvements
   - Modified signature of cartodb:db:load_functions rake task, to both reduce required params (added default values) and
     allowing to specify a cartodb-postgresql extension version, so existing users can keep with their versions while
     load_functions loads (optionally) a different one.

3.4.0 (2014-12-01)
------------------
* New features
  - Raster import: Drag & drop geotiff files to get them imported into cartodb. Cannot be viewed yet, but can used from PostGIS. NOTE: Raster overviews import is not yet fully working, this release handles streamlined import itself.
    This requires a rake to run to activate raster for users ("cartodb:db:grant_general_raster_permissions").

3.3.1 (2014-11-25)
------------------
 * Fixed bugs
   - Country guessing: normalize content before checking for duplicates.

3.3.0 (2014-11-24)
-------------------
 * New features
  - Shows a warning message when editing a visualization that has a Google Maps basemap.

3.2.15 (2014-11-21)
-------------------
 * Fixed bugs and improvements
   - ContentGuesser: added param for sync and import APIs, checks for different id columns, performance metrics, etc.
   - Country guessing fix: must be done with at least 2 chars.
   - Geocoding: fixed geocoder by postalcode when column type is numeric
   - #1095 Add feature button in Torque maps

3.2.14 (2014-11-17)
-------------------
 * Fixed bugs
   - Geocoding: change "Place" by "Country" in City name and Postal code options.
   - ContentGuesser: use index scan instead of seq scans in DB queries

3.2.13 (2014-11-14)
-------------------
 * Fixed bugs
   - Timeouts in internal geocoder #1152

3.2.12 (2014-11-13)
------------------
* New features
  - Country guessing on import. Figure out if any column contains country information and automatically geocode the table. Depends on the geocoder. Take a look at the entry `content_guessing:` in `config/app_config.yml.sample`
* Fixed bugs
  - Remove cumulative option for torque cat. wizard #903

3.2.11 (2014-11-11)
------------------
* New features
  - Removal of 19 unused or no longer needed gems
  - Allows to show an 'available for hire' banner in your public profile.
* Fixed bugs
  - Fixed internal geocoder for org users


3.2.10 (2014-11-07)
------------------
* New features
  - Mapviews graph for everybody.
  - New rainbow basemaps.
* Fixed bugs
  - Made lib/sql git submodule point to 0.4.1 tag
  - Batch internal geocoder update queries to avoid db timeouts

3.2.9 (2014-11-03)
------------------
* New features
  * Implemented raster import into the editor. Only table import, yet no viewer/editor.
  * Enabled ghost tables. Tables created with SQL API are visible in the editor. See [documentation](https://github.com/CartoDB/cartodb/wiki/creating-tables-though-the-SQL-API)
  * Enables fullscreen for IE11.
  * Deprecate GMaps support, substitute GMaps basemaps with equivalent ones for Leaflet instead (#1061)

3.2.8 (2014-11-03)
------------------
* New features
  * Added dynamic_cdn_enabled flag to the users.
  * Improved emails upon import completion.
* Fixed bugs
  * Added retries system to Named Maps update actions, so if hits a tiler template lock tries again.
  * Added some invalid column names to the reserved words list(s), but now upon importing or renaming columns, we rename to _xxxxx if xxxxx is a reserved word.
  * Trim columns to be able to geocode columns/strings with leading/trailing whitespaces

3.2.7 (2014-10-23)
------------------
* Public pages reviewed
* New header in public pages

3.2.6 (2014-10-22)
------------------
* New features
  * Annotation overlay.
  * Stamen basemaps.
  * Optimization: Map creation no longer performs tiler calls to set the tile style.
  * Optimization: viz.json rendering now doesn't requests for named map if needs to, using the visualization and layers to recreate required fields.
  * Twitter datasource now allows N custom GNIP configurations, per username or per organization name.
  * Optimization: Added more DB indexes based on slow queries logs.
* Fixed bugs
  * Send the visibility status of the torque layer in the vizjson
  * Importer specs back to work. If any fails please update GDAL and take a look at "Raster import support".

3.2.5 (2014-10-13)
------------------
* New features
  * ArcGIS import integration (includes new app_config.yml values)
  * Detection of imports without tables registered and marking them as failed
  * Adds property toolbar to style and control the image and text overlays.
  * CSV import type guessing (performed via OGR2OGR). Disabled by default, to enable install ogr2ogr2-static-bin package and modify configuration

3.2.4 (2014-10-06)
------------------
* New features
  * Upon table creation no tile style call performed anymore. Still done upon layer/map change, though.
  * Send an email upon completion of an import if it takes more than 5 minutes.
  * Twitter search API uses geo-enrichment if present. Also there's a customized organizations list too now.
  * The mobile editor resembles to the mobile layout of the embed maps.
  * Removed force_mobile flag from the embed maps.
* Fixed bugs
  * Geocoding a table with 0 geocodificable rows throws error

3.2.3 (2014-09-30)
------------------
* New features
  * Added ability to disable high resolution geocoding batch api by config
* Fixed bugs
  * Missing geocoding type (Admin regions, country column, polygons)

3.2.2 (2014-09-29)
------------------
* New features
  * Improved torque rendering on pause or static datasets
  * Improved mobile layout
  * Improved Geocoder UI
  * Refactor of InternalGeocoder

3.2.1 (2014-09-05)
------------------
* New common data section
* New features
  * Upgrades to 0.4.0 cartodb postgresql extension version

3.2.0 (2014-08-27)
------------------
* New Features
  * Twitter datasource, unsing Gnip Search API. Introduces new app_config.yml fields (search for 'datasource_search')

3.1.0 (2014-08-25)
------------------
* New features
  * Varnish HTTP invalidation support
  * Dynamic generation of sitemap.xml with public visualizations/tables for users
* Fixed bugs
  * public map uses CORS headers to fetch user info
  * infowindow on hover fixed on table mode
  * fixed table export dialog when SQL query without geometries is applied
  * fixed wrong replace executing SQL on multiuser accounts

* Enhancements
  * CartoDB PostgreSQL extension versioning more flexible based on semver

3.0.1 (2014-08-07)
------------------
* New Features
  * Mail notifications when sharing or unsharing objects in organizations
  * Publication system: you can now add text and images on top of your maps!
  * New basemap selector
  * Simplified share dialog
* Fixed bugs
  * Fixed write buttons are shown when watching sync tables
  * Fixed a bug that prevented choosing a different column from the default to geocode an IP address
  * Fixed some avatar tests
  * Upgrades to 0.3.4 cartodb postgresql extension version:
    * 0.3.4: fixes CDB_QueryTables function
    * 0.3.3: splits cartodbify
    * 0.3.2: makes 0.3.0dev version upgradeable

3.0.0 (2014-07-15)
------------------
* New Features
  * Multiuser support
  * Added avatar_url to ::User model
  * Added custom avatars
  * Added Permission model and permission attribute for Visualizations
  * Activated Sequel extension connection_validator.
    This requires adding to database.yml a value for 'conn_validator_timeout',
    else code will default to 900 seconds
  * Several minor improvements

* Fixed bugs
  * Security fix regarding Typhoeus library
  * Several minor bugs

* Migration Type (see UPGRADE): Mandatory migration
  * As stated by the README, PostgreSQL now MUST be at least 9.3 to avoid search_path errors
  * Cartodb postgres extension update to 0.3.0
  * Also mandatory to run:
    * rake cartodb:db:create_default_vis_permissions
    * rake cartodb:db:populate_permission_entity_id

2.14.3 (2014-06-11)
-------------------
* Fixed bugs
  * Last used colors working properly in color-picker.
  * HTML template working properly for header infowindows.
  * Make import_id visible for any kind of import error.
  * Values from unknown column type are displaying correctly.
  * Custom title within SQL and CartoCSS editor fixed.
  * allow "rectangle" option for marker-type in torque layer
  * now enqueing sync tables who are in state syncing for more than 2 hours
      (caused by pushing code while syncing a table)
  * fixed torque wizard for google maps
  * fixed infinite loop in CDB_QueryStatements (again)
  * fixed problem executing long queries from the editor
  * By default, now not verifying SSL certificates for data imports (allow customer dev. environments with https)
  * Import CSV with invalid UTF-8 characters by replacing them (instead of skipping the whole row)
  * stop sending stats from public views after some time
  * Now installing and using [Cartodb-postgres extension](https://github.com/CartoDB/cartodb-postgresql) (current 0.2.0)

* New features
  * Tumblr-widget available in dashboard where a new post is published.
  * Added a log method for db_maintenance rakes
      (logs to log/rake_db_maintenance.log).
      For now used on load_functions.
  * Added avatar_url to ::User model

* Migration Type (see UPGRADE): Mandatory migration
  * Check also [installtion steps](https://github.com/CartoDB/cartodb-postgresql#install) for cartodb postgres extension


2.14.1 (2014-05-28)
-------------------
* New features
    * Upgraded UPGRADE doc and required rakes to run
    * Added new aux method to do future code cleanups in rakes : execute_on_users_with_index
    * Added user_id to Visualization Model
    * Added specs for table model, checking the_geom conversions
    * Improve merge tables log info
    * Allows adding custom legends in Torque maps
    * SEO in public pages

* Fixed bugs
    * Converting the_geom causes drop that fails due to trigger (PR477)
    * Excel2CSV gem messes up with atypical UTF-8 characters
    * ogc_fid not being removed after import
    * Creating table from sql query actually creates two tables
    * Fixes a bug with the default values for the choropleth legends

* Migration Type (see UPGRADE): Mandatory migration
    * Also mandatory to run (in this order as fist one sets functions used by second one):
        * rake cartodb:db:reset_trigger_check_quota
        * rake cartodb:db:load_functions


2.14.0 (2014-05-20)
-------------------
* New features
  * Adds markdown support for descriptions
  * New WMS proxy server
  * SQL based table CartoDBfication
  * New rake tasks
  * Migrate user quota on cartodb extension creation from unpackaged
  * Complain if script is sourced in psql, rather than via CREATE EXTENSION

* Fixed bugs
  * Bug fixing and stabilization
  * Improve error detection in viz.json action
  * Ruby code no longer loading import files in memory, but streaming them in chunks upon: uploading to server, uploading to AS3, downloading from AS3/server
  - lib/sql modifications:
    * Remove CDB_SearchPath.sql from the set of scripts loaded directly (#466)
    * Do not call CDB_Invalidate_Varnish() if not owned by a superuser
    * Refuse to create new extension if legacy code is present on database
    * Fix extension requires directive



2.13.5 (2014-05-13)
-------------------
* New features
  * Infowindows on Hover
  * SQL functions moved to a Git submodule
  * CDB_CheckQuota improved in preparations for SQL-Based table CartoDBfier

* Fixed bugs
  * Cluster wizard font sizes are scaling very cleanly
  * Big files imports/data syncs timeout or OOMs
  * Default avatar requests not using https
  * A transparent line appears within infowindow in last Chrome version
  * Add new accepted formats in Dropbox sync
  * Change error when importing a file and there is not enough quota left
  * When a custom tooltip is applied in a layer, if you reload the browser, it doesn't appear anymore
  * If you select fields with null values, it displays neither title nor value on the new tooltip (infowindow on hover)
  * Username is not appearing in that user profile (link in description)


2.13.5 (2014-05-13)
-------------------
* New features
  * Infowindows on Hover
  * SQL functions moved to a Git submodule
  * CDB_CheckQuota improved in preparations for SQL-Based table CartoDBfier

* Fixed bugs
  * Cluster wizard font sizes are scaling very cleanly
  * Big files imports/data syncs timeout or OOMs
  * Default avatar requests not using https
  * A transparent line appears within infowindow in last Chrome version
  * Add new accepted formats in Dropbox sync
  * Change error when importing a file and there is not enough quota left
  * When a custom tooltip is applied in a layer, if you reload the browser, it doesn't appear anymore
  * If you select fields with null values, it displays neither title nor value on the new tooltip (infowindow on hover)
  * Username is not appearing in that user profile (link in description)

2.13.4 (2014-05-08)
-------------------
* Improvements
  * Indent html in the legends html editor
  * Revamp geocoreference modal window
  * Include import ID in import error popup
  * Add POI option in the geocoder dialog

* Bugfixes
  * Applying a custom pattern image for polygons, it triggers the change event twice
  * Rename sequence when renaming a table
  * In the tags selector, order them alphabetically
  * Timeout should be lifted for Georeferencing
  * Bubble Legend doesn't refresh the labels when the field is changed
  * Disallow some html keywords in infowindow and legends editor
  * Incorrect message on table syncing
  * Make links on visualization decriptions linkable
  * Named maps wrapper should throw an exception on missing internal tiler config
  * Don't fetch the_geom and the_geom_webmercator when a sql query is applied
  * When trying to change table name and have a query applied, open a dialog / tipsy
  * Geocoding by zip fixes
  * After applying a wizard to a layer, and then changing a numeric property in the
    CartoCSS, it is not changed in the wizard panel.
  * When creating a new visualization, we should add some url_options by default
  * Can't create table from scratch
  * Pagination in public pages doesn't work correctly
  * No error shown in MapView UI when sql does not select "the_geom_webmercator"
  * JS in the login view is not being initialized
  * Maki icons with 24 pixels of height is being rendered weird
  * EXPLAIN an EXPLAIN ANALYZE does not work from the UI
  * Export fails on private tables
  * Vizualization specs do not honour configuration database name
  * Importing a big shapefile fails with no error message
  * when a filter is applied sometimes the generated sql is wrong
  * HTTPS problem when exporting tables in Firefox
  * Requests to the SQL API are always done using the port 80
  * When adding an X/Y/Z layer as basemap dont check for tile 0/0/0 as it might not
    always be there
  * Change error code style when an import fails


2.13.3 (2014-04-29)
-------------------
* Improvements
  * Add 'sync now' link on the sync tables
  * Create a default options modal window
  * When a layer is selected and the user clicks on the layer name, show a tipsy telling that double click allows to rename it
  * Add button for going to public page on the "SHARE" window (embed map)
  * Possibility to filter by different values in the same column [TABLE FILTERS]
  * Mock WMS call in tests
  * Take the new icons window a bit higher when opening

* Bugs
  * use maker-fill-opacity instead marker-opacity in wizards
  * WMS base layer not working with GeoServer w/ proper projection
  * Adding an empty description to a table prevents for changing it later
  * Close infowindow when other wizard is selected
  * Equal interval is actually doing another Quantile
  * polygon-opacity:undefined when adding a pattern-fill to a polygon
  * Add a link in the public view pointing to embed map page
  * Properly report long import timeouts messages
  * Sync Tables loses CartoCSS when sync
  * line-width: 0 render lines with width > 0 in torque
  * column options show "clear view" when you have no query applied
  * change filter in frontend to use new sql api params
  * Improve sync tables exception bubbling
  * improve compass compiling in development

2.13.2 (2014-04-16)
-------------------
* Improvements
  * Fix problem when the geocoding cache API is slow
  * [Geocoder] Do not use external APIs to geocode latitude/longitude
  * Geocoding window to allow IP Address geocode
  * New icon sets on the UI
  * Embeds in public page

* Bugs
  * Refactor column type change to date
  * Equal interval is actually doing another Quantile
  * Add success message on georeference
  * master branch tests stabilization after uuids migration
  * Give (more)/better info when georeferencing with admin regions fails
  * Failing sync tables from Dropbox Public folder
  * Create a default color for null values within cloropeths visualization
  * Unselecting all the fields in the filter widget produces an ugly query
  * When being a view mode warn that you cannot operate in contextual menus
  * tags are align-center instead of align left on the public tables list
  * Avoid each_char in CSV normalization but detect wrong multilines
  * When a geocode process fails, the background geocoder (the bar at the left bottom) is still visible
  * Fix error when creating organization users
  * Incorrect map count in map page
  * Retrieve more data in the geocoding response
  * Provide a default random name for url-based imports
  * "Map doesn't exist or private" for free user with public map
  * Change privacy button for dropdown doesn't work
  * Amazon S3 throws 403 on HEAD verb
  * Setup the backend to store the visualizations params
  * _setCustomVar for public pages

2.13.1 (2014-04-11)
-------------------
* New Features
  * Add Midnight commander basemap
  * oAuth-based Google Drive and Dropbox integration

* Bugs and improvements
  * When georeferencing by lon/lat columns, convert strings to number first
  * Missing fonts in account assets
  * Map views graph display error
  * Color picker bindings still persist after it is cleaned
  * Sql query editor no longer breaks if you add '\'
  * Review last used colors functionality on color picker.
  * Proxima Nova and SEGOE UI fonts are not being loaded using IE9 in Windows 7
  * Typo on "No georeferenced data on your table" window
  * Fixed crash when user wants to delete a layer from a visualization
  * Public dashboard footer no longer gets rendered in private dashboard
  * Logged-in detection in public pages
  * "CartoDB" link points to your public profile page
  * Fix sublayer_options sharing in the public_dashboard
  * Error when creating public vizz
  * Fix line-height of the tags in the public dashboard


2.13.0 (2014-04-08)
-------------------
NOTE: This version introduces another kind of privacy setting: "Link-only".
Now visualizations and tables which are public are listed by default on user pages.
Due to this, you may want to turn all your Public tables and visualizations to
"Link-only" state. To do this, just run the following SQL query on your metadata
database:

```
UPDATE visualizations
SET privacy='link'
WHERE privacy='public';
UPDATE user_tables
SET privacy=2
WHERE privacy=1;
```

* New features
  * Public User Pages: now users have a public dashboard on their CartoDB homepage
    which will show all the public visualizations and tables on their account.
  * Add new "link-only" privacy status for tables.

* Improvements
  * New endpoint to extract user information

* Fixed bugs
  * Using CartoDB.js, if you create a layer from a viz.json url, and then try to
    hide it, its interaction still works
  * Fixes in session handling when multuple users are logged at the same time
  * Run a update to change all paid users public visualizations from public to link
  * Torque layer offsets when several layers in public page


2.12.0 (2014-04-04)
-------------------
* Improvements
  * Frontend code (JS) is now no longer compiled using the assets pipeline. You can
    use the asset_host setting on app_conflg.yml to point to assets on our own CDN
    or to your own ones if you compile them manually using Grunt.
    For more details, look at lib/build/UPGRADING.md.
  * Automate frontend unit tests

2.11.2 (2014-03-27)
-------------------
* Bugs Fixed
  * Public map is not loaded using https.
  * Public table fails on order by.
  * Clear view raises wrong sql query.
  * Ugly error on Table name change.
  * Increase map height in the public_map page.
  * Torque layer raises an exception in google maps.
  * Normal sync tables do not properly log errors.
  * All rows returned at once from queries written in the SQL pane.
  * In the layer selector, if you unselect all the layers, and then only activates one, the infowindow is neither appearing nor working.

2.11.1 (2014-03-20)
-------------------
* Improvements
  * Improved Cluster Wizard.
  * Changed behaviour in the asset manager dialog.
  * Alternative automatic geocoding from tab delimited uploads over X rows.
  * Enable mouse wheel when the map is in fullscreen mode.

* Bugs Fixed
  * Small fixes in the public map page.
  * Public pages map center does not correspond with share dialog.
  * Scrolling infowindows in the public_map page scrolls the whole map.
  * Fixed padding in the public table list.
  * Click over lock should open privacy window.
  * Importer: cannot guess content-type from http header.
  * Styles are wrongly set after renaming a freshly imported table.
  * Added a row of last colours used in the visualization (on the wizards) in the colorpicker.
  * Using a cartocss variable makes the UI to stop working. It does not apply new styles.
  * Table renaming "unlinks" tables and vis sometimes.
  * Creating a visualization from a table does not add the table.
  * When cluster wizard is applied and using a filter, a message of 'interaction is disabled' appears.
  * Small typo when free user tries to switch to private.
  * Using the new color picker in the CartoCSS editor, after choosing a default color, we should not lose the focus in the editor.
  * Table UI won't reload after successful geocoding.
  * Do not escape single quotes in category wizard.
  * Infowindow fields are renderer in reverse order.
  * Import files containing lat/lon with ',' instead of '.' break.
  * Infowindow content is not being loaded using https when embed is loaded with https.

2.11.0 (2014-03-10)
-------------------

IMPORTANT NOTE
==============
From this release, CartoDB uses UUIDs instead of IDs to reference to all objects on
the database, so that it is being able to work on distributed environments much
reliably.

Your database would need manual upgrade in order to use this CartoDB version.

We have created a script to help you migrate your database. Even this script has
been tested on production environments by us, we highly encourage
to make a FULL backup of your database before running it.
This backup should involve both PostgreSQL metadata and user data databases
and redis metadata database.

In order to run this migration you need to stop your application and make sure
that there is not any connection to your databases while you run the script.

After you run the migration script manually you will need to run the rails
migration task as usual.
This migration will detect that your database is already in the right state and will
continue normally (and won't work until you do so).

Notice that this migration is mandatory in order to use this CartoDB version
and any other future version. Also, versions starting with this one are
incompatible with the old database schema with integer based ids.

These are the steps you need to follow in order to run the manual script:
```
  $ cd <application_root>
  $ export RAILS_ENV=<rails_env>
  $ export DBNAME=<your_postgresql_database_name>
  $ export DBHOST=<your_postgresql_database_host>
  $ export DBUSER=<your_postgresql_database_user>
  $ export DBPORT=<your_postgresql_database_port>
  $ export REDIS_HOST=<your_redis_host>
  $ bundle exec ruby ./script/migrate_to_uuid.rb schema
  $ bundle exec ruby ./script/migrate_to_uuid.rb meta
  $ bundle exec ruby ./script/migrate_to_uuid.rb data
  $ bundle exec ruby ./script/migrate_to_uuid.rb clean
```

Now, back to the new features!

* New Features
  * All metadata storage is now UUID-based
  * Implement new public map page
  * Implement new georeference options
  * Implement new geocoder logic in the backend, allowing to geocode by regions
    using open data

* Bugs Fixed
  * Improvements of traces for Sync Tables
  * Fix errors when deleting user databases on distributed environemtns
  * Show in color-picker all the colors you are using in your visualization
    (colors from other layers and so on)
  * Make cartodb UI work without Google Maps JS
  * Fix error with geocoder row counts
  * Changed XYZ test preventing server issues
  * Changed color picker interaction
  * Prevent default actions from new share buttons
  * Fix several JS specs
  * Disable statsc collection in https from embed to avoid security problems
  * Adding a table to a public visualization changes the privacy of the vis
  * Full screen options are enabled by default for public visualizations
  * Empty the_geom from CSV no longer imports to "" instead of NULL
  * Trying to change a password no longer returns unauthorized
  * User destroy no longer fails when he has named maps
  * /api/v1/tables returns 404 when table does not exist


* Improvements
  * Integrate JavaScript error handling reporting
  * Add db migrations to alter the schemas to uuid
  * Activate fullscreen button on embeds by default
  * When adding a color, add a thumbnail close to the HEX value on the cartocss
      editor

2.10.1 (2014-03-03)
-------------------
* Improvements
  * Improved invalid WMS layers feedback.
  * Buttons for the Embeds
  * Added an alert so the user knows when a private map viz.json is used.
  * Allow CSVs with multiline inside for importing.

* Bugs Fixed
  * Legend number is null when apply filter.
  * Metatile with too many features is messing up some maps.
  * Problems importing a kml.
  * Problem with sequel and columns with same name in different schemas.
  * Changed embed to open password dialog when visualization needs password.
  * Infowindow data is cached when feature is edited.
  * SQL is being send in viz.json for torque layer with named maps.
  * 'searchControl' doesn't work using CartoDB.js and a viz.json.
  * Legends should be activated by default after applying a choropleth / category / intensity / etc... wizard.
  * named maps does not manage queries with !bbox!
  * Roo Excel import Ruby gem takes too long on big files.
  * If user types a non valid number within a number widget, a JS error appears.
  * viz.json includes wrong layer_index.
  * public map + pass protected vis is not returning named map in viz.json.
  * When discards adding a new point, a javascript exception appears.
  * Going to protected_embed_map directly throws 404.
  * OSM import via URL broken due to URL format change.
  * Private visualizations should be allowed when private tables are enabled.
  * Private map created with empty css.
  * Keep getting an error when setting new Torque CSS in dashboard.
  * Layer selector does not work in gmaps.
  * Fixed typo in api keys view.

2.10.0 (2014-02-25)
-------------------
* Improvements
  * Revamped privacy for visualizations.
  * Implement unified MAP API.
  * Named Maps Ruby API wrapper Unit/Integration tests.
  * Add Fullscreen button to iframe.

* Bugs Fixed
  * Set correct attributes service params to work with infowindows.
  * Upgraded message still present after downgrade.
  * It's impossible to move points when there's a torque layer.
  * Ordering by numeric DESC will show nulls at top.
  * viz.json includes infowindow template when there are no infowindow fields active.
  * The title of the fake share window inside of the publish modal is missing.
  * Infowindow shouldn't be enabled in Cluster wizard.
  * CSV importer failure due to missing stream.rewind.
  * Disable GDrive panel for importing new files.
  * When switching from normal layer to torque layers the normal layer is still shown.
  * Change resolution in torque layer does not work.

2.9.3 (2014-02-19)
------------------
* Improvements
  * Improved color picker.

* Bugs Fixed
  * When deleting a user from the box, his database should be deleted before deleting his metadata.
  * Map turns blank at "Publish" time.
  * Revamp option for selecting a marker image / polygon pattern fill.
  * Wrong message shown in dashboard.
  * Undefined constants in certain importer flows.
  * When edit a polygon in leaflet move the map to [-180, 180]
  * Wizards don't show anything selecteed.
  * Autoselect last uploaded asset by default in the assets modal window.

2.9.2 (2014-02-14)
------------------
* Improvements
  * Added geocodings bar to the submenu.
  * Use unique names on indexes and sequences.

* Bugs Fixed
  * Fixed encoding error on geocoder.
  * the_geom column is empty after loading a shapefile multipoint.
  * Fix error when having tables with same name on different schemas
  * XLSX file with multiline in row fields breaks importer.
  * Roo is not able to open certain XSLX.
  * Table name sanitizer failing when sanitized name already exists.
  * Fix error when changing user quotas.

2.9.1 (2014-02-07)
------------------
* Improvements
  * Use a geocoder cache.

2.9.0 (2014-01-31)
------------------
* Improvements
  * New cluster wizard.
  * Improved embed_map speed.
  * Added retina assets for mobile maps.
  * Slight reorder of label options.
  * Improved WMS error message.

* Bugs Fixed
  * Styles applied in a table do not get reflected on the wizards when creating a visualization.
  * REST API should respond with 400 when tiler style sync does not work.
  * A layer is shown on reload if it is hidden.
  * In embed page: visualizing the map in a mobile, when changes landscape mode, map has to be resized.
  * Leaflet basemap on android dissapears on zoom.
  * Conditional styles based on zoom are not updated when zooming on torque.
  * When the layer is hidden and you change wizards nothing happens.
  * No visual clue about oauth keys on small screens.
  * In embed visualization, if title or description are not shown the share button is not correctly aligned.
  * Rows not appearing in table public view.
  * Importing XLSX fails.
  * Fixed the wizard when using the torque css editor.
  * Renaming a table does not change table name in url.
  * New table shadow is on top of the column menus.
  * Error loading a multipoint shapefile.
  * Layout error on the Add baselayer modal window.
  * Removed deprecated tables endpoints.

2.8.2 (2014-01-23)
------------------
* Improvements
  * Changed the default Torque visualization parameters.
  * Added created_at to the user model.
  * Removed /api/v1/queries endpoint.
  * Run automatic geocoding after syncing a table.
  * Reduce memory footprint of importer.
  * Change settings page for an organization user (not admin).
  * Change dashboard when user is an organization user (not admin).

* Bugs Fixed
  * After a background import, the dashboard sorting method is changed.
  * PostgreSQL 9.2+ support (PGError: ERROR: column "procpid" does not exist). (#267)
  * Check table geometry type when a row is added, removed or changed.
  * Clean up old importer code.
  * The margin between oAuth and simple auth modules is too big.
  * Creating a table from scratch, then adding a row from the table with a geometry, if you go to map view, you can't apply any wizard.
  * Problem rendering some CSS gradients with last Chrome version.
  * Wizard is not refreshed with new properties when a simple wizard is applied and any CartoCSS property is changed.
  * Category colors are not re-rendered again when the previously applied column was removed.
  * Fixed enabling fonts in map view.
  * Autocomplete table_name when typing is not showing up in Codermirror editors.
  * Replaced the old table endpoint in the merge functionality.
  * Reduced default marker width and border-width.
  * Fixed geocodings API authentication.
  * Check geocoding bindings in table and map views.
  * Fixed encoding issue with xlsx files.
  * Wizard is active and bland when a new layer without any geometry is added in a visualization.
  * Table shadow does not appear correctly aligned when you are in a synced table under a visualization.
  * [Importer] Raise error if unp is not installed (#310).
  * polygon-fill is added when polygon-pattern-file is being used.

2.8.1 (2014-01-16)
------------------
* Bugs Fixed
  * Some map styles are changed after wizard refactoring.
  * Fixed duplicated notifications in the dashboard.
  * A warning message is not shown when no columns are available for applying a category wizard. It shows the wizard with the column selector empty instead.
  * Category wizard doesn't render "null" color element when there is only that value.
  * Created task to get modified layers and visualizations within a period.

2.8.0 (2014-01-14)
------------------
* Improvements
  * New organization model on CartoDB (multi-user).
  * Added new Open Sans fonts.

* Bugs Fixed
  * When hovering a table row in the dashboard, expand the title if needed.
  * User message off screen: "Start by adding rows to your table".
  * Long field type names fall off the cell border (#251).
  * If user selects an Intensity wizard, apply a determined SQL and then clear the query, the wizard previously selected is removed but the legend is ok.
  * Added total map views per visualization in the user dashboard.
  * Layout error with label text on the wizards.
  * Filters: apply filter to already filtered columns stack.
  * Updating certain properties from a wizard, shouldn't update the legend.
  * Adapted API keys and OAuth pages to the new layout (760px).
  * Points are shown when switching from chrolopleth to point wizard with line query.
  * Creating a visualization changes the current panel to wizards with wrong width.
  * Fixed space quota stat.
  * CartoDB logo flicks a lot when opening a publish dialog and moving the map.
  * Removed the edit point animation under GMaps basemap.
  * Created a table from scratch and adding coords manually shows the "Georeference" popup.
  * Null geometries are shown as "Point" on the table view.
  * the_geom_webmercator error is not always reported.
  * When pasting a URL in the 'append' window, it shouldn't offer to set it as a sync table.
  * Error changing polygon fill.
  * Fixed line edit.

2.7.0
-----
* This version is empty because a feature moved to a future release.

2.6.2 (2013-12-20)
------------------
* Improvements
  * Prepare a task to register current ghost tables in metadata
  * Put back time_slider handle for mobiles
  * Make the the_geom switch exclusive on the column join modal
  * Create a task to clean up temporary tables from failed imports and move them to the cdb_importer schema

* Fixed Bugs
  * Do not leak users during testsuite run (#244, #323)
  * SQL editor does not autocomplete table name
  * Error message for free accounts over map view quota
  * geocoder raises an exception
  * Update cdb_tablemetadata when table privacy changes
  * When syncing a table, create triggers and indexes based on those in the existing one
  * Privileges in sync tables are being dropped
  * Dashboard rendering requests /api/v1/tags twice
  * Duplicated the_geom index in new tables
  * Customize infowindow empty throws error
  * CartoDB attribution doesn't appear when there is only a torque layer in the visualization
  * Indentation doesn't work properly in codemirror
  * "Unknown" error creating table from query
  * A console.log is showed from dashboard_messages.js, remove it.
  * Row options menu doesn't appear properly in Firefox
  * Fix problem with the table header shadow
  * Twitter share text is wrong
  * Fix several jasmine failed tests
  * Fix cartodb.js test suite
  * Don't break task when adding timezones to date columns
  * Change support google mail url to exchange url
  * Imports get broken when database_host was empty

2.6.1 (2013-12-13)
------------------
* Improvements
  * Optimized map frame for mobile.
  * New sharing options on embeded maps.
  * Tag footer link in Embeds.

* Fixed Bugs
  * Clicking on a visualization should open map instead of table view.
  * Dashboard: visualizations: change viz name.
  * When browser window is resized in map tab zoom is set to 0.
  * Wrong SQL when requesting infowindow through the admin.
  * Importer leaves temporary tables in the public schema in some error conditions.
  * Funny error on points choropleth.
  * When you create a visualization from a table (within a table), search and legends aren't moved when right panel is opened and closed.
  * Changed button text when selecting file from gdrive.
  * Importing a sync table when having just one table left raises an error, but the table gets imported and not synchronised.
  * If you disable a legend and then apply another choropleth, it doesn't reenable it.
  * After changing the CartoCSS, the wizards cannot calculate the colors anymore.
  * sublayer_options does not work with torque layers.
  * When adding a new layer in a table view, it moves to a new visualization, and name + label appears stuck.
  * Fixed Dropbox picker.
  * Customize infowindow and then empty it throws an error.
  * When viewing a torque layer and adding another layer, the scrubbar stops working.
  * Clean up temporary tables when a synchronization fails.
  * Incorrect layout on the basemap modal.
  * Infowindows are using v1 queries for the SQL API in the admin.
  * Fixed jasmine tests.
  * Custom HTML legends that come from a legend with no items aren't shown.
  * Ensure the dashboard is rendered even if there are exceptions raised when rendering a specific 'table record'.

2.6.0 (2013-12-10)
------------------
* Improvements
  * Enabled HTML editor for the legends.
  * cartodb.js: improved legends API.
  * Created a function that returns the indexes created for a specific table.
  * Added the possibility to upload an import file to S3.
  * Eager load synchronizations when rendering table visualizations (dashboard).
  * Eager load row count and table size when rendering table visualizations.
  * Implemented "cancel geocoding" feature.

* Fixed Bugs
  * Several legends are rendered and they are not cleaned when it's necessary.
  * Label placement: line should be an option in the wizards (for lines).
  * Text placement from Wizard on Lines should default to *line* not *point*.
  * In the legend editor show only colors being used on CartoCSS.
  * If edits a feature from layer[1] and you changes to layer[2], the geometry editor disappear but the editing feature is still present in the map.
  * old_fields and old_template_name infowindow attributes should be removed from viz.json.
  * Missing button in the upgrade notification.
  * Individual visualization map views not incremented.
  * Filter by a word that contains a single quote (') doesn't return the expected results.
  * Duplicated 's' in the visualization title.
  * Column name sanitizer fails with duplicated column names.
  * Fix some privileges problems when granting or creating triggers.
  * In dashboard, if you filter with a tag called "DON'T TOUCH", url is not correct.
  * In dashboard visualizations, if you filter by tag that doesn't exist, 'Create first visualization' block appears.
  * Rails app should use the same time zone than the DB.
  * Old endpoint tiler is not working for some tables.
  * Nokia basemap maxZoom is 40, and it should be 21.
  * When applying a filter on an already styled map, the style gets reset and goes back to default.
  * Fix problems with users deletion.
  * Fix filters failing spec.
  * Geometry edition over GMaps is not working.
  * Do not use removed Table#set_trigger_cache_timestamp when syncing tables.
  * Sync tables may not invalidating the cache.
  * Ensure varnish caches depending on CDB_TableMetadata get cleaned up on table change.
  * HERE batch geocoding API changes.
  * Layer alias does not work on torque layers.
  * Customize infowindow empty throws error.
  * Purge varnish items with "cdb_tablemetadata" channel on table update (#308)

2.5.6 (2013-11-28)
------------------
* Improvement
  * Allow to customize the colors and its number on the choropleth legend.

* Fixed Bugs
  * Make infowindow keep state for a SQL query.
  * Custom infowindow with image is not adding correctly <img> tag.
  * Fixed redis configuration in sync tables.

2.5.5 (2013-11-27)
------------------
* Improvements
  * Move varnish triggers from user tables to CDB_TableMetadata (#241)
  * Changed empty dashboard page

2.5.4 (2013-11-26)
------------------
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

2.5.3 (2013-11-21)
------------------
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

2.5.2 (2013-11-15)
------------------
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

2.5.1 (2013-11-14)
------------------
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

2.5.0 (2013-11-11)
------------------
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

2.4.0 (2013-11-06)
------------------
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

2.3.2 (2013-10-30)
------------------
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

2.3.1 (2013-10-15)
------------------
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

2.3.0 (2013-10-14)
------------------
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

2.2.1 (2013-10-04)
------------------
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

2.2.0 (2013-09-30)
------------------
* Fixed Bugs
  * Malformed polygons fail without warning

* Improvements
  * Ported cartodb to leaflet 0.6

2.1.5 (2013-09-25)
------------------
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

2.1.4 (2013-09-18)
------------------
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
* The list of public tables has been moved to a new page and is now accessible from the header
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

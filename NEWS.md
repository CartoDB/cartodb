0.9.12 (10/09/12)
------
* Removed SQL export option
* Staging environment
* Disallow robots to index the API
* Some fixes in table import timeouts
* Fixed problem with 1-column csv imports
* Fixed links in infowindow
* Improved regenerate_api_key with different varnish scenarios
* General fixes
* Fixed problem importing csv files with txt extension

0.9.11 (30/08/12)
------
* Override statement_timeout in shp import
* Invalidate varnish cache after regenerating api_key

0.9.10 (06/08/12)
------
* Allow quoting identifiers when performing a query (closes #834)
* Refresh map on style change, even on error (closes #833)
* Add error message specific for SHP files (closes #843)
* Excluding spatial_ref_sys from user quota calculation (closes #856)
* Fixed security bugs with api_key auth
* Removes old regenerate_map_key code
* Correctly setting the export table url, the format is sent via a hidden field


0.9.9 (29/06/12)
-----
* Added module to send some statistics to a StatsD server

0.9.8 (26/06/12)
-----
* Fixes when DROP table on the SQL API
* Change the ESPG service used for finding projection to a more stable one provided by cloudfoundry.
* Make clicks on features more reliable on maps
* Improved testing, faster and and easier to run
* Check file size before uploading on client side

0.9.7 (12/06/12)
-----
* Allow .geojson imports
* UI tweaks
* Fix support for 3D shapefiles (force 2D) 
* upload failed imports to S3 for offline inspection
* improvements to import (encoding, geom checks)
* warnings for table rename collisions

0.9.6 (05/06/12)
-----
* Improvements on import file type checking
* Better encoding detection across all import types
* UI bugfixes 
* Improved navigation when lots of tabs open
* testing review and refactoring
* Improve the mapping of geometry at N/S extremes

0.9.5
-----
* CDB_RectangleGrid function, for simpler grids
* CDB_QueryTables accept concatenated statements and removes dupes
* improved speed, robustness and file type handling for imports
* documentation fixes
* bugfixes for oauth authentication

0.9.4
-----
* Update CDB_TransformToWebmercator to return NULL for geoms fully
  outside the valid webmercator boundary
* Add CDB_RandomTids function, for fast pseudo-random TID scans
* Add an hexagon builder functions CDB_Hexagon and CDB_HexagonGrid
* CDB_TransformToWebmercator 10x speed improvement
* Improve timeout in import stages
* Improved Shapefile importing
* Dashboard optimizations for large datasets
* Optimisations in embedded map 
* Improved bounds handling on map
* move geocoder to Yahoo
* Various GUI fixes
* HTTP API Key access from API Keys page
* Add an CDB_QueryTables function to find tables used by a query
* Improve granularity of caching invalidation to the table level


0.9.3
-----
* new styles for login etc
* table search
* core CartoDB SQL functions added (CDB_*)


0.9.2
-----
* .OSM import
* show top 100 tags
* ?q=search_term to dashboard url


0.9.1
-----
* public tables (share the url with anyone)
* download public table datasets
* session issues begone - allows you to login to multiple cartodbs
* free users cannot make private tables (but if they have them already they can keep them)
* import error codes and reporting
* upload file via API from ruby gem
* bubble maps for polygon layers
* bug fixes including map style invalidation

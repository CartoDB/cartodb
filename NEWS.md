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

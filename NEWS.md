0.9.4
-----
* Update CDB_TransformToWebmercator to return NULL for geoms fully
  outside the valid webmercator boundary
* Add CDB_RandomTids function, for fast pseudo-random TID scans
* Add an hexagon builder functions CDB_Hexagon and CDB_HexagonGrid
* Improve timeout in import stages
* Improved Shapefile importing
* Dashboard optimizations for large datasets
* Optimisations in embedded map 
* Improved bounds handling on map
* move geocoder to Yahoo
* Various GUI fixes
* HTTP API Key access from API Keys page
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

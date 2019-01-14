# Changelog

CARTO.js is a JavaScript library that interacts with different CARTO APIs. It is part of the CARTO Engine ecosystem.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

### Fixed
- Filters: parse dates properly in the `between` filter.

## 4.1.9 - 2019-01-09

### Added
- TomTom geocoder service [#2213](https://github.com/CartoDB/carto.js/issues/2213) 

### Fixed
- Histogram: fix wrong selection in last bucket.

### Changed
- Improve examples. [#2211](https://github.com/CartoDB/carto.js/pull/2211)

## 4.1.8 - 2018-10-29
### Fixed
- Moved 'browserify-shim' to devDependencies, fixing a potential problem with npm shrinkwrap.

## 4.1.7 - 2018-10-18
### Fixed
- Client: Fix `serverUrl` parameter: `{username}` replacement, validation and documentation.

## 4.1.6 - 2018-09-07
### Fixed
- Source Filters: Fix return in get-object-value that was causing unintended behaviors in parameters validation.

## 4.1.5 - 2018-09-05
### Added
- Source Filters: allow subqueries in `eq`, `notEq` in Category filter, and `lt`, `lte`, `gt`, `gte` in Range Filter.

## 4.1.4 - 2018-09-03
### Added
- Source Filters: allow to filter category columns by subquery. [#2186](https://github.com/CartoDB/carto.js/issues/2186)
- Source Filters: reset filter conditions with .resetFilters(). [#2186](https://github.com/CartoDB/carto.js/issues/2186)

### Fixed
- Source Filters: allow to combine empty filters. [#2186](https://github.com/CartoDB/carto.js/issues/2186)

## 4.1.3 - 2018-08-09
### Fixed
- Fix safari drag problem. [#2184](https://github.com/CartoDB/carto.js/pull/2184)

## 4.1.2 - 2018-07-31
### Fixed
- Fix `Promise is undefined` in IE11. [#2180](https://github.com/CartoDB/carto.js/issues/2180)

## 4.1.1 - 2018-07-17
### Fixed
- Fix popups/featureClick positions when scrolled. [#2179](https://github.com/CartoDB/carto.js/pull/2179)

### Changed
- Improve examples. [#2177](https://github.com/CartoDB/carto.js/pull/2177)

## 4.1.0 - 2018-07-13
### Added
- Docs: Add performance tips guide. [#2168](https://github.com/CartoDB/carto.js/issues/2168)

## 4.0.18 - 2018-07-12
### Added
- Histogram: added `start` and `end` options to modify the histogram range. [#2142](https://github.com/CartoDB/carto.js/issues/2142)

## 4.0.17 - 2018-07-12
### Added
- Layers: added `visible` to options. [#2004](https://github.com/CartoDB/carto.js/issues/2004)

### Changed
- Docs: Update 01-quickstart.md. [#2133](https://github.com/CartoDB/carto.js/pull/2133)

### Fixed
- Fix API key in quickstart example. [#2171](https://github.com/CartoDB/carto.js/pull/2171)

### Removed
- Remove Gemfile (compass). [#1909](https://github.com/CartoDB/carto.js/issues/1909)

## 4.0.16 - 2018-07-10
### Added
- Source filters: added new feature for filtering sources. [#2141](https://github.com/CartoDB/carto.js/issues/2141)

## 4.0.15 - 2018-07-06
### Fixed
- Allow multiple CARTO.js clients using Google Maps. [#2132](https://github.com/CartoDB/carto.js/issues/2132)

## 4.0.14 - 2018-07-06
### Fixed
- Dataviews: fix removeDataview not stopping fetching data [#2119](https://github.com/CartoDB/carto.js/issues/2119)

## 4.0.13 - 2018-07-06
### Added
- Add metrics to map instantiation. [#2139](https://github.com/CartoDB/carto.js/issues/2139)

## 4.0.12 - 2018-07-05
### Changed
- Debounced map instantiation. [#2140](https://github.com/CartoDB/carto.js/issues/2140)

## 4.0.11 - 2018-07-05
### Fixed
- Fix interactivity when only 'cartodb_id' is selected. [#2089](https://github.com/CartoDB/carto.js/issues/2089)

## 4.0.10 - 2018-07-04
### Added
- Dataviews: added century and millennium aggregations. [#2162](https://github.com/CartoDB/carto.js/issues/2162)
- Document new time series aggregations. [#2163](https://github.com/CartoDB/carto.js/issues/2163)

## 4.0.9 - 2018-07-02
### Added
- Add options as input argument to the getLeafletLayer() method. [#2125](https://github.com/CartoDB/carto.js/issues/2125)
- Add hexagon aggregation example. [#2151](https://github.com/CartoDB/carto.js/pull/2151)
- Improve structure of contents. [#2137](https://github.com/CartoDB/carto.js/pull/2137)

### Fixed
- Docs: fix Getting Started links. [#2144](https://github.com/CartoDB/carto.js/pull/2144)
- Docs: replace 'YOUR_API_KEY' with 'default_public' in examples. [#2136](https://github.com/CartoDB/carto.js/pull/2136)
- Docs: update CDN URL in reference documentation. [#2128](https://github.com/CartoDB/carto.js/pull/2128)

## 4.0.8 - 2018-06-04
### Fixed
- Google Maps examples were not working on iOS. [#1995](https://github.com/CartoDB/carto.js/issues/1995)

## 4.0.7 - 2018-06-04
### Changed
- Update gmaps to v3.32 in v4. [#2126](https://github.com/CartoDB/carto.js/pull/2126)

### Fixed
- Remove upper limit on Google Maps dependency.
- Small typo fixes for dev center docs. [#2124](https://github.com/CartoDB/carto.js/pull/2124)

## 4.0.6 - 2018-05-11
### Fixed
- Fix remove layers. [#2116](https://github.com/CartoDB/carto.js/pull/2116)

## 4.0.5 - 2018-05-10
- Internal fixes.

## 4.0.4 - 2018-05-09
- Internal fixes.

## 4.0.3 - 2018-05-04
### Changed
- Update zera version. [#2109](https://github.com/CartoDB/carto.js/pull/2109)

## 4.0.2 - 2018-04-27
### Fixed
- Add missing dependencies to release package. [#2108](https://github.com/CartoDB/carto.js/pull/2108)
- Ugrade zera to fix fractional zoom levels. [#2104](https://github.com/CartoDB/carto.js/pull/2104)

## 4.0.1 - 2018-04-25
### Changed
- Upgrading carto.js to gmaps v3.31. [#2067](https://github.com/CartoDB/carto.js/issues/2067)

## 4.0.0 - 2018-04-17
First public release of CARTO.js library
### Added
- New programmatic API
- New sources: Dataset, SQL
- New styles: CartoCSS
- New layers:  Layer (Tile Layer)
- New metadata: Buckets, Categories
- New dataviews: Formula, Category, Histogram, TimeSeries
- New filters: BoundingBox, BoundingBoxLeaflet, BoundingBoxGoogleMaps
- Server aggregation options for layers
- Multiple clients support
- Return native Leaflet and Google Maps layers
- Manage layers interactivity
- Granular error management
- Publish to npm and CDN
- Public documentation within the repo
- Examples and documentation

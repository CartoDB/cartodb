# Changelog

CARTO.js is a JavaScript library that interacts with different CARTO APIs. It is part of the CARTO Engine ecosystem.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## 4.1.4 - 2018-09-03

### Added
- Source Filters:
    - Allow to filter category columns by subquery. [#2186](https://github.com/CartoDB/carto.js/issues/2186)
    - Reset filter conditions with .resetFilters() [#2186](https://github.com/CartoDB/carto.js/issues/2186)

### Fixed
- Source Filters: Allow combining empty filters.  [#2186](https://github.com/CartoDB/carto.js/issues/2186)

## 4.1.0 - 2018-07-13

### Added
- Histogram: added `start` and `end` options to modify the histogram range. [#2142](https://github.com/CartoDB/carto.js/issues/2142)
- Time-series: added century and millennium aggregations [#2162](https://github.com/CartoDB/carto.js/issues/2162)
- Layers: added `visible` to options. [#2004](https://github.com/CartoDB/carto.js/issues/2004)
- Source filters: added new feature for filtering sources. [#2141](https://github.com/CartoDB/carto.js/issues/2141)
- Added options as input argument to the getLeafletLayer() method. [#2125](https://github.com/CartoDB/carto.js/issues/2125)
- Docs:
    - added performance tips guide. [#2168](https://github.com/CartoDB/carto.js/issues/2168)
    - added hexagon aggregation example. [#2151](https://github.com/CartoDB/carto.js/pull/2151)
    - improved structure of contents. [#2137](https://github.com/CartoDB/carto.js/pull/2137)

### Fixed
- Allow multiple CARTO.js clients using Google Maps. [#2132](https://github.com/CartoDB/carto.js/issues/2132)
- Dataviews:
    - fix removeDataview not stopping fetching data [#2119](https://github.com/CartoDB/carto.js/issues/2119)
- Debounced map instantiation. [#2140](https://github.com/CartoDB/carto.js/issues/2140)
- Fix interactivity when only 'cartodb_id' is selected [#2089](https://github.com/CartoDB/carto.js/issues/2089)
- Docs:
    - fixed Getting Started links. [#2144](https://github.com/CartoDB/carto.js/pull/2144)
    - replaced 'YOUR_API_KEY' with 'default_public' in examples. [#2136](https://github.com/CartoDB/carto.js/pull/2136)
    - Updated CDN URL in reference documentation. [#2128](https://github.com/CartoDB/carto.js/pull/2128)

## 4.0.8 - 2018-06-04

### Fixed

- Google Maps examples were not working on iOS [#1995](https://github.com/CartoDB/carto.js/issues/1995)

## 4.0.7 - 2018-06-04

### Fixed
- Remove upper limit on Google Maps dependency.

## 4.0.6 - 2018-05-11

### Fixed
- Fix remove layers

## 4.0.5 - 2018-05-10

- Internal fixes

## 4.0.4 - 2018-05-09

- Internal fixes

## 4.0.3 - 2018-05-09

- Internal fixes

## 4.0.3 - 2018-05-04

- Update zera version

## 4.0.2 - 2018-04-27

- Internal fixes

## 4.0.1 - 2018-04-25

- Upgrading carto.js to gmaps v3.31

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
- Examples

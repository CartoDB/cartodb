# Changelog

## Current
- Add performance tips to CARTO.js docs
- Refactor and ignore tests

## 4.0.18 - 2018-07-12

- Add 'start' and 'end' values to histogram public API

## 4.0.18-0 - 2018-07-12

- Fix torque

## 4.0.17 - 2018-07-12

- Add 'visible' to layer options
- Fix API key in quickstart example
- Update 01-quickstart.md
- Remove Gemfile (compass)

## 4.0.16 - 2018-07-10

- Source Filters

## 4.0.15 - 2018-07-06

- Allow multiple carto clients using Google Maps

## 4.0.14 - 2018-07-06

- Fix removeDataview

## 4.0.13 - 2018-07-06

- Add metrics to map instantiation

## 4.0.12 - 2018-07-05

- Debounced fetch

## 4.0.11 - 2018-07-05

- Fix interactivity when only 'cartodb_id' is selected

## 4.0.11-1 - 2018-07-05

- Transpile ES6 code through Babel in Webpack 4

## 4.0.11-0 - 2018-07-05

- Fix gradient legends margin

## 4.0.10 - 2018-07-04

- Document new time series aggregations

## 4.0.10-1 - 2018-07-04


## 4.0.10-0 - 2018-07-04

- Add century and millenium to date aggregation

## 4.0.9 - 2018-07-02

### New features
- add options to getLeafletLayer (#2125)

## 4.0.9-2 - 2018-06-29

- Add new logo

## 4.0.9-1 - 2018-06-29

- Fix choropleth legends margin
- add hexagon aggregation example
- Improving structure of contents
- Fixes Getting Started links

## 4.0.9-0 - 2018-06-19

- Fix margins on legends
- Replace 'YOUR_API_KEY' with 'default_public' in examples
- Update cdn url in reference documentation

## 4.0.8 - 2018-06-04

- Fix iOS examples

## 4.0.7 - 2018-06-04

### Fixes
- Update gmaps to v3.32 in v4

## 4.0.7-3 - 2018-05-24

- Send empty string when url can not be build
- Small typo fixes for dev center docs

## 4.0.7-2 - 2018-05-21

- Avoid problems with cancelled requests in dataviews

## 4.0.7-1 - 2018-05-21

- Fix legends paddings / margins

## 4.0.7-0 - 2018-05-17

- Rename package to internal-carto.js

## 4.0.6 - 2018-05-11

### Fixes
- Fix remove layers

## 4.0.5 - 2018-05-10

- Add new methods to cartoDB layer

## 4.0.4 - 2018-05-09


## 4.0.3 - 2018-05-09

- Fix layer legends margin

## 4.0.3 - 2018-05-04

- Update zera version

## 4.0.2 - 2018-04-27


## 4.0.2-2 - 2018-04-27

- Add missing dependencies to release package

## 4.0.2-1 - 2018-04-27


## 4.0.2-0 - 2018-04-25

### Fixes
- Round fractional zoom levels (#4314)

## 4.0.1 - 2018-04-25

- Upgrading carto.js to gmaps v3.31

## 4.0.1-1 - 2018-04-24

- Removing suffix, preparing for a new version (with bump)
- Better popups with just images on IE and Edge

## 4.0.0-3 - 2018-04-24


## 4.0.1-0 - 2018-04-24


## 4.0.2-0 - 2018-04-24


## 4.0.0 - 2018-04-24


## 4.0.0-2 - 2018-04-24

- Fix embed legends margin
- Enable stale bot

## 4.0.0-1 - 2018-04-17


## 4.0.0 - 2018-04-17

- Fix wrong examples

## 4.0.0-beta.41 - 2018-04-17

- Adapt to Auth API errors
- Change API menu GIF.
### New features
- Add usage box to CARTO.js examples

## 4.0.0-beta.40 - 2018-04-12

- Minor adjustments to legends style
- V4 docs final review
- add tip about authorization system
- Update README and CHANGELOG

## 4.0.0-beta.39 - 2018-03-28

- Added example for the url server parameter
- Unify engine mock

## 4.0.0-beta.38 - 2018-03-23

- Move template2x decision to leaflet rendering

## 4.0.0-beta.37 - 2018-03-23

- Propagate API keys to dataviews in public API

## 4.0.0-beta.36 - 2018-03-20


## 4.0.0-beta.35 - 2018-03-19

- Add hasBeenFetched flag to histogram

## 4.0.0-beta.34 - 2018-03-14

- Re-render legends when layers order is changed

## 4.0.0-beta.33 - 2018-03-05

- Suppress horizontal scroll in legends. Fixes IE11

## 4.0.0-beta.32 - 2018-02-26

- Fix legends

## 4.0.0-beta.31 - 2018-02-23

### Fixes
- Hot size legends are broken.

## 4.0.0-beta.30 - 2018-02-23


## 4.0.0-beta.29 - 2018-02-23

- prepare shield-placement-keyword CartoCSS property

## 4.0.0-beta.28 - 2018-02-21

- 2046 move docs

## 4.0.0-beta.27 - 2018-02-21

- Adjust styles mobile view embed maps [WIP]

## 4.0.0-beta.26 - 2018-02-20

- add marker size to layer cartocss props to reinstantiate torque map

## 4.0.0-beta.25 - 2018-02-15


## 4.0.0-beta.24 - 2018-02-15

- Freeze GMaps script version
- Warn instead of error if no API key
- Fix popup examples for polygons
### New features
- Revert "Hide aggregation from public api" (#2029)
### Fixes
- Added server aggregation validation #2032
- Check parameters when creating bounding box filters. #2003

## 4.0.0-beta.23 - 2018-02-06

- Update all examples to Leaflet1.3.1
### Fixes
- remove unnecessary`sync_on_data_change` #2036

## 4.0.0-beta.22 - 2018-02-01

- Use retina url in high resolution screens

## 4.0.0-beta.21 - 2018-02-01

- Set Leaflet zoomAnimationThreshold to 1000 (internal only)
- Define layers order

## 4.0.0-beta.20 - 2018-02-01

- Remove tangram support

## 4.0.0-beta.19 - 2018-02-01

- Examples feedback
- 2011 autogenerate changelog

## 4.0.0-beta.18 - 2018-01-31

- Override scrollwheel if it's boolean

## 4.0.0-beta.17 - 2018-01-30


## 4.0.0-beta.12 - 2018-01-30

- 5067 add mapbox geocoder

## 4.0.0-beta.16 - 2018-01-30

- Append legends view if js-embed-legends is found

## 4.0.0-beta.15 - 2018-01-29

- Remove category value stringify

## 4.0.0-beta.14 - 2018-01-19

- Merge pull request #2017 from CartoDB/11341-add-dblclick-event
- 11341 add dblclick event

## 4.0.0-beta.13 - 2018-01-18

### New features
- add layer zoom options (#2002)
- Add aggregation options to layer constructor (#2010)

## 4.0.0-beta.12 - 2018-01-18

### New features
- Allow custom IDs in layers (#2000)

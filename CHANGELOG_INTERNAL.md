# Changelog internal

This file contains all the changes in the **internal bundle** (used by Builder). Each change corresponds to a **pre-release version**.

All the changes that affects the public bundle should be released as *patch* or *minor* and be included in the main Changelog.

## Unreleased


## 4.1.1-0 - 2018-07-13
- Use setView instead of flyTo to improve zoom transitions. [#2178](https://github.com/CartoDB/carto.js/pull/2178)

## 4.0.18-0 - 2018-07-12
- Fix torque layers when analysis are applied. [#2175](https://github.com/CartoDB/carto.js/pull/2175)

## 4.0.11-1 - 2018-07-05
- Transpile ES6 code through Babel in Webpack 4. [#2155](https://github.com/CartoDB/carto.js/pull/2155)

## 4.0.11-0 - 2018-07-05
- Fix gradient legends margin. [#2166](https://github.com/CartoDB/carto.js/pull/2166)

## 4.0.9-2 - 2018-06-29
- Add new CARTO logo. [#2159](https://github.com/CartoDB/carto.js/pull/2159)

## 4.0.9-1 - 2018-06-29
- Fix choropleth legends margin. [#2157](https://github.com/CartoDB/carto.js/pull/2157)

## 4.0.9-0 - 2018-06-19
- Fix margins on legends. [#2143](https://github.com/CartoDB/carto.js/pull/2143)

## 4.0.7-3 - 2018-05-24
- Send empty string when url can not be build. [#2122](https://github.com/CartoDB/carto.js/issues/2122)

## 4.0.7-2 - 2018-05-21
- Avoid problems with cancelled requests in dataviews. [#2118](https://github.com/CartoDB/carto.js/pull/2118)

## 4.0.7-1 - 2018-05-21
- Fix legends paddings / margins. [#2121](https://github.com/CartoDB/carto.js/pull/2121)

## 4.0.7-0 - 2018-05-17
- Rename package to internal-carto.js. [#2120](https://github.com/CartoDB/carto.js/pull/2120)

## 4.0.5 - 2018-05-10
- Add new methods to cartoDB layer. [#2111](https://github.com/CartoDB/carto.js/pull/2111)

## 4.0.4 - 2018-05-09
- Fix layer legends margin. [#2112](https://github.com/CartoDB/carto.js/pull/2112)

## 4.0.1-1 - 2018-04-24
- Better popups with just images on IE and Edge. [#2105](https://github.com/CartoDB/carto.js/pull/2105)

## 4.0.0-2 - 2018-04-24
- Fix embed legends margin
- Enable stale bot

## 4.0.0-beta.41 - 2018-04-17
- Adapt to Auth API errors
- Change API menu GIF.
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

## 4.0.0-beta.35 - 2018-03-19
- Add hasBeenFetched flag to histogram

## 4.0.0-beta.34 - 2018-03-14
- Re-render legends when layers order is changed

## 4.0.0-beta.33 - 2018-03-05
- Suppress horizontal scroll in legends. Fixes IE11

## 4.0.0-beta.32 - 2018-02-26
- Fix legends

## 4.0.0-beta.31 - 2018-02-23
- Hot size legends are broken.

## 4.0.0-beta.29 - 2018-02-23
- prepare shield-placement-keyword CartoCSS property

## 4.0.0-beta.28 - 2018-02-21
- 2046 move docs

## 4.0.0-beta.27 - 2018-02-21
- Adjust styles mobile view embed maps [WIP]

## 4.0.0-beta.26 - 2018-02-20
- add marker size to layer cartocss props to reinstantiate torque map

## 4.0.0-beta.24 - 2018-02-15
- Freeze GMaps script version
- Warn instead of error if no API key
- Fix popup examples for polygons
- Revert "Hide aggregation from public api" (#2029)
- Added server aggregation validation #2032
- Check parameters when creating bounding box filters. #2003

## 4.0.0-beta.23 - 2018-02-06
- Update all examples to Leaflet1.3.1
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
- 5067 add mapbox geocoder

## 4.0.0-beta.16 - 2018-01-30
- Append legends view if js-embed-legends is found

## 4.0.0-beta.15 - 2018-01-29
- Remove category value stringify

## 4.0.0-beta.14 - 2018-01-19
- Merge pull request #2017 from CartoDB/11341-add-dblclick-event
- 11341 add dblclick event

## 4.0.0-beta.13 - 2018-01-18
- add layer zoom options (#2002)
- Add aggregation options to layer constructor (#2010)

## 4.0.0-beta.12 - 2018-01-18
- Allow custom IDs in layers (#2000)

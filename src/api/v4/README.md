# V4 API

This folder contains the source files used in the `v4 public api`.

This api build using wrappers over the internal objects, those wrappers have an easy-to-use public methods,
the reference to the internal objects can be obtained  with the `$getInternalModel` method.

The `$` before a method name is a naming convention. Those methods shall not be exposed in the public API
but can be used from different files. (Public only for developers).

## Api structure

All the api methods and objects are exposed through the public `carto` object.

- `carto.client` : The main object used in a CARTO.js app
- `carto.source`: Namespace for the sources.
    - `Dataset`: Get all the data from a table
    - `SQL`: Get the data from a custom SQL query
- `carto.style`: Namespace for the styles
    - `CartoCSS`: Constructor to build layer styles.
- `carto.layer` : Namespace for the layers
    - `Layer`: Constructor to build a Layer object
- `carto.dataview` : Namespace for the dataviews
    - `Formula`: Constructor to build a Formula dataview
    - `Category`: Constructor to build a Category dataview
    - `Histogram`: Constructor to build a Histogram dataview
    - `Time Series`: Constructor to build a Time Series dataview
- `carto.filter` : Namespace for the filters
    - `BoundingBox`: Constructor to build a BoundingBox filter
    - `BoundingBoxLeaflet`: Constructor to build a BoundingBoxLeaflet filter

- `carto.operation` : Enum with the operations available.
- `carto.dataview.status` : Enum with the dataview statuses available.

## Usage

### Common.js

```javascript
const carto = require('cartojs');
```

### Loading CARTO.js from a CDN

```javascript
window.carto; // All the api is available here
```

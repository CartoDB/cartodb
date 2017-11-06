# V4 API

This folder contains the source files used in the `v4 public api`.

This api build using wrappers over the internal objects, those wrappers have an easy-to-use public methods,
the reference to the internal objects can be obtained  with the `$getInternalModel` method.

The `$` before a method name is a naming convetion. Those methods sall not be exposed in the public API
but can be used from different files. (Public only for developers).

## Api structure

All the api methods and objects are exposed through the public `carto` object.

- `carto.client` : The main object used in a carto.js app
- `carto.source`: Namespace for the sources.
    - `Dataset`: Get all the data from a table
    - `SQL`: Get the data from a custom SQL query
- `carto.style`: Namespace for the styles
    - `CartoCSS`: Constructor to build layer styles.
- `carto.layer` : Namespace for the layers
    - `Layer`: Constructor to build a Layer object
- `carto.dataview` : Namespace for the dataviews
    - `Formula`: Constructor to build a Formula dataview


- `carto.events` : Enum with the events available in the client.
- `carto.operation` : Enum with the operations available.
- `carto.dataview.status` : Enum with the dataview statuses available.

## Usage

### Common.js

```javascript
const carto = require('cartojs');
```

### Loading carto.js from a CDN

```javascript
window.carto; // All the api is availiable here
```

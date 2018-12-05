## Loading the Library
CARTO.js is hosted on a CDN for easy loading. You can load the full source "carto.js" file or the minified version "carto.min.js". Once the script is loaded, you will have a global `carto` namespace.
CARTO.js is hosted in NPM as well. You can require it as a dependency in your custom apps.

```html
<!-- CDN: load the latest CARTO.js version -->
<script src="https://libs.cartocdn.com/carto.js/%VERSION%/carto.min.js"></script>

<!-- CDN: load a specific CARTO.js version-->
<script src="https://libs.cartocdn.com/carto.js/%REPLACE_WITH_VERSION%/carto.min.js"></script>
```

```javascript
// NPM: load the latest CARTO.js version
npm install @carto/carto.js
// or
yarn add @carto/carto.js

var carto = require('@carto/carto.js');
```

## Introduction

CARTO.js is a JavaScript library that interacts with different CARTO APIs. It is part of the [CARTO Engine](https://carto.com/pricing/engine/) ecosystem.

To understand the fundamentals of CARTO.js 4.0, [read the guides]({{site.cartojs_docs}}/guides/quickstart/). To view the source code, browse the [open-source repository](https://github.com/CartoDB/cartodb.js) in Github and contribute. Otherwise, view [examples with Leaflet and Google Maps]({{site.cartojs_docs}}/examples/) or find different [support options]({site.cartojs_docs}}/support/).

If you find any trouble understanding any term written in this reference, please visit our [glossary]({{site.cartojs_docs}}/guides/glossary/)

The contents described in this document are subject to CARTO's [Terms of Service](https://carto.com/legal/)



## Authentication

CARTO.js 4.0 requires using an API Key. From your CARTO dashboard, click _[Your API keys](https://carto.com/login)_ from the avatar drop-down menu to view your uniquely generated API Key for managing data with CARTO Engine.

![Your API Keys](../img/avatar.gif)

The examples in this documentation include a placeholder for the API Key. Ensure that you modify any placeholder parameters with your own credentials. You will have to supply your unique API Key to a [`carto.Client`](#cartoclient).

```javascript
var client = new carto.Client({
    apiKey: 'YOUR_API_KEY_HERE',
    username: 'YOUR_USERNAME_HERE'
});
```

## Versioning

CARTO.js uses [Semantic Versioning](http://semver.org/). View our Github repository to find tags for each [release](https://github.com/CartoDB/cartodb.js/releases).

To get the version number programmatically, use `carto.version`.

```javascript
console.log(carto.version);
// returns the version of the library
```

## Loading the Library 
CARTO.js is hosted on a CDN for easy loading. You can load the full source "carto.js" file or the minified version "carto.min.js". Once the script is loaded, you will have a global `carto` namespace.
CARTO.js is hosted in NPM as well. You can require it as a dependency in your custom apps.

```html
<!-- CDN: load the latest CARTO.js version -->
<script src="https://cartodb-libs.global.ssl.fastly.net/carto.js/v4.0.0-beta/carto.min.js"></script>

<!-- CDN: load a specific CARTO.js version-->
<script src="https://cartodb-libs.global.ssl.fastly.net/carto.js/%VERSION%/carto.min.js"></script>
```

```javascript
// NPM: load the latest CARTO.js version
npm install carto.js
// or
yarn add carto.js

var carto = require('carto.js');
```

## Error Handling

Most of the errors fired by the library are handled by the client itself. The client will trigger a `CartoError` every time an error happens.

A cartoError is an object containing a single `message` field with a string explaining the error.

Some methods in CARTO.js are asynchronous. This means that they return a promise that will be fulfilled when the asynchronous work is done or rejected with a `CartoError` when an error occurs.


```javascript
// All errors are passed to the client.
client.on(carto.events.ERROR, cartoError => {
    console.error(cartoError.message):
})

// .addLayer() is async.
client.addLayer(newLayer)
    .then(successCallback)
    .catch(errorCallback);
```

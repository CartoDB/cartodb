## Upgrade Considerations Guide

This document is intended for existing developers who have used [previous versions]({{site.cartojs_docs}}/reference/#versioning) of CARTO.js.

### About this Guide

This guide describes how the CARTO.js library has changed to support additional functionality. It outlines the basic workflow for creating an application and includes an example of updating an old application using the new library.

**Tip**: The authorization system behaves in a uniform way for any version of CARTO.js. You can read about the [fundamentals of authorization]({{site.fundamental_docs}}/authorization/) or know implementation details of the [Auth API]({{site.authapi_docs}}/) under the hood.

At a high-level, the workflow consists of:

 1. Define the client parameters to manage layers and dataviews:
     - [`new carto.Client`]({{site.cartojs_docs}}/reference/#cartoclient)
     - [`addLayers`]({{site.cartojs_docs}}/reference/#cartoclientaddlayer)
     - [`addDataview`]({{site.cartojs_docs}}/reference/#cartoclientadddataview) or [`addDataviews`]({{site.cartojs_docs}}/reference/#cartoclientadddataviews)
     - [`getDataviews`]({{site.cartojs_docs}}/reference/#cartoclientgetdataviews)

2. Define the Base data source objects:
    - Add dataset as the source [`carto.source.dataset`]({{site.cartojs_docs}}/reference/#cartosourcedataset)
    - Add SQL to filter data [`carto.source.sql`]({{site.cartojs_docs}}/reference/#cartosourcesql)

3. Publish the App:
    - [`getLayers`]({{site.cartojs_docs}}/reference/#cartoclientgetlayers)

You should understand the following changes in concept before you begin.

#### Dataset Privacy

Since we now have a new authorization system for the entire CARTO platform, directly related to dataset privacy, datasets can be public and private as well. Read the [basics of authorization]({{site.fundamental_docs}}/authorization/) to learn more about this aspect of the CARTO platform.

#### Map Workflow

`new carto.Client` is the main entry point for building your application. This enables you to communicate between your app and your CARTO account by using your API Key. This enhancement clearly identifies client requests separate from visualization requests.

#### `createVis`

The current beta of CARTO.js only includes a JavaScript library, it does not include `creatVis` components to maintain your app. A future enhancement of the library will include functionality for maintaining your core application.

#### `Dataview`

A Dataview enables you to create different views of data stored in a table. CARTO.js uses `Dataviews` to add interactive widgets for viewing and filtering map data.

#### SQL API Integration

CARTO.js no longer includes a client for the SQL API. Developers looking to get data from their CARTO account can query SQL API with AJAX or the new [JS Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)..

## Upgrading an Existing Application

Suppose you have an app that was created with an earlier version of CARTO.js? This guide provides an example of CARTO.js components showing the old code modified with updated code.

The following example shows the application skeleton using version 3.15 of CARTO.js.

```html
<!DOCTYPE html>
<html>

<head>
    <meta name="viewport" content="initial-scale=1.0" />
    <meta charset="utf-8" />
     <!-- include CartoDB.js CSS library -->
     <link rel="stylesheet" href="http://libs.cartocdn.com/cartodb.js/v3/3.15/themes/css/cartodb.css" />
     <!-- include CartoDB.js library -->
     <script src="http://libs.cartocdn.com/cartodb.js/v3/3.15/cartodb.js"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
        }

        #map {
            position: absolute;
            height: 100%;
            width: 100%;
        }
    </style>
</head>

<body>
    <div id="map"></div>
    <script>
        const map = L.map('map').setView([30, 0], 3);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png', {
            maxZoom: 18
        }).addTo(map);

        cartodb.createLayer(map, {
      user_name: 'YOUR_USER_NAME',
      type: 'cartodb',
      sublayers: [

        {
           type: "mapnik",
           sql: 'select * from populated_places_spf',
           cartocss: '#populated_places_spf[adm0name = "Spain"]{ marker-fill: #fbb4ae; marker-allow-overlap: true;}#populated_places_spf[adm0name = "Portugal"]{ marker-fill: #ccebc5; marker-allow-overlap: true;}#populated_places_spf[adm0name = "France"]{ marker-fill: #b3cde3; marker-allow-overlap: true;}'
        }
      ]
    })
  .addTo(map);
    </script>
</body>

</html>
```

In order to make this example work with version 4 of CARTO.js, modify the code as follows:

```html
<!DOCTYPE html>
<html>

<head>
    <meta name="viewport" content="initial-scale=1.0" />
    <meta charset="utf-8" />
    <!-- Include Leaflet -->
    <script src="https://unpkg.com/leaflet@1.2.0/dist/leaflet.js"></script>
    <link href="https://unpkg.com/leaflet@1.2.0/dist/leaflet.css" rel="stylesheet">
    <!-- Include CARTO.js -->
    <script src="https://cartodb-libs.global.ssl.fastly.net/carto.js/%VERSION%/carto.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
        }

        #map {
            position: absolute;
            height: 100%;
            width: 100%;
        }
    </style>
</head>

<body>
    <div id="map"></div>
    <script>
        const map = L.map('map').setView([30, 0], 3);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png', {
            maxZoom: 18
        }).addTo(map);

        // define client
        const client = new carto.Client({
            apiKey: 'YOUR_API_KEY',
            username: 'YOUR_USER_NAME'
        });
        // define source of data => dataset of your account
        const source = new carto.source.Dataset(`populated_places_spf`);
        // define CartoCSS code to style data on map
        const style = new carto.style.CartoCSS(`
            #layer[adm0name = "Spain"]{
                marker-fill: #fbb4ae;
                marker-allow-overlap: true;
            }
            #layer[adm0name = "Portugal"]{
                marker-fill: #ccebc5;
                marker-allow-overlap: true;
            }
            #layer[adm0name = "France"]{
                marker-fill: #b3cde3;
                marker-allow-overlap: true;
            }`);
        // create CARTO layer from source and style variables
        const Cartolayer = new carto.layer.Layer(source, style);

        // add CARTO layer to the client
        client.addLayer(Cartolayer);

        // get tile from client and add them to the map object
        client.getLeafletLayer().addTo(map);
    </script>
</body>

</html>
```

#### Conclusion

For more details about how to use CARTO.js, [view the examples]({{site.cartojs_docs}}/examples/) section for specific features of CARTO.js in action.

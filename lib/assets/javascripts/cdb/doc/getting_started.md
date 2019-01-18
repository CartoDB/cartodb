# Getting Started

The simplest way to use a visualization created in CARTO on an external site is as follows:

```html
<link rel="stylesheet" href="http://libs.cartocdn.com/cartodb.js/v3/3.15/themes/css/cartodb.css" />
...
<div id="map"></div>
...
<script src="http://libs.cartocdn.com/cartodb.js/v3/3.15/cartodb.js"></script>
<script>
// get the viz.json url from the CARTO Editor
// - click on visualize
// - create new visualization
// - make visualization public
// - click on publish
// - go to API tab

window.onload = function() {
  cartodb.createVis('map', 'http://documentation.carto.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json');
}
</script>
```

[Here is the complete example source code](https://github.com/CartoDB/cartodb.js/blob/develop/examples/easy.html)

## Using the CARTO.js Library

CARTO.js can be used to embed a visualization you have designed using CARTO's user interface, or to dynamically create visualizations from scratch, using your data. If you want to create new maps on your webpage, jump to [Creating a visualization from scratch](#creating-a-visualization-from-scratch). If you already have maps on your webpage and want to add CARTO visualizations to them, read [Adding CARTO layers to an existing map](#adding-carto-layers-to-an-existing-map).

You can also use the CARTO APIs to create visualizations programmatically. This can be useful when the visualizations react to user interactions. To read more about it, jump to [Creating visualizations at runtime](#creating-visualizations-at-runtime).

To start using CARTO.js, paste this piece of code within the HEAD tags of your HTML:

```html
<link rel="stylesheet" href="http://libs.cartocdn.com/cartodb.js/v3/3.15/themes/css/cartodb.css" />
<script src="http://libs.cartocdn.com/cartodb.js/v3/3.15/cartodb.js"></script>
```

### Other Mapping Libraries

We have also made it easy for you to build maps using the mapping library of your choice. Whether you are using [Leaflet](#leaflet-integration) or something else, our CARTO.js code remains the same. This makes our API documentation simple and straightforward. It also makes it easy for you to consistently develop, or maintain, multiple maps online.

_**Note:** CARTO.js automatically includes dependencies from other mapping libraries (such as Leaflet, jQuery, Mustache, Underscore, and so on). You do not have to manually include these libraries, or worry about other mapping library version control, when you are using CARTO.js. If you need to see which version of other mapping libraries are included, view the [vendor](https://github.com/CartoDB/cartodb.js/tree/3.15.9/vendor) folder for each CARTO.js release._

## Creating a Visualization from Scratch

This is the easiest way to quickly get a CARTO map onto your webpage. Use this method when there is no map in your application, and you want to add the visualization to hack over it. CARTO.js handles all the details of loading a map interface, basemap, and your CARTO visualization.

You can start by giving CARTO.js the DIV ID from your HTML where you want to place your map, and the viz.json URL of your visualization (which you can get from the [Publish your map](http://docs.carto.com/carto-editor/maps/#publish-and-share-your-map) options).

```javascript
cartodb.createVis('map', 'http://documentation.carto.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json');
```

That’s it! No need to create the map instance, insert controls, or load layers. CARTO.js takes care of this for you. 

### VizJSON Support

The viz.json file tells CARTO.js all the information about your map, including the style you want to use for your data and the filters you want to apply with SQL. The viz.json file is served with each map you create in your CARTO account.

Although the viz.json file stores all your map settings, all these settings can be easily customized with CARTO.js. If you want to modify the result after instantiating your map with the viz.json, reference the CARTO.js API [available methods](#api-methods). For example, you can also use the returned layer to build more functionality (show/hide, click, hover, custom infowindows):

```javascript
cartodb.createVis('map', 'http://documentation.carto.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json')
  .done(function(vis, layers) {
    // layer 0 is the base layer, layer 1 is cartodb layer
    // when setInteraction is disabled featureOver is triggered
    layers[1].setInteraction(true);
    layers[1].on('featureOver', function(e, latlng, pos, data, layerNumber) {
      console.log(e, latlng, pos, data, layerNumber);
    });

    // you can get the native map to work with it
    var map = vis.getNativeMap();

    // now, perform any operations you need, e.g. assuming map is a L.Map object:
    // map.setZoom(3);
    // map.panTo([50.5, 30.5]);
  });
```

**Tip:** You can download a viz.json from any visualization you have created and inspect it with a text editor, or view it in your browser if you have a JSON viewer. If you are unfamiliar with the JSON file format, view the [official JSON website](http://json.org/) for more information.

## Adding CARTO Layers to an Existing Map

In case you already have a map instantiated on your page, you can simply use the [createLayer](https://carto.com/docs/carto-engine/carto-js/api-methods/#cartodbcreatelayermap-layersource--options--callback) method to add new CARTO layers to it. This is particularly useful when you have more things on your map apart from CARTO layers or you have an application where you want to integrate CARTO layers.

Below, you have an example using a previously instantiated Leaflet map.

```html
<div id="map_canvas"></div>

<script>
  var map = new L.Map('map_canvas', {
    center: [0,0],
    zoom: 2
  });

  cartodb.createLayer(map, 'http://documentation.carto.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json')
    .addTo(map)
    .on('done', function(layer) {
      //do stuff
    })
    .on('error', function(err) {
      alert("some error occurred: " + err);
    });
</script>
```

[Here is the complete example source code](https://github.com/CartoDB/cartodb.js/blob/develop/examples/leaflet.html)

## Creating Visualizations at Runtime

All CARTO services are available through the API, which basically means that you can create a new visualization without doing it before through CARTO Editor. This is particularly useful when you are modifying the visualization depending on user interactions that change the SQL to get the data or CartoCSS to style it. Although this method requires more programming skills, it provides all the flexibility you might need to create more dynamic visualizations.

When you create a visualization using the CARTO website, you automatically get a viz.json URL that defines it. When you want to create the visualization via JavaScript, you don't always have a viz.json. You will need to pass all the required parameters to the library so that it can create the visualization at runtime and display it on your map. It is pretty simple.

```javascript
// create a layer with 1 sublayer
cartodb.createLayer(map, {
  user_name: 'username',
  type: 'cartodb',
  sublayers: [{
    sql: "SELECT * FROM table_name",
    cartocss: '#table_name {marker-fill: #F0F0F0;}'
  }]
})
.addTo(map) // add the layer to our map which already contains 1 sublayer
.done(function(layer) {

  // create and add a new sublayer
  layer.createSubLayer({
    sql: "SELECT * FROM table_name limit 200",
    cartocss: '#table_name {marker-fill: #F0F0F0;}'
  });

  // change the query for the first layer
  layer.getSubLayer(0).setSQL("SELECT * FROM table_name limit 10");
});
```

Want more information? [See the complete list of API methods](https://carto.com/docs/carto-engine/carto-js/api-methods/#api-methods).

---

## Leaflet Integration

If you want to use [Leaflet](http://leafletjs.com), it gets even easier. CARTO.js handles loading all the [necessary libraries for you](http://docs.carto.com/carto-engine/carto-js/getting-started/#other-mapping-libraries)! Just include CartoDB.js and CartoDB.css in the HEAD of your website and you are ready to go! The CartoDB.css document is not mandatory. However, if you are making a map, and are not familiar with writing your own CSS for the various needed elements, it can help you jumpstart the process. Using Leaflet is as simple as adding the main JavaScript library:

```html
<link rel="stylesheet" href="http://libs.cartocdn.com/cartodb.js/v3/3.15/themes/css/cartodb.css" />
<script src="http://libs.cartocdn.com/cartodb.js/v3/3.15/cartodb.js"></script>
```

---

## HTTPS Support

You can use all the functionality of CARTO.js with HTTPs support. Be sure to use https when importing both the JS library and the CSS file. You will also need to use HTTPs in the viz.json URL you pass to `createVis` or `createLayer`.

```html
<div id="map"></div>

<link rel="stylesheet" href="https://cartodb-libs.global.ssl.fastly.net/cartodb.js/v3/3.15/themes/css/cartodb.css" />
<script src="https://cartodb-libs.global.ssl.fastly.net/cartodb.js/v3/3.15/cartodb.js"></script>

<script>
  var map = new L.Map('map', {
    center: [0,0],
    zoom: 2
  })
  cartodb.createLayer(map, 'https://examples.carto.com/api/v1/viz/15589/viz.json', { https: true })
    .addTo(map)
    .on('error', function(err) {
      alert("some error occurred: " + err);
    });
</script>
```

## Using a Different Host 

CARTO.js sends all requests to the carto.com domain by default. If you are running your own instance of CARTO, you can change the URLs to specify a different host.

A different host can be configured by using ``sql_api_template`` and ``maps_api_template`` in the ``options`` parameter
for any ``cartodb`` function call.

The format of these templates is as follows:

```javascript
sql_api_template: 'https://{user}.test.com'
```

CARTO.js will replace ``{user}``.

Note that you do not need to set the path to the endpoint, CARTO.js sets it automatically.

## Loading Listener Events

To async portions of the CARTO.js library, the [`createLayer`](http://docs.carto.com/carto-engine/carto-js/api-methods/#cartodbcreatelayermap-layersource--options--callback) and [`createVis`](http://docs.carto.com/carto-engine/carto-js/api-methods/#cartodbcreatevis) API Methods trigger two important listener events for you to take advantage of: 

- **done**, tells your code that the library has successfully read the information from the viz.json, and loaded the layer you requested.

- **error**, tells you that something did not go as expected when trying to load the requested layer:

```javascript
cartodb.createLayer(map, 'http://examples.carto.com/api/v1/viz/0001/viz.json')
  .addTo(map)
  .on('done', function(layer) {
    alert(‘CartoDB layer loaded!’);
  }).on('error', function(err) {
    alert("some error occurred: " + err);
  });
```

**Note:** For information about active layer events, which are triggered by layers on your webpage that are already loaded, see [Events](http://docs.carto.com/carto-engine/carto-js/events/).

## CARTO.js Usage Examples

The best way to start learning about the library is by taking a look at some of the examples below:

+ An easy example using the library - ([view live](http://cartodb.github.com/cartodb.js/examples/easy.html) / [source code](https://github.com/CartoDB/cartodb.js/blob/develop/examples/easy.html)).
+ Leaflet integration - ([view live](http://cartodb.github.com/cartodb.js/examples/leaflet.html) / [source code](https://github.com/CartoDB/cartodb.js/blob/develop/examples/leaflet.html)).
+ Customizing infowindow data - ([view live](http://cartodb.github.com/cartodb.js/examples/custom_infowindow.html) / [source code](https://github.com/CartoDB/cartodb.js/blob/develop/examples/custom_infowindow.html)).
+ An example using a layer selector - ([view live](http://cartodb.github.com/cartodb.js/examples/layer_selector.html) / [source code](https://github.com/CartoDB/cartodb.js/blob/develop/examples/layer_selector.html)).

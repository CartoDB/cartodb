# Getting started

The simplest way to use a visualization created in CartoDB on an external site is as follows:

```html
<link rel="stylesheet" href="http://libs.cartocdn.com/cartodb.js/v3/3.15/themes/css/cartodb.css" />
...
<div id="map"></div>
...
<script src="http://libs.cartocdn.com/cartodb.js/v3/3.15/cartodb.js"></script>
<script>
// get the viz.json url from the CartoDB Editor
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

[Grab the complete example source code](https://github.com/CartoDB/cartodb.js/blob/develop/examples/easy.html)

## Using the library

CartoDB.js can be used when you want to embed and use a visualization you have designed using CartoDB's user interface, or to dynamically create visualizations from scratch using your data. If you want to create new maps on your webpage, jump to [Creating a visualization from scratch](#creating-a-visualization-from-scratch). If you already have maps on your webpage and want to add CartoDB visualizations to them, read [Adding CartoDB layers to an existing map](#adding-cartodb-layers-to-an-existing-map).

You can also use the CartoDB API to create visualizations programmatically. This can be useful when the visualizations react to user interactions. To read more about it jump to [Creating visualizations at runtime](#creating-visualizations-at-runtime).

We’ve also made it easier than ever for you to build maps using the mapping library of your choice. Whether you are using Leaflet or something else, our CartoDB.js code remains the same. This makes our API documentation simple and straightforward. It also makes it easy for you to remember and be consistent if you develop or maintain multiple maps online.

To start using CartoDB.js just paste this piece of code within the HEAD tags of your HTML:

```html
<link rel="stylesheet" href="http://libs.cartocdn.com/cartodb.js/v3/3.15/themes/css/cartodb.css" />
<script src="http://libs.cartocdn.com/cartodb.js/v3/3.15/cartodb.js"></script>
```

### Creating a visualization from scratch

The easiest way to quickly get a CartoDB map onto your webpage. Use this when there is no map in your application and you want to add the visualization to hack over it. With this method, CartoDB.js handles all the details of loading a map interface, basemap, and your CartoDB visualization.

You can start by giving cartodb.js the DIV ID from your HTML where you want to place your map, and the viz.json URL of your visualization, which you can get from the share window.

```javascript
cartodb.createVis('map', 'http://documentation.carto.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json');
```

That’s it! No need to create the map instance, insert controls, or load layers. CartoDB.js takes care of this for you. If you want to modify the result after instantiating your map with this method, take a look at the CartoDB.js API [available methods](#api-methods). For example, you can also use the returned layer to build more functionality (show/hide, click, hover, custom infowindows):

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

### Adding CartoDB layers to an existing map

In case you already have a map instantiated on your page, you can simply use the [createLayer](#cartodbcreatelayermap-layersource--options--callback) method to add new CartoDB layers to it. This is particullary useful when you have more things on your map apart from CartoDB layers or you have an application where you want to integrate CartoDB layers.

Below, you have an example using a previously instatiated Leaflet map.

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

[Grab the complete example source code](https://github.com/CartoDB/cartodb.js/blob/develop/examples/leaflet.html)

### Creating visualizations at runtime

All CartoDB services are available through the API, which basically means that you can create a new visualization without doing it before through the CartoDB UI. This is particularly useful when you are modifying the visualization depending on user interactions that change the SQL to get the data or CartoCSS to style it. Although this method requires more programming skills, it provides all the flexibility you might need to create more dynamic visualizations.

When you create a visualization using the CartoDB website, you automatically get a viz.json URL that defines it. When you want to create the visualization via JavaScript, you don't always have a viz.json. You will need to pass all the required parameters to the library so that it can create the visualization at runtime and display it on your map. It is pretty simple.

```javascript
// create a layer with 1 sublayer
cartodb.createLayer(map, {
  user_name: 'mycartodbuser',
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

Want further information? [Check out the complete list of API methods](#api-methods).

---

## Usage examples

The best way to start learning about the library is by taking a look at some of the examples below:

+ An easy example using the library - ([view live](http://cartodb.github.com/cartodb.js/examples/easy.html) / [source code](https://github.com/CartoDB/cartodb.js/blob/develop/examples/easy.html)).
+ Leaflet integration - ([view live](http://cartodb.github.com/cartodb.js/examples/leaflet.html) / [source code](https://github.com/CartoDB/cartodb.js/blob/develop/examples/leaflet.html)).
+ Customizing infowindow data - ([view live](http://cartodb.github.com/cartodb.js/examples/custom_infowindow.html) / [source code](https://github.com/CartoDB/cartodb.js/blob/develop/examples/custom_infowindow.html)).
+ An example using a layer selector - ([view live](http://cartodb.github.com/cartodb.js/examples/layer_selector.html) / [source code](https://github.com/CartoDB/cartodb.js/blob/develop/examples/layer_selector.html)).

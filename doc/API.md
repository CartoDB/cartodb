## CartoDB.js

CartoDB offers a simple unified JavaScript library called CartoDB.js that lets you interact with the CartoDB service. This library allows you to connect to your stored visualizations, create new visualizations, add custom interaction, and access or query your raw data from a web browser; meaning, your applications just got a whole lot more powerful with a lot less code.

When you add CartoDB.js to your websites you get some great new tools to make maps or power your content with data. Let’s take a look.


## Getting started

The simplest way to use a visualization created in CartoDB on an external site is as follows:

<div class="code-title">Create a simple visualization</div>
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
  cartodb.createVis('map', 'http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json');
}
</script>
```

[Grab the complete example source code](https://github.com/CartoDB/cartodb.js/blob/develop/examples/easy.html)


## Using the library

CartoDB.js can be used when you want to embed and use a visualization you have designed using CartoDB's user interface, or to dynamically create visualizations from scratch using your data. If you want to create new maps on your webpage, jump to [Creating a visualization from scratch](#creating-a-visualization-from-scratch). If you already have maps on your webpage and want to add CartoDB visualizations to them, read [Adding CartoDB layers to an existing map](#adding-cartodb-layers-to-an-existing-map).

You can also use the CartoDB API to create visualizations programmatically. This can be useful when the visualizations react to user interactions. To read more about it jump to [Creating visualizations at runtime](#creating-visualizations-at-runtime).

We’ve also made it easier than ever for you to build maps using the mapping library of your choice. Whether you are using Leaflet or something else, our CartoDB.js code remains the same. This makes our API documentation simple and straightforward. It also makes it easy for you to remember and be consistent if you develop or maintain multiple maps online.

To start using CartoDB.js just paste this piece of code within the HEAD tags of your HTML:

<div class="code-title">Linking cartodb.js on your html file</div>
```html
<link rel="stylesheet" href="http://libs.cartocdn.com/cartodb.js/v3/3.15/themes/css/cartodb.css" />
<script src="http://libs.cartocdn.com/cartodb.js/v3/3.15/cartodb.js"></script>
```

### Creating a visualization from scratch

The easiest way to quickly get a CartoDB map onto your webpage. Use this when there is no map in your application and you want to add the visualization to hack over it. With this method, CartoDB.js handles all the details of loading a map interface, basemap, and your CartoDB visualization.

You can start by giving cartodb.js the DIV ID from your HTML where you want to place your map, and the viz.json URL of your visualization, which you can get from the share window.

<div class="code-title">Simplest way to add your map to a webpage ever!</div>
```javascript
cartodb.createVis('map', 'http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json');
```

That’s it! No need to create the map instance, insert controls, or load layers. CartoDB.js takes care of this for you. If you want to modify the result after instantiating your map with this method, take a look at the CartoDB.js API [available methods](#api-methods). For example, you can also use the returned layer to build more functionality (show/hide, click, hover, custom infowindows):

<div class="code-title">Simplest way to add your map to a webpage ever!</div>
```javascript
cartodb.createVis('map', 'http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json')
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

<div class="code-title">Adding cartodb layers to an existing map</div>
```html
<div id="map_canvas"></div>

<script>
  var map = new L.Map('map_canvas', {
    center: [0,0],
    zoom: 2
  });

  cartodb.createLayer(map, 'http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json')
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

<div class="code-title">Creating visualizations at runtime</div>
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


## Usage examples

The best way to start learning about the library is by taking a look at some of the examples below:

+ An easy example using the library - ([view live](http://cartodb.github.com/cartodb.js/examples/easy.html) / [source code](https://github.com/CartoDB/cartodb.js/blob/develop/examples/easy.html)).
+ Leaflet integration - ([view live](http://cartodb.github.com/cartodb.js/examples/leaflet.html) / [source code](https://github.com/CartoDB/cartodb.js/blob/develop/examples/leaflet.html)).
+ Customizing infowindow data - ([view live](http://cartodb.github.com/cartodb.js/examples/custom_infowindow.html) / [source code](https://github.com/CartoDB/cartodb.js/blob/develop/examples/custom_infowindow.html)).
+ An example using a layer selector - ([view live](http://cartodb.github.com/cartodb.js/examples/layer_selector.html) / [source code](https://github.com/CartoDB/cartodb.js/blob/develop/examples/layer_selector.html)).
+ The Hobbit map done with the library - ([view live](http://cartodb.github.com/cartodb.js/examples/TheHobbitLocations/) / [source code](https://github.com/CartoDB/cartodb.js/tree/develop/examples/TheHobbitLocations)).


## API methods

The documentation below refers to CartoDB.js v3. For major changes in the library we will update the documentation here. This documentation is meant to help developers find specific methods from the CartoDB.js library.

### Visualization

#### cartodb.createVis(_map_id, vizjson_url[, options] [, callback]_)

Creates a visualization inside the map_id DOM object.

<div class="code-title">cartodb.createVis</div>
```javascript
var url = 'http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json';

cartodb.createVis('map', url)
  .done(function(vis, layers) {
  });
```

##### Arguments

- **map_id**: a DOM object, for example `$('#map')` or a DOM id.
- **vizjson_url**: url of the vizjson object.
- **options**:
  - **shareable**: add facebook and twitter share buttons.
  - **title**: adds a header with the title of the visualization.
  - **description**: adds description to the header (as you set in the UI).
  - **search**: adds a search control (default: true).
  - **zoomControl**: adds zoom control (default: true).
  - **loaderControl**: adds loading control (default: true).
  - **center_lat**: latitude where the map is initializated.
  - **center_lon**: longitude where the map is initializated.
  - **zoom**: initial zoom.
  - **cartodb_logo**: default to true, set to false if you want to remove the cartodb logo.
  - **infowindow**: set to false if you want to disable the infowindow (enabled by default).
  - **time_slider**: show time slider with torque layers (enabled by default)
  - **layer_selector**: show layer selector (default: false)
  - **legends**: if it's true legends are shown in the map.
  - **https**: if true, it makes sure that basemaps are converted to https when possible. If explicitly false, converts https maps to http when possible. If undefined, the basemap template is left as declared at `urlTemplate` in the viz.json.
  - **scrollwheel**: enable/disable the ability of zooming using scrollwheel (default enabled)
  - **fullscreen**: if true adds a button to toggle the map fullscreen
  - **mobile_layout**: if true enables a custom layout for mobile devices (default: false)
  - **force_mobile**: forces enabling/disabling the mobile layout (it has priority over mobile_layout argument)
  - **gmaps_base_type**: Use Google Maps as map provider whatever is the one specified in the viz.json". Available types: 'roadmap', 'gray_roadmap', 'dark_roadmap', 'hybrid', 'satellite', 'terrain'.
  - **gmaps_style**: Google Maps styled maps. See [documentation](https://developers.google.com/maps/documentation/javascript/styling).
  - **no_cdn**: true to disable CDN when fetching tiles
- **callback(vis,layers)**: if a function is specified, it is called once the visualization is created, passing vis and layers as arguments

##### Returns

A promise object. You can listen for the following events:

+ **done**: triggered when the visualization is created, `vis` is passed as the first argument and `layers` is passed as the second argument. Each layer type has different options, see layers section.
+ **error**: triggered when the layer couldn't be created. The error string is the first argument.

### cartodb.Vis

#### vis.getLayers()

Returns an array of layers in the map. The first is the base layer.

#### vis.addOverlay(_options_)

Adds an overlay to the map that can be either a zoom control, a tooltip or an infobox.

##### Arguments

- **options**  
  - **layer** layer from the visualization where the overlay should be applied (optional)
  - **type** zoom / tooltip / infobox

If no layer is provided, the overlay will be added to the first layer of the visualization. Extra options are available based on the specific UI component.

##### Returns

An overlay object, see [vis.Overlays](#visoverlays).

#### vis.getOverlay(_type_)

Returns the first overlay with the specified **type**.

<div class="code-title">vis.getOverlay</div>
```javascript
var zoom = vis.getOverlay('zoom');
zoom.clean() // remove it from the screen
```

#### vis.getOverlays()

Returns a list of the overlays that are currently on the screen (see overlays description).

#### vis.getNativeMap()

Returns the native map object being used (e.g. a L.Map object for Leaflet).

#### vis.Overlays

An overlay is a control shown on top of the map.

Overlay objects are always created using the **addOverlay** method of a cartodb.Vis object.

An overlay is internally a [**Backbone.View**](http://backbonejs.org/#View) so if you know how Backbone works you can use it. If you want to use plain DOM objects you can access **overlay.el** (**overlay.$el** for jQuery object).

#### vis.addInfowindow(_map, layer, fields [, options]_)

Adds an infowindow to the map controlled by layer events. It enables interaction and overrides the layer interactivity.

##### Arguments

  - **map**: native map object or leaflet
  - **layer**: cartodb layer (or sublayer)
  - **fields**: array of column names

##### Returns

An infowindow object, see [sublayer.infowindow](#sublayerinfowindow)

#### cartodb.createLayer(_map, layerSource [, options] [, callback]_)

With visualizations already created through the CartoDB console, you can simply use the **createLayer** function to add them into your web pages. Unlike **createVis**, this method requires an already activated **map** object and it does not load a basemap for you.

##### Arguments

- **map**: Leaflet L.Map object. The map should be initialized before calling this function.

- **layerSource**: contains information about the layer. It can be specified in 2 ways:

<div class="code-title">Passing the url where the layer data is located</div>
```javascript
cartodb.createLayer(map, 'http://myserver.com/layerdata.json')
```

<div class="code-title">passing the data directly</div>
```javascript
cartodb.createLayer(map, { layermetadata })
```

- **options**:
  - **https**: force https
  - **refreshTime**: if is set, the layer is refreshed each refreshTime milliseconds.
  - **infowindow**: set to false if you want to disable the infowindow (enabled by default).
  - **tooltip**: set to false if you want to disable the tooltip (enabled by default).
  - **legends**: if it's true legends are shown in the map.
  - **time_slider**: show time slider with torque layers (enabled by default)
  - **layerIndex**: when the visualization contains more than one layer this index allows you to select
    what layer is created. Take into account that `layerIndex == 0` is the base layer and that
    all the tiled layers (non animated ones) are merged into a single one. The default value for
    this option is 1 (usually tiled layers).
  - **filter**: a string or array of strings to specify the type(s) of sublayers that will be rendered (eg: `['http', 'mapnik']`). All non-torque layers (http and mapnik) will be rendered if this option is not present.

- **callback(_layer_)**: if a function is specified, it will be invoked after the layer has been created. The layer will be passed as an argument.

##### Returns

A promise object. You can listen for the following events:

+ **done**: triggered when the layer is created, the layer is passed as first argument. Each layer type has different options, see layers section.
+ **error**: triggered when the layer couldn't be created. The error string is the first argument.

You can call to `addTo(map[, position])` in the promise so when the layer is ready it will be added to the map.

##### Example

<div class="code-title">cartodb.createLayer using a url</div>

```javascript
var map;
var mapOptions = {
  zoom: 5,
  center: [43, 0]
};
map = new L.Map('map', mapOptions);

cartodb.createLayer(map, 'http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json')
  .addTo(map)
  .on('done', function(layer) {
    layer
      .on('featureOver', function(e, latlng, pos, data) {
        console.log(e, latlng, pos, data);
      })
      .on('error', function(err) {
        console.log('error: ' + err);
      });
  }).on('error', function(err) {
    console.log("some error occurred: " + err);
  });
```

Layer metadata must take one of the following forms:

#### Standard Layer Source Object (`type: 'cartodb'`)

Used for most maps with tables that are set to public or public with link.

```javascript
{
  user_name: 'your_user_name', // Required
  type: 'cartodb', // Required
  sublayers: [{
      sql: "SELECT * FROM table_name", // Required
      cartocss: '#table_name {marker-fill: #F0F0F0;}', // Required
      interactivity: "column1, column2, ...", // Optional
  },
  {
      sql: "SELECT * FROM table_name", // Required
      cartocss: '#table_name {marker-fill: #F0F0F0;}', // Required
      interactivity: "column1, column2, ...", // Optional
   },
   ...
  ]
}
```

#### Torque Layer Source Object (`type: 'torque'`)

Used for [Torque maps](https://github.com/CartoDB/torque). Note that it does not allow sublayers.

```javascript
{
  type: 'torque', // Required
  order: 1, // Optional
  options: {
    query: "SQL statement", 	// Required if table_name is not given
    table_name: "table_name", 	// Required if query is not given
    user_name: "your_user_name", // Required
    cartocss: "CartoCSS styles" // Required
  }
}
```

#### Named Maps Layer Source Object (`type: 'namedmap'`)

Used for making public maps with private data. See [Named Maps](http://docs.cartodb.com/cartodb-platform/maps-api.html#named-maps-1) for more information.


```javascript
{
  user_name: 'your_user_name', // Required
  type: 'namedmap', // Required
  named_map: {
      name: 'name_of_map', // Required
      // Optional
      layers: [{
            layer_name: "sublayer0", // Optional
            interactivity: "column1, column2, ..." // Optional
        },
        {
            layer_name: "sublayer1",
            interactivity: "column1, column2, ..."
        },
        ...
    ],
    // Optional
    params: {
        color: "hex_value",
        num: 2
    }
  }
}
```

##### Example

<div class="code-title">cartodb.createLayer combining multiple types of layers and setting a filter</div>

```javascript
cartodb.createLayer(map, {
  user_name: 'examples',
  type: 'cartodb',
  sublayers: [
    {
      type: "http",
      urlTemplate: "http://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png",
      subdomains: [ "a", "b", "c" ]
    },
    {
       sql: 'select * from country_boundaries',
       cartocss: '#layer { polygon-fill: #F00; polygon-opacity: 0.3; line-color: #F00; }'
    },
  ],
}, { filter: ['http', 'mapnik'] })
```

### cartodb.CartoDBLayer

CartoDBLayer allows you to manage tiled layers from CartoDB. It manages the sublayers.

#### layer.clear()

Clears the layer. It should be invoked after removing the layer from the map.

#### layer.hide()

Hides the layer from the map.

#### layer.show()

Shows the layer in the map if it was previously added.

#### layer.toggle()

Toggles the visibility of the layer and returns a boolean that indicates the new status (true if the layer is shown, false if it is hidden)

#### layer.setOpacity(_opacity_)

Changes the opacity of the layer.

##### Arguments

+ **opacity**: value in range [0, 1]

#### layer.getSubLayer(_layerIndex_)

Gets a previously created sublayer. And exception is raised if no sublayer exists.

##### Arguments

+ **layerIndex**: 0 based index of the sublayer to get. Should be within [0, getSubLayerCount())

##### Returns

A SubLayer object.

##### Example

<div class="code-title">layer.getSubLayer</div>
```javascript
layer.getSubLayer(1).hide();

var sublayer = layer.getSubLayer(0);

sublayer.setSQL('SELECT * FROM table_name limit 10');
```

#### layer.getSubLayerCount()

Gets the number of sublayers in layer.

##### Returns

The number of sublayers.

##### Example

<div class="code-title">Hide layers using layer.getSubLayerCount</div>
```javascript
var num_sublayers = layer.getSubLayerCount();

for (var i = 0; i < num_sublayers; i++) {
  layer.getSubLayer(i).hide();
}
```

#### layer.createSubLayer(_layerDefinition_)

Adds a new data to the current layer. With this method, data from multiple tables can be easily visualized. New in V3.

##### Arguments

- **layerDefinition**: an object with the sql and cartocss that defines the data, should be like:

<div class="code-title">layerDefinition</div>
```javascript
{
  sql: "SELECT * FROM table_name",
  cartocss: "#layer { marker-fill: red; }",
  interactivity: 'cartodb_id, area, column' // optional
}
```

`sql` and `cartocss` are mandatory. An exception is raised if either of them are not present. If the interactivity is not set, there is no interactivity enabled for that layer (better performance). SQL and CartoCSS syntax should be correct. Look at the documentation for  [PostgreSQL](http://www.postgresql.org/docs/9.3/interactive/sql-syntax.html) and [CartoCSS](https://github.com/mapbox/carto/blob/master/docs/latest.md) for more information. There are some restrictions in the SQL queries:

- Must not write. INSERT, DELETE, UPDATE, ALTER and so on are not allowed (the query will fail)
- Must not contain trialing semicolon

##### Returns

A SubLayer object.

##### Example

<div class="code-title">layer.createSubLayer</div>
```javascript
cartodb.createLayer(map, 'http://examples.cartodb.com/api/v2/viz/european_countries_e/viz.json', function(layer) {
  // add populated places points over the countries layer
  layer.createSubLayer({
    sql: 'SELECT * FROM ne_10m_populated_places_simple',
    cartocss: '#layer { marker-fill: red; }'
  });
}).addTo(map);
```

#### layer.invalidate()

Refreshes the data. If the data has been changed in the CartoDB server those changes will be displayed. Nothing happens otherwise. Every time a parameter is changed in a sublayer, the layer is refreshed automatically, so there's no need to call this method manually. New in V3.

#### layer.setAuthToken(_auth_token_)

Sets the auth token that will be used to create the layer. Only available for private visualizations. An exception is
raised if the layer is not being loaded with HTTPS. See [Named Maps](http://docs.cartodb.com/cartodb-platform/maps-api.html#named-maps-1) for more information.

##### Returns

The layer itself.

##### Arguments

- **auth_token:** string

#### layer.setParams(_key, value_)

Sets the configuration of a layer when using [named maps](http://docs.cartodb.com/cartodb-platform/maps-api.html#named-maps-1). It can be invoked in different ways:

<div class="code-title">layer.setParams</div>
```javascript
layer.setParams('test', 10); // sets test = 10
layer.setParams('test', null); // unset test
layer.setParams({'test': 1, 'color': '#F00'}); // set more than one parameter at once
```

##### Arguments

- **key:** string
- **value:** string or number

##### Returns

The layer itself.

### cartodb.CartoDBLayer.SubLayer

#### sublayer.set(_layerDefinition_)

Sets sublayer parameters. Useful when more than one parameter needs to be changed.

##### Arguments

- **layerDefinition**: an object with the sql and cartocss that defines the data, like:

<div class="code-title">layerDefinition</div>
```javascript
{
  sql: "SELECT * FROM table_name",
  cartocss: "#layer { marker-fill: red; }",
  interactivity: 'cartodb_id, area, column' // optional
}
```

##### Returns

The layer itself.

##### Example

<div class="code-title">sublayer.set</div>
```javascript
sublayer.set({
  sql: "SELECT * FROM table_name WHERE cartodb_id < 100",
  cartocss: "#layer { marker-fill: red }",
  interactivity: "cartodb_id, the_geom, magnitude"
});
```

#### sublayer.get(_attr_)

Gets the attribute for the sublayer, for example 'sql', 'cartocss'.

##### Returns

The requested attribute or undefined if it's not present.

#### sublayer.remove()

Removes the sublayer. An exception will be thrown if a method is called and the layer has been removed.

#### sublayer.show()

Shows a previously hidden sublayer. The layer is refreshed after calling this function.

#### sublayer.hide()

Removes the sublayer from the layer temporarily. The layer is refreshed after calling this function.

#### sublayer.toggle()

Toggles the visibility of the sublayer and returns a boolean that indicates the new status (true if the sublayer is visible, false if it is hidden)

#### sublayer.isVisible()

It returns `true`  if the sublayer is visible.

### cartodb.CartoDBLayer.CartoDBSubLayer

#### sublayer.getSQL()

Shortcut for `get('sql')`

#### sublayer.getCartoCSS()

Shortcut for `get('cartocss')`

#### sublayer.setSQL(sql)

Shortcut for `set({'sql': 'SELECT * FROM table_name'})`

#### sublayer.setCartoCSS(css)

Shortcut for `set({'cartocss': '#layer {...}' })`

#### sublayer.setInteractivity('cartodb_id, name, ...')

Shortcut for `set({'interactivity': 'cartodb_id, name, ...' })`

Sets the columns which data will be available via the interaction with the sublayer.

#### sublayer.setInteraction(_true_)

Enables (true) or disables (false) the interaction of the layer. When disabled, **featureOver**, **featureClick**, **featureOut**, **mouseover** and **mouseout** are **not** triggered.

##### Arguments

+ **enable**: true if the interaction needs to be enabled.

#### sublayer.infowindow

**sublayer.infowindow** is a Backbone model where we modify the parameters of the infowindow.

##### Attributes

- **template**: Custom HTML template for the infowindow. You can write simple HTML or use [Mustache templates](http://mustache.github.com/).
- **sanitizeTemplate**: By default all templates are sanitized from unsafe tags/attrs (e.g. `<script>`), set this to `false`
to skip sanitization, or a function to provide your own sanitization (e.g. `function(inputHtml) { return inputHtml })`).
- **width**: Width of the infowindow (value must be a number).
- **maxHeight**: Max height of the scrolled content (value must be a number).

<div class="code-title">sublayer.infowindow.set</div>
```html
<div id="map"></div>

<script>
  sublayer.infowindow.set({
    template: $('#infowindow_template').html(),
    width: 218,
    maxHeight: 100
  });
</script>

<script type="infowindow/html" id="infowindow_template">
  <span> custom </span>
  <div class="cartodb-popup">
    <a href="#close" class="cartodb-popup-close-button close">x</a>

     <div class="cartodb-popup-content-wrapper">
       <div class="cartodb-popup-content">
         <img style="width: 100%" src="http://rambo.webcindario.com/images/18447755.jpg"></src>
         <!-- content.data contains the field info -->
         <h4>{{content.data.name}}</h4>
       </div>
     </div>
     <div class="cartodb-popup-tip-container"></div>
  </div>
</script>
```

[Grab the complete example source code](https://github.com/CartoDB/cartodb.js/blob/develop/examples/custom_infowindow.html)

### cartodb.CartoDBLayer.HttpSubLayer

#### sublayer.setURLTemplate(urlTemplate)

Shortcut for `set({'urlTemplate': 'http://{s}.example.com/{z}/{x}/{y}.png' })`

#### sublayer.setSubdomains(subdomains)

Shortcut for `set({'subdomains': ['a', 'b', '...'] })`

#### sublayer.setTms(tms)

Shortcut for `set({'tms': true|false })`

#### sublayer.getURLTemplate

Shortcut for `get('urlTemplate')`

#### sublayer.getSubdomains

Shortcut for `get('subdomains')`

#### sublayer.getTms

Shortcut for `get('tms')`

#### sublayer.legend

**sublayer.legend** is a Backbone model with the information about the legend.

##### Attributes

- **template**: Custom HTML template for the legend. You can write simple HTML.
- **title**: Title of the legend.
- **show_title**: Set this to `false` if you don't want the title to be displayed.
- **items**: An array with the items that are displayed in the legend.
- **visible**: Set this to `false` if you want to hide the legend.

## Events

You can bind custom functions to layer events. This is useful for integrating your website with your maps, adding events for mouseovers and click events.

### layer

#### layer.featureOver(_event, latlng, pos, data, layerIndex_)

Triggered when the user hovers on any feature.

##### Callback arguments

- **event**: Browser mouse event object.
- **latlng**: Array with the LatLng ([lat,lng]) where the layer was clicked.
- **pos**: Object with x and y position in the DOM map element.
- **data**: The CartoDB data of the clicked feature with the **interactivity** param.
- **layerIndex**: the layerIndex where the event happened.

##### Example

<div class="code-title">layer.on</div>
```javascript
layer.on('featureOver', function(e, latlng, pos, data, subLayerIndex) {
  console.log("mouse over polygon with data: " + data);
});
```

#### layer.featureOut(_layerIndex_)

Triggered when the user hovers out any feature.

#### layer.featureClick(_event, latlng, pos, data, layerIndex_)

Triggered when when the user clicks on a feature of a layer.

##### callback arguments

Same as `featureOver`.

#### layer.mouseover()

Triggered when the mouse enters in **any** feature. Useful to change the cursor while hovering.

#### layer.mouseout()

Triggered when the mouse leaves all the features. Useful to revert the cursor after hovering.

##### Example

<div class="code-title">sublayer.on</div>
```javascript
layer.on('mouseover', function() {
  cursor.set('hand')
});

layer.on('mouseout', function() {
  cursor.set('auto')
});
```

#### layer.loading()

Triggered when the layer or any of its sublayers are about to be loaded. This is also triggered when any properties are changed but not yet visible.

##### Example

<div class="code-title">layer.on</div>
```javascript
layer.on("loading", function() {
  console.log("layer about to load");
});
layer.getSubLayer(0).set({
  cartocss: "#export { polygon-opacity: 0; }"
});
```

#### layer.load()

Triggered when the layer or its sublayers have been loaded. This is also triggered when any properties are changed and visible.

##### Example

<div class="code-title">layer.on</div>
```javascript
layer.on("load", function() {
  console.log("layer loaded");
});
layer.getSubLayer(0).set({
  cartocss: "#export { polygon-opacity: 0; }"
});
```

### subLayer

#### sublayer.featureOver(_event, latlng, pos, data, layerIndex_)

Same as `layer.featureOver()` but sublayer specific.

##### callback arguments

Same as `layer.featureOver()`.

#### sublayer.featureClick(_event, latlng, pos, data, layerIndex_)

Same as `layer.featureClick()` but sublayer specific.

##### callback arguments

Same as `layer.featureClick()`.

#### sublayer.mouseover()

Same as `layer.mouseover()` but sublayer specific.

#### sublayer.mouseout()

Same as `layer.mouseover()` but sublayer specific.


## Specific UI functions

There are a few functions in CartoDB.js for creating, enabling, and disabling pieces of the user interface.

### cartodb.geo.ui.Tooltip

Shows a small tooltip on hover:

<div class="code-title">cartodb.geo.ui.Tooltip</div>
```javascript
var tooltip = vis.addOverlay({
  type: 'tooltip',
  template: '<p>{{variable}}</p>' // mustache template
});
```

#### cartodb.geo.ui.Tooltip.enable()

The tooltip is shown when hover on feature when is called.

#### cartodb.geo.ui.Tooltip.disable()

The tooltip is not shown when hover on feature.

### cartodb.geo.ui.InfoBox

Shows a small box when the user hovers on a map feature. The position is fixed:

<div class="code-title">cartodb.geo.ui.InfoBox</div>
```javascript
var box = vis.addOverlay({
  type: 'infobox',
  template: '<p>{{name_to_display}}</p>',
  width: 200, // width of the box
  position: 'bottom|right' // top, bottom, left and right are available
});
```

#### cartodb.geo.ui.InfoBox.enable()

The tooltip is shown when hover on feature.

#### cartodb.geo.ui.InfoBox.disable()

The tooltip is not shown when hover on feature.

### cartodb.geo.ui.Zoom

Shows the zoom control:

<div class="code-title">cartodb.geo.ui.Zoom</div>
```javascript
vis.addOverlay({ type: 'zoom' });
```

#### cartodb.geo.ui.Zoom.show()

#### cartodb.geo.ui.Zoom.hide()


## Getting data with SQL

CartoDB offers a powerful SQL API for you to query and retreive data from your CartoDB tables. CartoDB.js offers a simple to use wrapper for sending those requests and using the results.

### cartodb.SQL

**cartodb.SQL** is the tool you will use to access data you store in your CartoDB tables. This is a really powerful technique for returning things like: **items closest to a point**, **items ordered by date**, or **GeoJSON vector geometries**. It’s all powered with SQL and our tutorials will show you how easy it is to begin with SQL.

<div class="code-title">cartodb.SQL</div>
```javascript
var sql = new cartodb.SQL({ user: 'cartodb_user' });
sql.execute("SELECT * FROM table_name WHERE id > {{id}}", { id: 3 })
  .done(function(data) {
    console.log(data.rows);
  })
  .error(function(errors) {
    // errors contains a list of errors
    console.log("errors:" + errors);
  })
```

It accepts the following options:

+ **format**: should be geoJSON.
+ **dp**: float precision.
+ **jsonp**: if jsonp should be used instead of CORS. This param is enabled if the browser does not support CORS.

These arguments will be applied to all the queries performed by this object. If you want to override them for one query see **execute** options.

#### sql.execute(_sql [,vars][, options][, callback]_)

It executes a sql query.

##### Arguments

+ **sql**: a string with the sql query to be executed. You can specify template variables like {{variable}} which will be filled with **vars** object.
+ **vars**: a map with the variables to be interpolated in the sql query.
+ **options**: accepts **format**, **dp** and **jsonp**. This object also overrides the params passed to $.ajax.

##### Returns

A promise object. You can listen for the following events:

+ **done**: triggered when the data arrives.
+ **error**: triggered when something failed.

You can also use done and error methods:

<div class="code-title">sql.execute</div>
```javascript
sql.execute('SELECT * FROM table_name')
  .done(fn)
  .error(fnError)
```

#### sql.getBounds(_sql [,vars][, options][, callback]_)

Returns the bounds [ [sw_lat, sw_lon], [ne_lat, ne_lon ] ] for the geometry resulting of specified query.

<div class="code-title">sql.getBounds</div>
```javascript
sql.getBounds('select * from table').done(function(bounds) {
    console.log(bounds);
});
```

##### Arguments

+ **sql**: a string with the sql query to calculate the bounds from.

##### Application of getBounds in Leaflet

You can use the results from `getBounds` to center data on your maps using Leaflet.

- **getBounds and Leaflet**

<div class="code-title">sql.getBounds</div>
```javascript
sql.getBounds('select * from table').done(function(bounds) {
  map.setBounds(bounds);
  // or map.fitBounds(bounds, mapView.getSize());
});
```

## Static Maps

Static views of CartoDB maps can be generated using the [Static Maps API](http://docs.cartodb.com/cartodb-platform/maps-api.html#static-maps-api) within CartoDB.js. The map's style, including the zoom and bounding box, follows from what was set in the viz.json file, but you can change the zoom, center, and size of your image with a few lines of code. You can also change your basemap Images can be placed in specified DOM elements on your page, or you can generate a URL for the image.

### Quick Start

The easiest way to generate an image is by using the following piece of code, which generates is replaced by an `img` tag once run in an HTML file:

```javascript
<script>
var vizjson_url = 'https://documentation.cartodb.com/api/v2/viz/008b3ec6-02c3-11e4-b687-0edbca4b5057/viz.json';

cartodb.Image(vizjson_url)
  .size(600, 400)
  .center([-3.4, 44.2])
  .zoom(4)
  .write({ class: "thumb", id: "AwesomeMap" });
</script>
```

#### Result
```html
<img id="AwesomeMap" src="https://cartocdn-ashbu.global.ssl.fastly.net/documentation/api/v1/map/static/center/04430594691ff84a3fdac56259e5180b:1419270587670/4/-3.4/44.2/600/400.png" class="thumb">
```

#### cartodb.Image(_layerSource_[, options])

##### Arguments

- **layerSource**: can be either a viz.json object or a [layer source object](http://docs.cartodb.com/cartodb-platform/cartodb-js.html#standard-layer-source-object-type-cartodb)

##### Options

Options take the form of a JavaScript object.

- **options**:
    - **basemap**: change the basemap specified in the layer definition. Type: Object defining base map properties (see example below).
    - **no_cdn**: Disable CDN usage. Type: Boolean. Default: `false` (use CDN)
    - **override_bbox**: Override default of using the bounding box of the visualization. This is needed to use `Image.center` and `Image.zoom`. Type: Boolean. Default: `false` (use bounding box)

```javascript
<script>
var vizjson_url = 'https://documentation.cartodb.com/api/v2/viz/008b3ec6-02c3-11e4-b687-0edbca4b5057/viz.json';
var basemap = {
        type: "http",
        options: {
          urlTemplate: "http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
          subdomains: ["a", "b", "c"]
        }
      };

cartodb.Image(vizjson_url, {basemap: basemap})
  .size(600, 400)
  .center([0,0])
  .write({ class: "thumb", id: "AwesomeMap" });
</script>
```

##### Returns
An _Image_ object

### cartodb.Image

#### Image.size(_width_,_height_)

Sets the size of the image.

##### Arguments

- **width**: the width of the resulting image in pixels
- **height**: the height of the resulting image in pixels

##### Returns
An _Image_ object

#### Image.center(_latLng_)

Sets the center of the map.

##### Arguments

- **latLng**: an array of the latitude and longitude of the center of the map. Example: `[40.4378271,-3.6795367]`

##### Returns

An _Image_ object

#### Image.zoom(zoomLevel)

Sets the zoom level of the static map. Must be used with the option `override_bbox: true` if not using `Image.center` or `Image.bbox`.

##### Arguments

- **zoomLevel**: the zoom of the resulting static map. `zoomLevel` must be an integer in the range [0,24].

##### Returns

An _Image_ object

#### Image.bbox(_boundingBox_)

If you set `bbox`, `center` and `zoom` will be overridden.

##### Arguments

- **boundingBox**: an array of coordinates making up the bounding box for your map. `boundingBox` takes the form: `[sw_lat, sw_lon, ne_lat, ne_lon]`.

##### Returns

An _Image_ object

#### Image.into(HTMLImageElement)

Inserts the image into the HTML DOM element specified.

##### Arguments

- **HTMLImageElement**: the DOM element where your image is to be located.

##### Returns

An _Image_ object

<div class="image-into">Image.into</div>
```javascript
cartodb.Image(vizjson_url).into(document.getElementById('map_preview'))
```

#### Image.write(_attributes_)

Adds an `img` tag in the same place script is executed. It's possible to specify a class name (`class`) and/or an id attribute (`id`) for the resulting image:

<div class="image-write">Image.write</div>
```javascript
<script>
cartodb.Image(vizjson_url)
  .size(600, 400)
  .center([-3.4, 44.2])
  .zoom(10)
  .write({ class: "thumb", id: "ImageHeader", src: 'spinner.gif' });
</script>
```

##### Arguments

- **attributes**:
    + **class**: the DOM class applied to the resulting `img` tag
    + **id**: the DOM id applied to the resulting `img` tag
    + **src**: path to a temporary image that acts as a placeholder while the static map is retrieved

##### Returns

An _Image_ object


#### Image.getUrl(_callback(err, url)_)

Gets the URL for the image requested.

<div class="image-geturl">Image.getUrl</div>
```javascript
<script>
cartodb.Image(vizjson_url)
  .size(600, 400)
  .getUrl(function(err, url) {
      console.log('image url',url);
  })
</script>
```

##### Callback Arguments

- **err**: error associated with the image request, if any
- **url**: URL of the generated image

##### Returns

An _Image_ object

#### Image.format(_format_)

Gets the URL for the image requested.

##### Argument

- **format**: image format of resulting image. One of `png` (default) or `jpg` (which have a quality of 85 dpi)

##### Returns

An _Image_ object

## Core API functionality

In case you are not using Leaflet, or you want to implement your own layer object, CartoDB provides a way to get the tiles url for a layer definition.

If you want to use this functionality, you only need to load cartodb.core.js from our cdn. No CSS is needed:

<div class="code-title">Core API functionallity</div>
```html
<script src="http://libs.cartocdn.com/cartodb.js/v3/3.15/cartodb.core.js"></script>
```

An example using this funcionality can be found in a ModestMaps example: [view live](http://cartodb.github.com/cartodb.js/examples/modestmaps.html) / [source code](https://github.com/CartoDB/cartodb.js/blob/develop/examples/modestmaps.html).

Notice that cartodb.SQL is also included in that JavaScript file

### cartodb.Tiles

#### cartodb.Tiles.getTiles(_layerOptions, callback_)

Fetch the tile template for the layer definition.

##### Arguments

+ **layerOptions**: the data that defines the layer. It should contain at least user_name and sublayer list. These are the available options:

<div class="code-title">cartodb.Tiles.getTiles</div>
```javascript
{
  user_name: 'mycartodbuser',
  sublayers: [{
    sql: "SELECT * FROM table_name";
    cartocss: '#layer { marker-fill: #F0F0F0; }'
  }],
  maps_api_template: 'https://{user}.cartodb.com' // Optional
}
```

+ **callback(tilesUrl, error)**: a function that recieves the tiles templates. In case of an error, the first param is null and the second one will be an object with an errors attribute that contains the list of errors. The tilesUrl object contains url template for tiles and interactivity grids:

<div class="code-title">cartodb.Tiles.getTiles</div>
```javascript
{
  tiles: [
    "http://{s}.cartodb.com/HASH/{z}/{x}/{y}.png",
    ...
  ],
  grids: [
    // for each sublayer there is one entry on this array
    [
      "http://{s}.cartodb.com/HASH/0/{z}/{x}/{y}.grid.json"
    ],
    [
      "http://{s}.cartodb.com/HASH/1/{z}/{x}/{y}.grid.json"
    ],
    ...
  ]
}
```

##### Example

In this example, a layer with one sublayer is created. The sublayer renders all the content from a table.

<div class="code-title">cartodb.Tiles.getTiles</div>
```javascript
var layerData = {
  user_name: 'mycartodbuser',
  sublayers: [{
    sql: "SELECT * FROM table_name";
    cartocss: '#layer { marker-fill: #F0F0F0; }'
  }]
};
cartodb.Tiles.getTiles(layerData, function(tiles, err) {
  if(tiler == null) {
    console.log("error: ", err.errors.join('\n'));
    return;
  }
  console.log("url template is ", tiles.tiles[0]);
}
```


## Versions

Keep in mind the version of CartoDB.js you are using for development. For any live code, we recommend you to link directly to the tested CartoDB.js version from your development environment. You can check the version of CartoDB.js as follows:

### cartodb.VERSION

Returns the version of the library. It should be something like `3.0.1`.


## Other important stuff

CartoDB.js has many great features for you to use in your applications. Let’s take a look at some of the most important ones:

### Viz JSON support

The Viz.JSON document tells CartoDB.js all the information about your map, including the style you want to use for your data and the filters you want to apply with SQL. The Viz JSON file is served with each map you create in your CartoDB account.

Although the Viz JSON file stores all your map settings, all these settings can be easily customized with CartoDB.js. For example, if you want to do something completely different than what you initially designed it for. Loading the Viz JSON is as simple as:

<div class="code-title">Viz JSON support</div>
```javascript
cartodb.createVis('map', 'http://examples.cartodb.com/api/v2/viz/ne_10m_populated_p_1/viz.json')
```

### How to set a different host than cartodb.com
CartoDB.js sends all requests to the cartodb.com domain by default. If you are running your own
instance of CartoDB you can change the URLs to specify a different host.

A different host can be configured by using ``sql_api_template`` and ``maps_api_template`` in the ``options`` parameter
for any ``cartodb`` function call.

The format of these templates is as follows:

```javascript
sql_api_template: 'https://{user}.test.com'
```

CartoDB.js will replace ``{user}``.

Notice that you don't need to set the path to the endpoint, CartoDB.js will set it automatically.

### Bounds wrapper

We have added an easy method to get the bounding box for any dataset or filtered query using the CartoDB.js library. The **getBounds** function can be useful for guiding users to the right location on a map or for loading only the right data at the right time based on user actions.

<div class="code-title">Bounds wrapper</div>
```javascript
var sql = new cartodb.SQL({ user: 'cartodb_user' });

sql.getBounds('SELECT * FROM table_name').done(function(bounds) {
  console.log(bounds);
});
```

### Event listener support

CartoDB.js is highly asynchronous. Your application can get on with what it needs to do while the library efficiently does what you request in the background. This is useful for loading maps or getting query results. At the same time, we have made it very simple to add listeners and callbacks to the async portions of the library.

#### Loading events

The **createLayer** and **createVis** functions trigger two important events for you to take advantage of. The first one is **done**, which will let your code know that the library has successfully read the information from the Viz JSON and loaded the layer you requested. The second is **error**, which lets you know that something did not go as expected when trying to load the requested layer:

<div class="code-title">Loading events</div>
```javascript
cartodb.createLayer(map, 'http://examples.cartodb.com/api/v1/viz/0001/viz.json')
  .addTo(map)
  .on('done', function(layer) {
    alert(‘CartoDB layer loaded!’);
  }).on('error', function(err) {
    alert("some error occurred: " + err);
  });
```

#### Active layer events

The next important set of events for you to use happen on those layers that are already loaded (returned by the **done** event above). Three events are triggered by layers on your webpage, each requires the layer to include an **interactivity** layer. The first event is **featureClick**, which lets you set up events after the user clicks anything that you have mapped.

<div class="code-title">featureClick</div>
```javascript
layer.on('featureClick', function(e, latlng, pos, data, layer) {
  console.log("mouse clicked polygon with data: " + data);
});
```

The second event is the **featureOver** event, which lets you listen for mouse hovers on any feature. Be careful, as these functions can get costly if you have a lot of features on a map.

<div class="code-title">featureOver</div>
```javascript
layer.on('featureOver', function(e, latlng, pos, data, layer) {
  console.log("mouse over polygon with data: " + data);
});
```

Finally, there is the **featureOut** event. This is best used if you do things like highlighting polygons on mouseover and need a way to know when to remove the highlighting after the mouse has left.

<div class="code-title">featureOut</div>
```javascript
layer.on('featureOut', function(e, latlng, pos, data, layer) {
  console.log("mouse left polygon with data: " + data);
});
```

#### Leaflet integration

If you want to use [Leaflet](http://leafletjs.com) it gets even easier. CartoDB.js handles loading all the necessary libraries for you! Just include CartoDB.js and CartoDB.css in the HEAD of your website and you are ready to go! The CartoDB.css document isn’t mandatory. However, if you are making a map and are not familiar with writing your own CSS for the various needed elements, it can help you jumpstart the process. Using Leaflet is as simple as adding the main JavaScript library:

<div class="code-title">Leaflet integration</div>
```html
<link rel="stylesheet" href="http://libs.cartocdn.com/cartodb.js/v3/3.15/themes/css/cartodb.css" />
<script src="http://libs.cartocdn.com/cartodb.js/v3/3.15/cartodb.js"></script>
```

#### HTTPS support

You can use all the functionality of CartoDB.js with HTTPs support. Be sure to use https when importing both the JS library and the CSS file. You will also need to use HTTPs in the Viz.JSON URL you pass to **createVis**.

<div class="code-title">HTTPS support</div>
```html
<div id="map"></div>

<link rel="stylesheet" href="https://cartodb-libs.global.ssl.fastly.net/cartodb.js/v3/3.15/themes/css/cartodb.css" />
<script src="https://cartodb-libs.global.ssl.fastly.net/cartodb.js/v3/3.15/cartodb.js"></script>

<script>
  var map = new L.Map('map', {
    center: [0,0],
    zoom: 2
  })
  cartodb.createLayer(map, 'https://examples.cartodb.com/api/v1/viz/15589/viz.json', { https: true })
    .addTo(map)
    .on('error', function(err) {
      alert("some error occurred: " + err);
    });
</script>
```

#### Persistent version hosting

We are committed to making sure your website works as intended no matter what changes in the future. We may find more efficient or more useful features to add to the library as time progresses. But we never want to break things you have already developed. For this reason, we make versioned CartoDB.js libraries available to you. The way they function will never unexpectedly change on you.

We recommend that you always develop against the most recent version of CartoDB.js:

```html
<script src="http://libs.cartocdn.com/cartodb.js/v3/3.15/cartodb.js"></script>
```

Anytime you wish to push a stable version of your site to the web though, you can find the version of CartoDB.js you are using by looking at the first line of the library or running the following in your code:

```javascript
alert(cartodb.VERSION)
```

Once you know which version of CartoDB.js you're using, you can point your site to that release. If the current version of CartoDB.js is 3.15.6, the URL would be:

```html
<script src="http://libs.cartocdn.com/cartodb.js/v3/3.15.6/cartodb.js"></script>
```

You can do the same for the CSS documents we provide:

```html
<link rel="stylesheet" href="http://libs.cartocdn.com/cartodb.js/v3/3.12.3/themes/css/cartodb.css" />
```

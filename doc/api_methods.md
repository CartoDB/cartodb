# API methods

The documentation below refers to CartoDB.js v3. For major changes in the library we will update the documentation here. This documentation is meant to help developers find specific methods from the CartoDB.js library.

## Visualization

### cartodb.createVis(_map_id, vizjson_url[, options] [, callback]_)

Creates a visualization inside the map_id DOM object.

<div class="code-title">cartodb.createVis</div>
{% highlight javascript %}
var url = 'http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json';

cartodb.createVis('map', url)
  .done(function(vis, layers) {
  });
{% endhighlight %}

#### Arguments

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

#### Returns

A promise object. You can listen for the following events:

+ **done**: triggered when the visualization is created, `vis` is passed as the first argument and `layers` is passed as the second argument. Each layer type has different options, see layers section.
+ **error**: triggered when the layer couldn't be created. The error string is the first argument.

## cartodb.Vis

### vis.getLayers()

Returns an array of layers in the map. The first is the base layer.

### vis.addOverlay(_options_)

Adds an overlay to the map that can be either a zoom control, a tooltip or an infobox.

#### Arguments

- **options**  
  - **layer** layer from the visualization where the overlay should be applied (optional)
  - **type** zoom / tooltip / infobox

If no layer is provided, the overlay will be added to the first layer of the visualization. Extra options are available based on the specific UI component.

#### Returns

An overlay object, see [vis.Overlays](#visoverlays).

### vis.getOverlay(_type_)

Returns the first overlay with the specified **type**.

<div class="code-title">vis.getOverlay</div>
{% highlight javascript %}
var zoom = vis.getOverlay('zoom');
zoom.clean() // remove it from the screen
{% endhighlight %}

### vis.getOverlays()

Returns a list of the overlays that are currently on the screen (see overlays description).

### vis.getNativeMap()

Returns the native map object being used (e.g. a L.Map object for Leaflet).

### vis.Overlays

An overlay is a control shown on top of the map.

Overlay objects are always created using the **addOverlay** method of a cartodb.Vis object.

An overlay is internally a [**Backbone.View**](http://backbonejs.org/#View) so if you know how Backbone works you can use it. If you want to use plain DOM objects you can access **overlay.el** (**overlay.$el** for jQuery object).

### vis.addInfowindow(_map, layer, fields [, options]_)

Adds an infowindow to the map controlled by layer events. It enables interaction and overrides the layer interactivity.

#### Arguments

  - **map**: native map object or leaflet
  - **layer**: cartodb layer (or sublayer)
  - **fields**: array of column names

#### Returns

An infowindow object, see [sublayer.infowindow](#sublayerinfowindow)

### cartodb.createLayer(_map, layerSource [, options] [, callback]_)

With visualizations already created through the CartoDB console, you can simply use the **createLayer** function to add them into your web pages. Unlike **createVis**, this method requires an already activated **map** object and it does not load a basemap for you.

#### Arguments

- **map**: Leaflet L.Map object. The map should be initialized before calling this function.

- **layerSource**: contains information about the layer. It can be specified in 2 ways:

<div class="code-title">Passing the url where the layer data is located</div>
{% highlight javascript %}
cartodb.createLayer(map, 'http://myserver.com/layerdata.json')
{% endhighlight %}

<div class="code-title">passing the data directly</div>
{% highlight javascript %}
cartodb.createLayer(map, { layermetadata })
{% endhighlight %}

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

#### Returns

A promise object. You can listen for the following events:

+ **done**: triggered when the layer is created, the layer is passed as first argument. Each layer type has different options, see layers section.
+ **error**: triggered when the layer couldn't be created. The error string is the first argument.

You can call to `addTo(map[, position])` in the promise so when the layer is ready it will be added to the map.

#### Example

<div class="code-title">cartodb.createLayer using a url</div>

{% highlight javascript %}
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
{% endhighlight %}

Layer metadata must take one of the following forms:

### Standard Layer Source Object (`type: 'cartodb'`)

Used for most maps with tables that are set to public or public with link.

{% highlight javascript %}
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
{% endhighlight %}

### Torque Layer Source Object (`type: 'torque'`)

Used for [Torque maps](https://github.com/CartoDB/torque). Note that it does not allow sublayers.

{% highlight javascript %}
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
{% endhighlight %}

### Named Maps Layer Source Object (`type: 'namedmap'`)

Used for making public maps with private data. See [Named Maps](http://docs.cartodb.com/cartodb-platform/maps-api.html#named-maps-1) for more information.


{% highlight javascript %}
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
{% endhighlight %}

#### Example

<div class="code-title">cartodb.createLayer combining multiple types of layers and setting a filter</div>

{% highlight javascript %}
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
{% endhighlight %}

## cartodb.CartoDBLayer

CartoDBLayer allows you to manage tiled layers from CartoDB. It manages the sublayers.

### layer.clear()

Clears the layer. It should be invoked after removing the layer from the map.

### layer.hide()

Hides the layer from the map.

### layer.show()

Shows the layer in the map if it was previously added.

### layer.toggle()

Toggles the visibility of the layer and returns a boolean that indicates the new status (true if the layer is shown, false if it is hidden)

### layer.setOpacity(_opacity_)

Changes the opacity of the layer.

#### Arguments

+ **opacity**: value in range [0, 1]

### layer.getSubLayer(_layerIndex_)

Gets a previously created sublayer. And exception is raised if no sublayer exists.

#### Arguments

+ **layerIndex**: 0 based index of the sublayer to get. Should be within [0, getSubLayerCount())

#### Returns

A SubLayer object.

#### Example

<div class="code-title">layer.getSubLayer</div>
{% highlight javascript %}
layer.getSubLayer(1).hide();

var sublayer = layer.getSubLayer(0);

sublayer.setSQL('SELECT * FROM table_name limit 10');
{% endhighlight %}

### layer.getSubLayerCount()

Gets the number of sublayers in layer.

#### Returns

The number of sublayers.

#### Example

<div class="code-title">Hide layers using layer.getSubLayerCount</div>
{% highlight javascript %}
var num_sublayers = layer.getSubLayerCount();

for (var i = 0; i < num_sublayers; i++) {
  layer.getSubLayer(i).hide();
}
{% endhighlight %}

### layer.createSubLayer(_layerDefinition_)

Adds a new data to the current layer. With this method, data from multiple tables can be easily visualized. New in V3.

#### Arguments

- **layerDefinition**: an object with the sql and cartocss that defines the data, should be like:

<div class="code-title">layerDefinition</div>
{% highlight javascript %}
{
  sql: "SELECT * FROM table_name",
  cartocss: "#layer { marker-fill: red; }",
  interactivity: 'cartodb_id, area, column' // optional
}
{% endhighlight %}

`sql` and `cartocss` are mandatory. An exception is raised if either of them are not present. If the interactivity is not set, there is no interactivity enabled for that layer (better performance). SQL and CartoCSS syntax should be correct. Look at the documentation for  [PostgreSQL](http://www.postgresql.org/docs/9.3/interactive/sql-syntax.html) and [CartoCSS](http://docs.cartodb.com/cartodb-editor.html#customizing-maps-with-cartocss) for more information. There are some restrictions in the SQL queries:

- Must not write. INSERT, DELETE, UPDATE, ALTER and so on are not allowed (the query will fail)
- Must not contain trialing semicolon

#### Returns

A SubLayer object.

#### Example

<div class="code-title">layer.createSubLayer</div>
{% highlight javascript %}
cartodb.createLayer(map, 'http://examples.cartodb.com/api/v2/viz/european_countries_e/viz.json', function(layer) {
  // add populated places points over the countries layer
  layer.createSubLayer({
    sql: 'SELECT * FROM ne_10m_populated_places_simple',
    cartocss: '#layer { marker-fill: red; }'
  });
}).addTo(map);
{% endhighlight %}

### layer.invalidate()

Refreshes the data. If the data has been changed in the CartoDB server those changes will be displayed. Nothing happens otherwise. Every time a parameter is changed in a sublayer, the layer is refreshed automatically, so there's no need to call this method manually. New in V3.

### layer.setAuthToken(_auth_token_)

Sets the auth token that will be used to create the layer. Only available for private visualizations. An exception is
raised if the layer is not being loaded with HTTPS. See [Named Maps](http://docs.cartodb.com/cartodb-platform/maps-api.html#named-maps-1) for more information.

#### Returns

The layer itself.

#### Arguments

- **auth_token:** string

### layer.setParams(_key, value_)

Sets the configuration of a layer when using [named maps](http://docs.cartodb.com/cartodb-platform/maps-api.html#named-maps-1). It can be invoked in different ways:

<div class="code-title">layer.setParams</div>
{% highlight javascript %}
layer.setParams('test', 10); // sets test = 10
layer.setParams('test', null); // unset test
layer.setParams({'test': 1, 'color': '#F00'}); // set more than one parameter at once
{% endhighlight %}

#### Arguments

- **key:** string
- **value:** string or number

#### Returns

The layer itself.

## cartodb.CartoDBLayer.SubLayer

### sublayer.set(_layerDefinition_)

Sets sublayer parameters. Useful when more than one parameter needs to be changed.

#### Arguments

- **layerDefinition**: an object with the sql and cartocss that defines the data, like:

<div class="code-title">layerDefinition</div>
{% highlight javascript %}
{
  sql: "SELECT * FROM table_name",
  cartocss: "#layer { marker-fill: red; }",
  interactivity: 'cartodb_id, area, column' // optional
}
{% endhighlight %}

#### Returns

The layer itself.

#### Example

<div class="code-title">sublayer.set</div>
{% highlight javascript %}
sublayer.set({
  sql: "SELECT * FROM table_name WHERE cartodb_id < 100",
  cartocss: "#layer { marker-fill: red }",
  interactivity: "cartodb_id, the_geom, magnitude"
});
{% endhighlight %}

### sublayer.get(_attr_)

Gets the attribute for the sublayer, for example 'sql', 'cartocss'.

#### Returns

The requested attribute or undefined if it's not present.

### sublayer.remove()

Removes the sublayer. An exception will be thrown if a method is called and the layer has been removed.

### sublayer.show()

Shows a previously hidden sublayer. The layer is refreshed after calling this function.

### sublayer.hide()

Removes the sublayer from the layer temporarily. The layer is refreshed after calling this function.

### sublayer.toggle()

Toggles the visibility of the sublayer and returns a boolean that indicates the new status (true if the sublayer is visible, false if it is hidden)

### sublayer.isVisible()

It returns `true`  if the sublayer is visible.

## cartodb.CartoDBLayer.CartoDBSubLayer

### sublayer.getSQL()

Shortcut for `get('sql')`

### sublayer.getCartoCSS()

Shortcut for `get('cartocss')`

### sublayer.setSQL(sql)

Shortcut for `set({'sql': 'SELECT * FROM table_name'})`

### sublayer.setCartoCSS(css)

Shortcut for `set({'cartocss': '#layer {...}' })`

### sublayer.setInteractivity('cartodb_id, name, ...')

Shortcut for `set({'interactivity': 'cartodb_id, name, ...' })`

Sets the columns which data will be available via the interaction with the sublayer.

### sublayer.setInteraction(_true_)

Enables (true) or disables (false) the interaction of the layer. When disabled, **featureOver**, **featureClick**, **featureOut**, **mouseover** and **mouseout** are **not** triggered.

#### Arguments

+ **enable**: true if the interaction needs to be enabled.

### sublayer.infowindow

**sublayer.infowindow** is a Backbone model where we modify the parameters of the infowindow.

#### Attributes

- **template**: Custom HTML template for the infowindow. You can write simple HTML or use [Mustache templates](http://mustache.github.com/).
- **sanitizeTemplate**: By default all templates are sanitized from unsafe tags/attrs (e.g. `<script>`), set this to `false`
to skip sanitization, or a function to provide your own sanitization (e.g. `function(inputHtml) { return inputHtml })`).
- **width**: Width of the infowindow (value must be a number).
- **maxHeight**: Max height of the scrolled content (value must be a number).

<div class="code-title">sublayer.infowindow.set</div>
{% highlight html %}
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
         <h4>{% raw %}{{content.data.name}}{% endraw %}</h4>
       </div>
     </div>
     <div class="cartodb-popup-tip-container"></div>
  </div>
</script>
{% endhighlight %}

[Grab the complete example source code](https://github.com/CartoDB/cartodb.js/blob/develop/examples/custom_infowindow.html)

## cartodb.CartoDBLayer.HttpSubLayer

### sublayer.setURLTemplate(urlTemplate)

Shortcut for `set({'urlTemplate': 'http://{s}.example.com/{z}/{x}/{y}.png' })`

### sublayer.setSubdomains(subdomains)

Shortcut for `set({'subdomains': ['a', 'b', '...'] })`

### sublayer.setTms(tms)

Shortcut for `set({'tms': true|false })`

### sublayer.getURLTemplate

Shortcut for `get('urlTemplate')`

### sublayer.getSubdomains

Shortcut for `get('subdomains')`

### sublayer.getTms

Shortcut for `get('tms')`

### sublayer.legend

**sublayer.legend** is a Backbone model with the information about the legend.

#### Attributes

- **template**: Custom HTML template for the legend. You can write simple HTML.
- **title**: Title of the legend.
- **show_title**: Set this to `false` if you don't want the title to be displayed.
- **items**: An array with the items that are displayed in the legend.
- **visible**: Set this to `false` if you want to hide the legend.

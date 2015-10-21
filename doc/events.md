# Events

You can bind custom functions to layer events. This is useful for integrating your website with your maps, adding events for mouseovers and click events.

## layer

### layer.featureOver(_event, latlng, pos, data, layerIndex_)

Triggered when the user hovers on any feature.

#### Callback arguments

- **event**: Browser mouse event object.
- **latlng**: Array with the LatLng ([lat,lng]) where the layer was clicked.
- **pos**: Object with x and y position in the DOM map element.
- **data**: The CartoDB data of the clicked feature with the **interactivity** param.
- **layerIndex**: the layerIndex where the event happened.

#### Example

<div class="code-title">layer.on</div>
{% highlight javascript %}
layer.on('featureOver', function(e, latlng, pos, data, subLayerIndex) {
  console.log("mouse over polygon with data: " + data);
});
{% endhighlight %}

### layer.featureOut(_layerIndex_)

Triggered when the user hovers out any feature.

### layer.featureClick(_event, latlng, pos, data, layerIndex_)

Triggered when when the user clicks on a feature of a layer.

#### callback arguments

Same as `featureOver`.

### layer.mouseover()

Triggered when the mouse enters in **any** feature. Useful to change the cursor while hovering.

### layer.mouseout()

Triggered when the mouse leaves all the features. Useful to revert the cursor after hovering.

#### Example

<div class="code-title">sublayer.on</div>
{% highlight javascript %}
layer.on('mouseover', function() {
  cursor.set('hand')
});

layer.on('mouseout', function() {
  cursor.set('auto')
});
{% endhighlight %}

### layer.loading()

Triggered when the layer or any of its sublayers are about to be loaded. This is also triggered when any properties are changed but not yet visible.

#### Example

<div class="code-title">layer.on</div>
{% highlight javascript %}
layer.on("loading", function() {
  console.log("layer about to load");
});
layer.getSubLayer(0).set({
  cartocss: "#export { polygon-opacity: 0; }"
});
{% endhighlight %}

### layer.load()

Triggered when the layer or its sublayers have been loaded. This is also triggered when any properties are changed and visible.

#### Example

<div class="code-title">layer.on</div>
{% highlight javascript %}
layer.on("load", function() {
  console.log("layer loaded");
});
layer.getSubLayer(0).set({
  cartocss: "#export { polygon-opacity: 0; }"
});
{% endhighlight %}

## subLayer

### sublayer.featureOver(_event, latlng, pos, data, layerIndex_)

Same as `layer.featureOver()` but sublayer specific.

#### callback arguments

Same as `layer.featureOver()`.

### sublayer.featureClick(_event, latlng, pos, data, layerIndex_)

Same as `layer.featureClick()` but sublayer specific.

#### callback arguments

Same as `layer.featureClick()`.

### sublayer.mouseover()

Same as `layer.mouseover()` but sublayer specific.

### sublayer.mouseout()

Same as `layer.mouseover()` but sublayer specific.


# Specific UI functions

There are a few functions in CartoDB.js for creating, enabling, and disabling pieces of the user interface.

## cartodb.geo.ui.Tooltip

Shows a small tooltip on hover:

<div class="code-title">cartodb.geo.ui.Tooltip</div>
{% highlight javascript %}
var tooltip = vis.addOverlay({
  type: 'tooltip',
  template: '<p>{% raw %}{{variable}}{% endraw %}</p>' // mustache template
});
{% endhighlight %}

### cartodb.geo.ui.Tooltip.enable()

The tooltip is shown when hover on feature when is called.

### cartodb.geo.ui.Tooltip.disable()

The tooltip is not shown when hover on feature.

## cartodb.geo.ui.InfoBox

Shows a small box when the user hovers on a map feature. The position is fixed:

<div class="code-title">cartodb.geo.ui.InfoBox</div>
{% highlight javascript %}
var box = vis.addOverlay({
  type: 'infobox',
  template: '<p>{% raw %}{{name_to_display}}{% endraw %}</p>',
  width: 200, // width of the box
  position: 'bottom|right' // top, bottom, left and right are available
});
{% endhighlight %}

### cartodb.geo.ui.InfoBox.enable()

The tooltip is shown when hover on feature.

### cartodb.geo.ui.InfoBox.disable()

The tooltip is not shown when hover on feature.

## cartodb.geo.ui.Zoom

Shows the zoom control:

<div class="code-title">cartodb.geo.ui.Zoom</div>
{% highlight javascript %}
vis.addOverlay({ type: 'zoom' });
{% endhighlight %}

### cartodb.geo.ui.Zoom.show()

### cartodb.geo.ui.Zoom.hide()


# Getting data with SQL

CartoDB offers a powerful SQL API for you to query and retreive data from your CartoDB tables. CartoDB.js offers a simple to use wrapper for sending those requests and using the results.

## cartodb.SQL

**cartodb.SQL** is the tool you will use to access data you store in your CartoDB tables. This is a really powerful technique for returning things like: **items closest to a point**, **items ordered by date**, or **GeoJSON vector geometries**. It’s all powered with SQL and our tutorials will show you how easy it is to begin with SQL.

<div class="code-title">cartodb.SQL</div>
{% highlight javascript %}
var sql = new cartodb.SQL({ user: 'cartodb_user' });
sql.execute("SELECT * FROM table_name WHERE id > {% raw %}{{id}}{% endraw %}", { id: 3 })
  .done(function(data) {
    console.log(data.rows);
  })
  .error(function(errors) {
    // errors contains a list of errors
    console.log("errors:" + errors);
  })
{% endhighlight %}

It accepts the following options:

+ **format**: should be geoJSON.
+ **dp**: float precision.
+ **jsonp**: if jsonp should be used instead of CORS. This param is enabled if the browser does not support CORS.

These arguments will be applied to all the queries performed by this object. If you want to override them for one query see **execute** options.

### sql.execute(_sql [,vars][, options][, callback]_)

It executes a sql query.

#### Arguments

+ **sql**: a string with the sql query to be executed. You can specify template variables like {% raw %}{{variable}}{% endraw %} which will be filled with **vars** object.
+ **vars**: a map with the variables to be interpolated in the sql query.
+ **options**: accepts **format**, **dp** and **jsonp**. This object also overrides the params passed to $.ajax.

#### Returns

A promise object. You can listen for the following events:

+ **done**: triggered when the data arrives.
+ **error**: triggered when something failed.

You can also use done and error methods:

<div class="code-title">sql.execute</div>
{% highlight javascript %}
sql.execute('SELECT * FROM table_name')
  .done(fn)
  .error(fnError)
{% endhighlight %}

### sql.getBounds(_sql [,vars][, options][, callback]_)

Returns the bounds [ [sw_lat, sw_lon], [ne_lat, ne_lon ] ] for the geometry resulting of specified query.

<div class="code-title">sql.getBounds</div>
{% highlight javascript %}
sql.getBounds('select * from table').done(function(bounds) {
    console.log(bounds);
});
{% endhighlight %}

#### Arguments

+ **sql**: a string with the sql query to calculate the bounds from.

#### Application of getBounds in Leaflet

You can use the results from `getBounds` to center data on your maps using Leaflet.

- **getBounds and Leaflet**

<div class="code-title">sql.getBounds</div>
{% highlight javascript %}
sql.getBounds('select * from table').done(function(bounds) {
  map.setBounds(bounds);
  // or map.fitBounds(bounds, mapView.getSize());
});
{% endhighlight %}

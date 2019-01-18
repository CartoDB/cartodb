# Specific UI Functions

There are a few functions in CARTO.js for creating, enabling, and disabling pieces of the user interface.

## vis.addOverlay(tooltip)

A tooltip is an infowindow that appears when you hover your mouse over a map feature with [`vis.addOverlay(options)`](http://docs.carto.com/carto-engine/carto-js/api-methods/#visaddoverlayoptions). A tooltip appears where the mouse cursor is located on the map. You can customize the position of how the tooltip appears by defining the position options.

#### Example

```javascript
var tooltip = vis.addOverlay({
  type: 'tooltip',
  template: '<p>{{variable}}</p>' // mustache template
  width: 200,
  position: 'bottom|right', // top, bottom, left and right are available
  fields: [{ name: 'name', population: 'pop2005' }]
});
```
**Note:** If you are using `createLayer` for a map object that contains an enabled tooltip, you can disable the tooltip by applying the `false` value. See the [cartodb.createLayer(map, layerSource [, options] [, callback])](https://carto.com/docs/carto-engine/carto-js/api-methods/#cartodbcreatelayermap-layersource--options--callback) `tooltip` description for how to enable/disable an interactive tooltip.

## vis.addOverlay(infobox)

Similar to a tooltip, an infobox displays a small box when you hover your mouse over a map feature. When viewing an infobox on a map, _the position of the infobox is fixed_, and always appears in the same position; depending on how you defined the position values for the infobox.

#### Example

```javascript
var infoBox = layer.leafletMap.viz.addOverlay({
  type: 'infobox',
  template: '<p>{{name_to_display}}</p>',
  width: 200, // width of the box
  position: 'bottom|right' // top, bottom, left and right are available
});
```

## cartodb.vis.Vis.addInfowindow(_map, layer, fields [, options]_)

Infowindows provide additional interactivity for your published map, controlled by layer events. It enables interaction and overrides the layer interactivity. A pop-up information window appears when a viewer clicks on a map feature. 

#### Arguments

Option | Description
--- | ---
map | native map object or leaflet.
layer | cartodb layer (or sublayer).
fields | array of column names.<br /><br />**Note:** This tells CARTO what columns from your dataset should appear in your infowindow.
options | 
--- | ---
&#124;_ infowindowTemplate | allows you to set the HTML of the template.
&#124;_templateType | indicates the type of template ([`Mustache` template](http://mustache.github.io/mustache.5.html) or `Underscore` template placeholders).

**Tip:** See [How can I use CARTO.js to create and style infowindows?](http://docs.carto.com/faqs/infowindows/#how-can-i-use-cartojs-to-create-and-style-infowindows) for an overview of how to create infowindows.

#### Returns

An infowindow object, see [sublayer.infowindow](http://docs.carto.com/carto-engine/carto-js/api-methods/#sublayerinfowindow)

#### Example

The following example displays how to enable infowindow interactivity with the "click" action. This is the default for infowindows.

{% highlight html %}
 cartodb.vis.Vis.addInfowindow(map, sublayer, ['cartodb_id', 'lat', 'lon', 'name'],{
  infowindowTemplate: $('#infowindow_template').html(),
  templateType: 'mustache'
  });
{% endhighlight %}

#### Example (Infowindow with Tooltip)

The following example displays how to enable infowindow interactivity with the mouse "hover" action. This is referred to as a tooltip, and is defined with [`vis.addOverlay`](http://docs.carto.com/carto-engine/carto-js/api-methods/#visaddoverlayoptions).

{% highlight html %}
layer.leafletMap.viz.addOverlay({
  type: 'tooltip',
  layer: sublayer,
  template: '<div class="cartodb-tooltip-content-wrapper"><img style="width: 100%" src={{_url}}>{{name}}, {{age}}, {{city}}, {{country}}</div>', 
  position: 'bottom|right',
  fields: [{ name: 'name' }]
  });
{% endhighlight %}

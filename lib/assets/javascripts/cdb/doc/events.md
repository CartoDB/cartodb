# Events

You can bind custom functions to layer events by adding listeners and callbacks to the async portions of the CARTO.js library. Active layer events are triggered by layers on your webpage that are already loaded (**Tip:** these are the `createLayer` and `createVis` functions that return the _done_ event. For details, see [Loading Events](http://docs.carto.com/carto-engine/carto-js/getting-started/#loading-listener-events)). Each event requires the layer to include an **interactivity** layer. This is useful for integrating your website with your maps, adding events for mouseovers and click events. 

**Note:** Be mindful of using these events, as these functions can get costly if you have a lot of features on a map.

## layer

### layer.featureOver(_event, latlng, pos, data, layerIndex_)

Triggered when the user mouse hovers on any feature. 

#### Callback arguments

Name |Description
--- | ---
event | Browser mouse event object.
latlng | Array with the `LatLng ([lat,lng])` where the layer was clicked.
pos | Object with x and y position in the DOM map element.
data | The CARTO data of the clicked feature with the `interactivity` param.
layerIndex | the `layerIndex` where the event happened.

#### Example

```javascript
layer.on('featureOver', function(e, latlng, pos, data, subLayerIndex) {
  console.log("mouse over polygon with data: " + data);
});
```

### layer.featureOut(_layerIndex_)

Triggered when the user hovers out any feature. For example, you might want to use this event if you highlight polygons on mouseover and need a way to know when to remove the highlighting after the mouse has left.

#### Example 

```javascript
layer.on('featureOut', function(e, latlng, pos, data, layer) {
  console.log("mouse left polygon with data: " + data);
});
```

### layer.featureClick(_event, latlng, pos, data, layerIndex_)

Triggered when when the user clicks on a feature of a layer.

#### Example

```javascript
layer.on('featureClick', function(e, latlng, pos, data, layer) {
  console.log("mouse clicked polygon with data: " + data);
});
```

#### Callback arguments

Same as `featureOver`.

### layer.mouseover()

Triggered when the mouse enters in **any** feature. Useful to change the cursor while hovering.

### layer.mouseout()

Triggered when the mouse leaves all the features. Useful to revert the cursor after hovering.

#### Example

```javascript
layer.on('mouseover', function() {
  cursor.set('hand')
});

layer.on('mouseout', function() {
  cursor.set('auto')
});
```

### layer.loading()

Triggered when the layer or any of its sublayers are about to be loaded. This is also triggered when any properties are changed but not yet visible.

#### Example

```javascript
layer.on("loading", function() {
  console.log("layer about to load");
});
layer.getSubLayer(0).set({
  cartocss: "#export { polygon-opacity: 0; }"
});
```

### layer.load()

Triggered when the layer or its sublayers have been loaded. This is also triggered when any properties are changed and visible.

#### Example

```javascript
layer.on("load", function() {
  console.log("layer loaded");
});
layer.getSubLayer(0).set({
  cartocss: "#export { polygon-opacity: 0; }"
});
```

---

## subLayer

### sublayer.featureOver(_event, latlng, pos, data, layerIndex_)

Same as `layer.featureOver()` but sublayer specific.

#### Callback arguments

Same as `layer.featureOver()`.

### sublayer.featureClick(_event, latlng, pos, data, layerIndex_)

Same as `layer.featureClick()` but sublayer specific.

#### Callback arguments

Same as `layer.featureClick()`.

### sublayer.mouseover()

Same as `layer.mouseover()` but sublayer specific.

### sublayer.mouseout()

Same as `layer.mouseover()` but sublayer specific.

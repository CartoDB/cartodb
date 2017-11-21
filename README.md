CARTO.js [v4](http://cartodb.github.io/cartodb.js/)
===========

This library allows to embed visualizations created with CARTO in your map or website in a simple way.

## Quick start

  1. Add Leaflet and CARTO.js to your site:

  ```html
  <!-- Include Leaflet Library -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.2.0/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.2.0/dist/leaflet.js"></script>

  <!-- Include CARTO.js Library -->
  <script src="https://cdn.rawgit.com/CartoDB/cartodb.js/@4.0.0-alpha/carto.js"></script>
  ```

  2. Create the map and add the layer

  ```javascript
  var map = L.map('map').setView([0, 0], 3);

  // Set a base layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png', {
      attribution: '&copy;<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy;<a href="https://carto.com/attribution">CARTO</a>'
  }).addTo(map);

  // Define a client
  var client = new carto.Client({
    apiKey: '84fdbd587e4a942510270a48e843b4c1baa11e18',
    username: 'cartojs-test'
  });

  // Define a layer
  var source = new carto.source.Dataset('ne_adm0_europe');
  var style = new carto.style.CartoCSS('#layer {polygon-fill: #162945;}');
  var layer = new carto.layer.Layer(source, style);

  // Add the layer to the map
  client.addLayer(layer);
  client.getLeafletLayer().addTo(map);
  ```


## ~Documentation
You can find the documentation online [here](http://docs.carto.com/cartodb-platform/cartodb-js.html) and the [source](https://github.com/CartoDB/cartodb.js/blob/develop/doc/API.md) inside this repository.

## ~Examples

- [Load a layer with google maps](http://cartodb.github.com/cartodb.js/examples/gmaps_force_basemap.html)
- [Load a layer with Leaflet](http://cartodb.github.com/cartodb.js/examples/leaflet.html)
- [Show a complete visualization](http://cartodb.github.com/cartodb.js/examples/easy.html)
- [A visualization with a layer selector](http://cartodb.github.com/cartodb.js/examples/layer_selector.html)
- [How to create a custom infowindow](http://cartodb.github.com/cartodb.js/examples/custom_infowindow.html)
- [The Hobbit filming location paths](http://cartodb.github.com/cartodb.js/examples/TheHobbitLocations/) a full example with some widgets


## ~How to build
Build CartoDB.js library:

- Install [node.js](http://nodejs.org/download/), from 0.10 version
- Install grunt: `npm install -g grunt-cli`
- Install node dependencies: `npm install`
- Install [ruby](https://www.ruby-lang.org/en/installation/) and [bundler](https://github.com/bundler/bundler)
- Install ruby dependencies: `bundle install` (necessary for compass gem)
- Start the server: `grunt build`
- Happy mapping!

## ~Submitting Contributions

You will need to sign a Contributor License Agreement (CLA) before making a submission. [Learn more here.](https://carto.com/contributing)

cartodb.js
==========

This library allows to embed you visualizations created with CartoDB in your map or website in a simple way.


quick start
===========

  1. add cartodb.js and css to your site (and google maps if you are using it):

    ```html

        <link rel="stylesheet" href="http://libs.cartocdn.com/cartodb.js/v3/themes/css/cartodb.css" />

        <script src="http://libs.cartocdn.com/cartodb.js/v3/cartodb.js"></script>
    ```

    Or if you need https:

    ```html

        <!-- use these cartodb.css links if you are using https -->
        <link rel="stylesheet" href="https://cartodb-libs.global.ssl.fastly.net/cartodb.js/v3/themes/css/cartodb.css">

        <!-- use this cartodb.js link if you are using https -->
        <script src="https://cartodb-libs.global.ssl.fastly.net/cartodb.js/v3/cartodb.js"></script>
    ```


  2. create the map and add the layer

    **leaflet**

    ```javascript
      var map = L.map('map').setView([0, 0], 3);

      // set a base layer 
      L.tileLayer('http://a.tile.stamen.com/toner/{z}/{x}/{y}.png', {
        attribution: 'stamen http://maps.stamen.com/'
      }).addTo(map);
      
      // add the cartodb layer
      var layerUrl = 'http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json';
      cartodb.createLayer(map, layerUrl).addTo(map);
    ```


examples
========

 - [Load a layer with Leaflet](http://cartodb.github.io/cartodb.js/examples/leaflet.html)
 - [Show a complete visualization](http://cartodb.github.io/cartodb.js/examples/easy.html)
 - [A visualization with a layer selector](http://cartodb.github.io/cartodb.js/examples/layer_selector.html)
 - [How to create a custom infowindow](http://cartodb.github.io/cartodb.js/examples/custom_infowindow.html)
 - [The Hobbit filming location paths](http://cartodb.github.io/cartodb.js/examples/TheHobbitLocations/) a full example with some widgets
 - [Load a vector layer with Google Maps](http://cartodb.github.io/cartodb.js/examples/gmaps_vector.html)
 - [Load a vector layer with Leaflet](http://cartodb.github.io/cartodb.js/examples/leaflet_vector.html)
 - [Load a vector layer to Leaflet with hover effect](http://cartodb.github.io/cartodb.js/examples/leaflet_vector_hover.html)
 - [Add cursor interaction without a visualization](http://cartodb.github.io/cartodb.js/examples/cursor_interaction.html)
 - [Load a layer with Google Maps](http://cartodb.github.io/cartodb.js/examples/gmaps.html)


next steps
==========

  - see our [examples](https://github.com/CartoDB/cartodb.js/tree/develop/examples)
  - read the [API reference](https://github.com/CartoDB/cartodb.js/tree/develop/doc/API.md)
  - read our mailing list



how to build
============

  Build CartoDB.js library:
    
  - Install node.js, from 0.10 version (http://nodejs.org/download/).
  - Install grunt, ```npm install -g grunt-cli```.
  - Install dependencies ```npm install```.
  - Choose your desired ruby version and ```bundle install``` (necessary for compass gem).
  - Install bower: ```npm install -g bower```
  - Install bower dependencies: ```bower install```
  - Start the server: ```grunt build```.
  - Happy mapping!
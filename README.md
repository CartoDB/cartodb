CartoDB.js (v3.15)
===========

[![Build Status](http://clinker.cartodb.net/desktop/plugin/public/status/CartoDB-js-develop-testing)]
(http://clinker.cartodb.net/jenkins/job/CartoDB-js-develop-testing)

This library allows to embed visualizations created with CartoDB in your map or website in a simple way.


## Quick start

  1. Add cartodb.js and css to your site:

    ```html

        <link rel="stylesheet" href="http://libs.cartocdn.com/cartodb.js/v3/3.15/themes/css/cartodb.css" />
        <script src="http://libs.cartocdn.com/cartodb.js/v3/3.15/cartodb.js"></script>

        <!-- use these cartodb.css links if you are using https -->
        <!--link rel="stylesheet" href="https://cartodb-libs.global.ssl.fastly.net/cartodb.js/v3/3.15/themes/css/cartodb.css" /-->

        <!-- use this cartodb.js link if you are using https -->
        <!-- script src="https://cartodb-libs.global.ssl.fastly.net/cartodb.js/v3/3.15/cartodb.js"></script -->
    ```


  2. Create the map and add the layer

    ```javascript
      var map = L.map('map').setView([0, 0], 3);

      // set a base layer
      L.tileLayer('http://a.tile.stamen.com/toner/{z}/{x}/{y}.png', {
        attribution: 'stamen http://maps.stamen.com/'
      }).addTo(map);

      // add the cartodb layer
      var layerUrl = 'http://documentation.carto.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json';
      cartodb.createLayer(map, layerUrl).addTo(map);
    ```

### Usage with Bower

You can install **cartodb.js** with [bower](http://bower.io/) by running

```sh
bower install cartodb.js
```


## Documentation
You can find the documentation online [here](http://docs.carto.com/cartodb-platform/cartodb-js.html) and the [source](https://github.com/CartoDB/cartodb.js/blob/develop/doc/API.md) inside this repository.

## Examples

 - [Load a layer with google maps](http://cartodb.github.com/cartodb.js/examples/gmaps_force_basemap.html)
 - [Load a layer with Leaflet](http://cartodb.github.com/cartodb.js/examples/leaflet.html)
 - [Show a complete visualization](http://cartodb.github.com/cartodb.js/examples/easy.html)
 - [A visualization with a layer selector](http://cartodb.github.com/cartodb.js/examples/layer_selector.html)
 - [How to create a custom infowindow](http://cartodb.github.com/cartodb.js/examples/custom_infowindow.html)
 - [The Hobbit filming location paths](http://cartodb.github.com/cartodb.js/examples/TheHobbitLocations/) a full example with some widgets


## How to build
Build CartoDB.js library:

  - Install [node.js](http://nodejs.org/download/), from 0.10 version
  - Install grunt & bower: `npm install -g grunt-cli bower`
  - Install node dependencies: `npm install`
  - Install bower dependencies: `bower install`
  - Install [ruby](https://www.ruby-lang.org/en/installation/) and [bundler](https://github.com/bundler/bundler)
  - Install ruby dependencies: `bundle install` (necessary for compass gem)
  - Start the server: `grunt build`
  - Happy mapping!
  - 
  
## Submitting Contributions

You will need to sign a Contributor License Agreement (CLA) before making a submission. [Learn more here.](https://carto.com/contributing)


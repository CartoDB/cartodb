
cartodb.js
==========

This library allows to embed you visualizations created with CartoDB in your map or website in a simple way.


quick start
===========

  1. add cartodb.js and css to your site (and google maps if you are using it):

    ```html
        <link rel="stylesheet" href="http://libs.cartodb.com/cartodb.js/v2/themes/css/cartodb.css" />
        <script src="https://maps.googleapis.com/maps/api/js?sensor=false"></script>
        <script src="http://libs.cartocdn.com/cartodb.js/v2/cartodb.uncompressed.js"></script>

        <!-- use these links if you are using https -->
        <!--
        <link rel="stylesheet" href="https://d3voyrscnb0slx.cloudfront.net/cartodb.js/v2/themes/cartodb.css" />
        <script src="https://d3voyrscnb0slx.cloudfront.net/cartodb.js/v2/cartodb.js"></script>
        -->
    ```


  2. create the map and add the layer

    ```javascript

        // create google map
        var map;
        var mapOptions = {
          zoom: 7,
          center: new google.maps.LatLng(43, -68),
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        map = new google.maps.Map(document.getElementById('map'),  mapOptions);

        // add the cartodb layer
        var layerUrl = 'http://staging20.cartodb.com/api/v1/viz/nh_final/viz.json';
        cartodb.createLayer(map, layerUrl, function(layer) {
            map.overlayMapTypes.setAt(0, layer);
        });

    ```

    


next steps
==========

  - see our [examples](./examples)
  - read the [API reference](./doc/api.md)
  - read our mailing list



how to build
============

    ```
    make release
    ```



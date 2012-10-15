
# cartodb.js

This library allows you to use the visualizations created using [CartoDB](http://cartodb.com/ "cartodb") in your website or introduce them in your current map. Here are described all the methods available, check examples page to see the API in action


### **cartodb.loadLayer**(map, layerSource [, options])

load the specified layer in the spcified map. The layer is appended to the existing ones.

*arguments*:

  + **map**: leaflet L.Map or google maps google.maps.Map object. The map should be initialized before calling this function

  + **layerSource**: contains information about the layer. It can be specified in 3 ways:

    - passing your cartodb username and table

    ```javascript
       cartodb.loadLayer(map, { user: 'rambo', table: 'charlies'})
    ```

    ``host``, ``port`` and ``protocol`` can be passed as options if you are not using your own CartoDB

    - passing the url where the layer data is located

    ```javascript
       cartodb.loadLayer(map, 'http://myserver.com/layerdata.json')
    ```

    - passing the data directly

    ```javascript
       cartodb.loadLayer(map, { ... layer metadata ... });
    ```

  + **options**: each type of layer has different options

*returns*: promise object.

*example*:

```javascript

    var map;
    var mapOptions = {
      zoom: 5,
      center: new google.maps.LatLng(43, 0),
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById('map'),  mapOptions);

    cartodb.loadLayer(map, {
      user: 'development',
      table: 'clubbing',
      host: 'localhost.lan:3000',
      protocol: 'http'
    }).on('done', function(layer) {
      layer.on('featureOver', function(e, pos, latlng, data) {
        console.log(e, pos, latlng, data);
      })
    }).on('error', function() {
      console.log("some error occurred");
    });

```





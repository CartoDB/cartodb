
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



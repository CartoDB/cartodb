# Upgrading from v1 ([cartodb-gmapsv3](https://github.com/vizzuality/cartodb-gmapsv3) | [leaflet](https://github.com/vizzuality/cartodb-leaflet)) or v2 ([v2.0.28](https://github.com/CartoDB/cartodb.js/releases/tag/v2.0.28)) to latest CartoDB.js v3

If your application is running an old CartoDB javascript library, you should take
into account that the creation layer method and layer functions won't work as expected.

- [Creation](#creation)
- [Methods](#methods)
  - setMap
  - setQuery
  - setStyle
  - setLayerOrder
  - isAdded
  - setBounds

---

## Creation

You should follow the [instructions](http://docs.carto.com/cartodb-platform/cartodb-js.html#adding-cartodb-layers-to-an-existing-map) we have in our [documentation](http://docs.carto.com/cartodb-platform/cartodb-js.html).
You will find [layer available options](http://docs.carto.com/cartodb-platform/cartodb-js.html#cartodbcreatelayermap-layersource--options--callback) and code examples there.

---

## Methods

Following methods are not supported or have changed:

- **setMap**: use [addTo](http://docs.carto.com/cartodb-platform/cartodb-js.html#creating-visualizations-at-runtime) instead.

  - _v1:_
  ```javascript
  var layer = new L.CartoDBLayer({
    map: map,
    user_name:'cartodb_user',
    table_name: 'table_name',
    query: "SELECT * FROM {{table_name}}",
    tile_style: "#{{table_name}} {marker-fill:red}"
  })
  map.addLayer(layer);
  ```

  - _v2:_
  ```javascript
  cartodb.createLayer(map, layerUrl, options, function(layer) {
    // For Leaflet
    map.addLayer(layer);

    // For GMaps
    map.overlayMapTypes.setAt(0, layer);
  });
  ```

  - _v3:_
  ```javascript
  cartodb.createLayer(map, layerUrl, options)
    .addTo(map)
    .on('done', function(layer) { ... });
  ```


- **setQuery**: use [setSQL](http://docs.carto.com/cartodb-platform/cartodb-js.html#sublayersetsqlsql) instead.

  - _v1:_
  ```javascript
  layer.setQuery("SELECT * FROM {{table_name}} WHERE cartodb_id = 3");
  ```

  - _v2:_
  ```javascript
  layer.setQuery("SELECT * FROM table_name WHERE cartodb_id = 10");
  ```

  - _v3:_
  ```javascript
  layer.setSQL("SELECT * FROM table_name WHERE cartodb_id = 9");
  ```


- **setStyle**: use [setCartoCSS](http://docs.carto.com/cartodb-platform/cartodb-js.html#sublayersetcartocsscss) instead.

  - _v1:_
  ```javascript
  layer.setStyle("#{{table_name}} { marker-fill:purple }");
  ```

  - _v2:_
  ```javascript
  layer.setCartoCSS("#layer { marker-fill:pink }");
  ```

  - _v3:_
  ```javascript
  layer.setCartoCSS("#layer { marker-fill:yellow }");
  ```


- **setLayerOrder**: no alternative, check proper map library methods.

  - _v1:_
  ```javascript
  layer.setLayerOrder(2); // Only available for GMaps
  ```

  - _v2:_ check v3

  - _v3:_ [Leaflet(1)](http://leafletjs.com/reference.html#tilelayer-bringtofront), [Leaflet(2)](http://leafletjs.com/reference.html#tilelayer-setzindex) or GMaps.
  ```javascript
  // For Leaflet
  layer.bringToFront();
  layer.bringToBack();
  layer.setZIndex();

  // For GMaps
  map.overlayMapTypes.setAt(0, layer);
  ```


- **isAdded**: check it with proper map library functions ([Leaflet](http://leafletjs.com/reference.html#map-haslayer) or [GMaps](https://developers.google.com/maps/documentation/javascript/reference#MVCArray)).

  - _v1:_
  ```javascript
  layer.isAdded(); // Returned true or false
  ```

  - _v2:_ check v3

  - _v3:_ [Leaflet](http://leafletjs.com/reference.html#map-haslayer) or GMaps.
  ```javascript
  // For Leaflet
  map.haslayer(layer);

  // For GMaps
  var added = false;
  map.overlayMapTypes.forEach(function(lyr){
    if (lyr === layer) added = true;
  });
  ```


- **setBounds**: you can get the needed info using CartoDB SQL ([example](http://docs.carto.com/cartodb-platform/cartodb-js.html#sqlgetboundssql-vars-options-callback)).

  - _v1:_
  ```javascript
  layer.setBounds("SELECT * FROM {{table_name}} WHERE cartodb_id < 100");
  ```

  - _v2:_ check v3

  - _v3:_
  ```javascript
  var sql = new cartodb.SQL({ user: 'cartodb_user' });
  sql.getBounds('select * from table').done(function(bounds) {
    console.log(bounds);
  });
  ```
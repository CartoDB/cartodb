# Upgrading from v1 ([cartodb-gmapsv3](https://github.com/vizzuality/cartodb-gmapsv3) | [leaflet](https://github.com/vizzuality/cartodb-leaflet)) or v2 ([v2.0.28](https://github.com/CartoDB/cartodb.js/releases/tag/v2.0.28)) to latest CartoDB.js v3

If your application is running an old CartoDB javascript library, you should take
into account that the creation layer method and layer functions won't work as expected.

- 1.[Creation](#creation)
- 2.[Methods](#methods)

---

## Creation

You should follow the [instructions](http://docs.cartodb.com/cartodb-platform/cartodb-js.html#adding-cartodb-layers-to-an-existing-map) we have in our [documentation](http://docs.cartodb.com/cartodb-platform/cartodb-js.html).
You will find [layer available options](http://docs.cartodb.com/cartodb-platform/cartodb-js.html#cartodbcreatelayermap-layersource--options--callback) and code examples there.

---

## Methods

Following methods are not supported or have changed.

| v1            | v2                                                                                     | v3         | 
| ------------- | ---------------------------------------------------------------------------------------|------------|
| setMap        | Leaflet: ```map.addLayer(layer)``` / GMaps: ```map.overlayMapTypes.setAt(0, layer);``` | [addTo](http://docs.cartodb.com/cartodb-platform/cartodb-js.html#creating-visualizations-at-runtime)|
| setQuery      | setQuery                                                                               | [setSQL](http://docs.cartodb.com/cartodb-platform/cartodb-js.html#sublayersetsqlsql) | 
| setStyle      | setCartoCSS                                                                            | [setCartoCSS](http://docs.cartodb.com/cartodb-platform/cartodb-js.html#sublayersetcartocsscss) |
| setLayerOrder | (*)                                                                                    | no alternative, check proper map library methods [Leaflet](http://leafletjs.com/reference.html#tilelayer-bringtofront) or GMaps: ```map.overlayMapTypes.setAt(0, layer);``` |
| isAdded       | (*)                                                                                    | check it with proper map library functions [Leaflet](http://leafletjs.com/reference.html#map-haslayer) or GMaps: looping through map.overlayMapTypes [MVCArray](https://developers.google.com/maps/documentation/javascript/reference#MVCArray) and comparing layers. | 
| setBounds     | (*)                                                                                    | you can use this function within the proper map library [Leaflet](http://leafletjs.com/reference.html#map-fitbounds) or  [GMaps](https://developers.google.com/maps/documentation/javascript/reference#Map)) or get this info using CartoDB SQL ([example](http://docs.cartodb.com/cartodb-platform/cartodb-js.html#sqlgetboundssql-vars-options-callback)). | 


*It was deprecated in that version, check v3 solution.
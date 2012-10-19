
# cartodb.js - API reference

This library allows you to use the visualizations created using [CartoDB](http://cartodb.com/ "cartodb") in your website or introduce them in your current map. Here are described all the methods available, check examples page to see the API in action




### **cartodb.VERSION**

Contains the library version, should be something like ``'2.0.1'``




### **cartodb.createLayer**(map, layerSource [, options] [, callback])

create the specified layer to be added map. The layer is not appended to the map, you should add it using the API of the map you are using (see examples).

*arguments*:

  + **map**: leaflet L.Map or google maps google.maps.Map object. The map should be initialized before calling this function

  + **layerSource**: contains information about the layer. It can be specified in 2 ways:

    - passing the url where the layer data is located

    ```javascript
       cartodb.createLayer(map, 'http://myserver.com/layerdata.json')
    ```

    - passing the data directly

    ```javascript
       cartodb.createLayer(map, { ... layer metadata ... });
    ```

  + **options**: each type of layer has different options
  + **callback(layer)**: if a function is specified is called when the layer is created passing it as argument

*returns*: promise object. You can listen for the following events:

  + ``done``: triggered when the layer is created, the layer is passed as first argument. Each layer type has different options, see layers section
  + ``error``: triggered when the layer couldn't be created. The error string is the first argument


*example*:

```javascript

    var map;
    var mapOptions = {
      zoom: 5,
      center: new google.maps.LatLng(43, 0),
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById('map'),  mapOptions);

    cartodb.loadLayer(map, 'http://examples.cartodb.com/tables/TODO/cartodb.js')
      .on('done', function(layer) {
        layer
          .on('featureOver', function(e, pos, latlng, data) {
            console.log(e, pos, latlng, data);
          })
          .on('error', function(err) {
            console.log('error: ' + err);
          });
      }).on('error', function(err) {
        console.log("some error occurred: " + err);
      });

```



## layers 

Each kind of layer has different API, so depending on the the layer you created in CartoDB you will be able to perform different actions. In order to know what type of layer has been created you can check ``type`` attribute. 

Here are described all the layer types you can get:

### **cartodb**

#### methods

### **clear()**: 

  Should be called after removing from it from the map.

### **hide()**: 

  Hides the cartodb layer from the map. Disables the interaction if it was enabled.

### **show()**

  Show the cartodb layer in the map if it was previously added. Enables the interaction if it was enabled.

### **setInteraction(enable)** 

  Set the interaction of your layer to true or false. When is disabled ``featureOver``, ``featureClick`` and ``featureOut`` are **not** triggered

*arguments*:

  + **enable**: true if the interaction needs to be enabled

### **setQuery(sql)** 
  Sets the sql query. The layer will show the geometry resulting of this query. When the query raises an error, ``error`` event is triggered. If you set sql to null the query is reset to 'select * form {{table_name}}'

  The layer is refreshed just after the execute this function.

*arguments*:

  + **sql**: postgres valid sql query. {{table_name}} can be used as variable, it will replaced by the table_name used in the visualization.

*example*:

```javascript
  // this will show in the map the geometries with area greater than 10
  layer.setQuery("SELECT * FROM {{table_name}} WHERE area > 10");

  // error management
  layer.setQuery("wrong syntax query");
  layer.on('error', function(err) {
    console.log("there was some problem: " + err);
  });
```

### setCartoCSS(cartoCSS, version='2.0.1') 
  Change the style of the layer tiles.
  'error' event is triggered on the layer if something is wrong with the style
  set cartoCSS to null to reset to original style

*arguments*:

  + **cartoCSS**: Changes the cartoCSS style applied to the tiles 
  + **version**: cartoCSS version. You usually do not need to change this
  
  
*example*:

```javascript
  layer.setCartoCSS("#{{table_name}}{ marker-fill:blue }");
```

## isVisible()

  Get the visibility of the layer

*returns*:
  true: if layer is visible

## setInteractivity(fieldsArray)

  Change the columns you want to get data

##setOptions(options) 

  Change any parameter at the same time refreshing the tiles once 

*available options*
  + query: see setQuery
  + tile_style: see setStyle
  + opacity: see setOpacity
  + interactivity: see setInteractivity
  
*Example*: 

```javascript
  layer.setOptions({
     query: "SELECT * FROM {{table_name}} WHERE cartodb_id < 100", 
     interactivity: "cartodb_id,the_geom,magnitude"
  });

## setOpacity(opacity)
  
  Change the opacity of the layer

*arguments*

  + **opacity**: value in range [0, 1]



#### events 

## featureOver -> (event, latlng, pos, data)
  
  A callback when hovers in a feature

*callback arguments*

   + event: Browser mouse event object
   + latlng: The LatLng in an array [lat,lng] where was clicked
   + pos: Object with x and y position in the DOM map element
   + data: The CartoDB data of the clicked feature with the `interactivity` param.

*example*
```javascript
  layer.on('featureOver', function(e, latlng, pos, data) {
    console.log("mouse over polygon with data: " + data);
  });
```

## featureOut

  A callback when hovers out a feature

## featureClick -> (event, latlng, pos, data)

  A callback when clicks in a feature

*callback arguments*

  same than featureOver

/*
setBounds: Set bounds in the map using a new query or the default one Example: cartodb_gmapsv3.setBounds("SELECT * FROM {{table_name}} WHERE cartodb_id < 100");
*/


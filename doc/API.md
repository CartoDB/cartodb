<hgroup>*CartoDB.js*</hgroup>

## CartoDB.js - API reference

[CartoDB](http://cartodb.com/ "cartodb") offers a simple unified JavaScript library called CartoDB.js that serves all your mapping and API needs. This library allows you to connect to your stored visualizations, create new visualizations, add custom interaction, or access and query your raw data from a web browser; meaning, your applications just got a whole lot more powerful with a lot less code.

When you add CartoDB.js to your websites you get some great new tools to make maps or power your content with data. Let’s take a look.


### Getting started

You can start implementing CartoDB visualizations within your web-pages today, just include CartoDB.css, and CartoDB.js inside the <head> tag of your page:


``` html
    <link rel="stylesheet" href="http://libs.cartocdn.com/cartodb.js/v2/themes/css/cartodb.css" />
    <script src="http://libs.cartocdn.com/cartodb.js/v2/cartodb.js"></script>
```

You may notice that we offer the JS library over a CDN, this makes CartoDB lightning fast, and available at the same speed to your viewers anywhere in the world. 

The CartoDB.css document isn’t mandatory, however if you are making a map and are not familiar with writing your own CSS for the various needed elements, it can vastly help jumpstart the process.


### Leaflet or Google Maps

We’ve made it easier than ever for you to build maps using the mapping library of your choice. Using CartoDB.js you can build maps using Leaflet or Google Maps using the exact same functions, nothing will change. This makes it easy for you to remember and remain consistent in your development of online maps.

If you want to create maps using Google Maps, you’ll still need to include the GMaps V3 library in your HTML to make them work. If you want to use Leaflet though, CartoDB.js handles loading all the necessary libraries for you, just include CartoDB.js in the <head> of your web-page and you are ready to go!


### Example usage





### Advance functionality

The CartoDB.js has many great features for you to use in your applications. Let’s take a look at the most important for your application development.

##### Viz JSON support

A big change from the first release of CartoDB and CartoDB 2.0 is the integration of Viz JSON files. The Viz JSON file is served for each map you create in your CartoDB admin console. It tells the browser things like the style you want to use for your data and the filters you want to apply with SQL. All the stored values are also easy to override with CartoDB.js if you want to do something completely different than what you design in your console. Loading a Viz JSON is as simple as,

``` javascript
    cartodb.loadLayer(map, 'http://examples.cartodb.com/api/v1/viz/0001/viz.json')
```


##### getBounds wrapper

We have added a wrapper method to get the bounding box for any dataset or filtered query using the CartoDB.js library. The **getBounds** function can be useful for guiding users to the right location on a map or for loading only the right data at the right time based on user actions.

```javascript
    var sql = cartodb.SQL({ user: 'cartodb_user' });
    sql.getBounds('select * form table').done(function(bounds) {
        console.log(bounds);
    });
```

##### Event listener support

The CartoDB.js is highly asynchronous, meaning your application can get on with what it needs to do while the library efficiently does what you request in the background. This is useful for loading maps or getting query results. At the same time, we have made it very simple to add listeners and callbacks to the async portions of the library.

###### loadLayer listeners

The loadLayer function returns two important events for you to take advantage of: the first is ‘done’, which will let your code know that a layer has loaded and the library has successfully read the information from the Viz JSON you requested. The second is ‘error’, which lets you know something did not go as expected when loading a requested layer:

``` javascript
    cartodb.loadLayer(map, 'http://examples.cartodb.com/api/v1/viz/0001/viz.json')
      .on('done', function(layer) {
        alert(‘CartoDB layer loaded!’);
      }).on('error', function(err) {
        alert("some error occurred: " + err);
      });
```

###### layer event listeners

The next important set of events for you to use happen on those layers that are already loaded (returned by the ‘done’ event above). Three events are triggered by layers on your webpage, each requires the layer to include an **interactivity** layer. The first event is **featureClick**, which lets you set up events after the user clicks anything that you have mapped.

``` javascript
    layer.on('featureClick', function(e, latlng, pos, data) {
      console.log("mouse clicked polygon with data: " + data);
    });
```

The second event is the **featureOver** event, which lets you listen for when the user’s mouse is over a feature. Be careful, as these functions can get costly if you have a lot of features on a map.

``` javascript
    layer.on('featureOver', function(e, latlng, pos, data) {
      console.log("mouse over polygon with data: " + data);
    });
```

Similarly, there is the **featureOut** event. This is best used if you do things like highlighting polygons on mouseover and need a way to know when to remove the highlighting after the mouse has left.

``` javascript
    layer.on('featureOut', function(e, latlng, pos, data) {
      console.log("mouse left polygon with data: " + data);
    });
```

##### IE support

We have worked hard to support Internet Explorer with CartoDB.js. It currently works for version X.X onward. The biggest change you should note is that for the CSS you will need to include an additional IE CSS document we have made available. Your <head> tag should now house links to three documents, as follows,

``` html
    <link rel="stylesheet" href="http://libs.cartocdn.com/cartodb.js/v2/themes/css/cartodb.ie.css" />
    <link rel="stylesheet" href="http://libs.cartocdn.com/cartodb.js/v2/themes/css/cartodb.css" />
    <script src="http://libs.cartocdn.com/cartodb.js/v2/cartodb.js"></script>
```


##### Persistent version hosting

We are committed to making sure your website works as intended no matter what changes in the future. While we may find more efficient or more useful features to add to the library as time progresses. We never want to break things you have already developed, for this reason, we make versioned CartoDB.js libraries available to you, meaning that the way they function will never unexpectedly change on you.

We recommend that you always develop against the most recent version of CartoDB.js, always found at,

``` javascript
    http://libs.cartocdn.com/cartodb.js/v2/cartodb.js
```

Anytime you wish to push a stable version of your site to the web though, you can find the version of CartoDB.js you are using by looking at the first line of the library, here

``` javascript
    http://libs.cartocdn.com/cartodb.js/v2/cartodb.js
```

Or, by running the following in your code,

``` javascript
    alert(cartodb.VERSION)
```

Now, that you have your CartoDB.js version, you can point your site at that release. If the current version of CartoDB.js is 2.0.11, the URL would be,

``` javascript
    http://libs.cartocdn.com/cartodb.js/v2/2.0.11/cartodb.js
```

You can do the same for the CSS documents we provide,

``` javascript
    http://libs.cartocdn.com/cartodb.js/v2/2.0.11/themes/css/cartodb.css
```




### API

This reference reflects CartoDB.js 2.0.11. It is intended for developers that need to know all methods available on the library. For any questions regarding the usage of the library or for problems with the documentation please contact us at support@cartodb.com

##### cartodb.createLayer(map, layerSource [, options] [, callback])

**cartodb.createLayer** is probably going to be the most important instrument in your toolbox.

With visualizations already created through the CartoDB console, you can simply use the **createLayer** function to add them into your web pages. This method works the same whether you are using Google Maps or Leaflet.

###### ARGUMENTS

  + **map**: leaflet L.Map or google maps google.maps.Map object. The map should be initialized before calling this function
  + **layerSource**: contains information about the layer. It can be specified in 2 ways:
    - passing the url where the layer data is located:
      
      ``` javascript

          cartodb.createLayer(map, 'http://myserver.com/layerdata.json')
      ```
    - passing the data directly:
      
      ``` javascript

          cartodb.createLayer(map, { ... layer metadata ... });
      ```
  + **options**: each type of layer has different options.
  + **callback(layer)**: if a function is specified is called when the layer is created passing it as argument.


###### RETURNS

Promise object. You can listen for the following events:

  + **done**: triggered when the layer is created, the layer is passed as first argument. Each layer type has different options, see layers section.
  + **error**: triggered when the layer couldn't be created. The error string is the first argument.


###### example:

``` javascript

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


##### **clear()**

  Should be called after removing the layer from the map.

##### **hide()**

  Hides the cartodb layer from the map. Disables the interaction if it was enabled.

##### **show()**

  Show the cartodb layer in the map if it was previously added. Enables the interaction if it was enabled.

##### **setInteraction(enable)**

  Sets the interaction of your layer to true (enabled) or false (disabled). When is disabled **featureOver**, **featureClick** and **featureOut** are **not** triggered.

###### ARGUMENTS

  + **enable**: true if the interaction needs to be enabled.

##### **setQuery(sql)**

  Sets the sql query. The layer will show the geometry returned by this query. When the query raises an error, **error** event is triggered. If you set sql to null the query is set to 'select * form {{table_name}}'.

  The layer is refreshed just after you execute this function.

###### ARGUMENTS

  + **sql**: postgres valid sql query. {{table_name}} can be used as variable, it will replaced by the table_name used in the visualization.

###### EXAMPLE

  ```javascript

    // this will show in the map the geometries with area greater than 10
    layer.setQuery("SELECT * FROM {{table_name}} WHERE area > 10");

    // error management
    layer.setQuery("wrong syntax query");
    layer.on('error', function(err) {
      console.log("there was some problem: " + err);
    });
  ```

##### setCartoCSS(cartoCSS, version='2.0.1')

  Changes the style of the layer.
  An 'error' event is triggered on the layer if something is wrong with the style.
  Set cartoCSS to **null** to reset to original style

###### ARGUMENTS

  + **cartoCSS**: Changes the cartoCSS style applied to the tiles.
  + **version**: cartoCSS version. You usually do not need to change this.

###### EXAMPLE

``` javascript

    layer.setCartoCSS("#{{table_name}}{ marker-fill:blue }");
```

##### isVisible()

  Get the visibility of the layer. Returns true or false.

###### RETURNS
  true: if layer is visible.


##### setInteractivity(fieldsArray)

  Change the columns you want to get data.

##### setOptions(options)

  Change any parameter at the same time refreshing the tiles once.

###### available options

  + **query**: see setQuery.
  + **tile_style**: see setStyle.
  + **opacity**: see setOpacity.
  + **interactivity**: see setInteractivity.

###### EXAMPLE

``` javascript

    layer.setOptions({
       query: "SELECT * FROM {{table_name}} WHERE cartodb_id < 100",
       interactivity: "cartodb_id,the_geom,magnitude"
    });
```

##### setOpacity(opacity)

  Change the opacity of the layer.

###### ARGUMENTS

  + **opacity**: value in range [0, 1].



#### Events

##### featureOver -> (event, latlng, pos, data)

   A callback when hovers in a feature

###### CALLBACK ARGUMENTS

   + event: Browser mouse event object.
   + latlng: The LatLng in an array [lat,lng] where was clicked.
   + pos: Object with x and y position in the DOM map element.
   + data: The CartoDB data of the clicked feature with the **interactivity** param.

###### EXAMPLE

``` javascript

    layer.on('featureOver', function(e, latlng, pos, data) {
      console.log("mouse over polygon with data: " + data);
    });
```

##### featureOut -> ()

  A callback when hovers out a feature.

##### featureClick -> (event, latlng, pos, data)

  A callback when clicks in a feature.

###### callback arguments

  Same as **featureOver**.



##### cartodb.SQL

**cartodb.SQL** is the tool you will use to access data you store in your CartoDB tables. This is a really powerful technique for returning things like: **items closest to a point**, **items ordered by date**, or **GeoJSON vector geometries**. It’s all powered with SQL and our tutorials will show you how easy it is to begin with SQL.


``` javascript

    var sql = cartodb.SQL({ user: 'cartodb_user' });
    sql.execute("select * from table where id > {{id}}", { id: 3 })
      .done(function(data) {
        console.log(data.rows);
      })
      .error(function(errors) {
        // errors contains a list of errors
        console.log("error:" + err);
      })
```

It accepts the following options:

  + **format**: should be geojson.
  + **dp**: float precision.
  + **jsonp**: if jsonp should be used instead of CORS. This param is enabled if the browser does not support CORS.

These arguments will be applied for all the queries performed by this object, if you want to override them for one query see **execute** options.

##### execute(sql [,vars][, options][, callback])

It executes a sql query. 

###### ARGUMENTS

  + **sql**: a string with the sql query to be executed. You can specify template variables like {{variable}} which will be filled with **vars** object.
  + **vars**: a map with the variables to be interpolated in the sql query.
  + **options**: accepts **format**, **dp** and **jsonp**. This object also overrides the params passed to $.ajax.

###### RETURNS

Promise object. You can listen for the following events:

  + **done**: triggered when the data arrives.
  + **error**: triggered when something failed.

You can also use done and error methods:

```javascript
    sql.execute('select * from table')
      .done(fn)
      .error(fnError)
```
 
##### **getBounds**(sql [,vars][, options][, callback])

Return the bounds [ [sw_lat, sw_lon], [ne_lat, ne_lon ] ] for the geometry resulting of specified query.

```javascript
    sql.getBounds('select * form table').done(function(bounds) {
        console.log(bounds);
    });
```
  
###### ARGUMENTS

  + **sql**: a string with the sql query to calculate the bounds from.


##### **cartodb.VERSION**

Contains the library version, should be something like '2.0.1'.
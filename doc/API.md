<hgroup>*CartoDB.js*</hgroup>

## CartoDB.js - API reference

[CartoDB](http://cartodb.com/ "cartodb") offers a simple unified JavaScript library called CartoDB.js that let you interact with the CartoDB service. This library allows you to connect to your stored visualizations, create new visualizations, add custom interaction, or access and query your raw data from a web browser; meaning, your applications just got a whole lot more powerful with a lot less code.

When you add CartoDB.js to your websites you get some great new tools to make maps or power your content with data. Let’s take a look.

If you want to check out the source code or contribute, please visit the [project Github page](http://github.com/cartodb/cartodb.js).

### Getting started

The simplest way to use a visualization created in CartoDB on an external site is:

<div class="margin20"></div>
``` javascript
    ...
    <body>
        <div id="map"></div>
    </body>
    ...
    <script>
        // get the viz.json url from the CartoDB UI
        // - go to the map tab
        // - click on share
        // - go to API tab
        window.onload = function() {
          cartodb.createVis('map', 'http://examples-beta.cartodb.com/api/v1/viz/219/viz.json');
        }
    </script>
```

get the complete example [here](https://github.com/CartoDB/cartodb.js/blob/develop/examples/easy.html).


### Using the library

CartoDB.js can be used when you want to embed and use a visualization you have designed using CartoDB user interface, or to create visualizations from scratch dynamically using your data. If you want to create new maps on your webpage, jump to "using CartoDB visualizations in your webpage". If you already have maps on your webpage and want to add CartoDB visualizations to them, read "Add CartoDB layer to an existing map".

You can also use CartoDB APIs to create visualization without having to define them using the website, you can create them dynamically in your code. This is useful for example when the visualizations change depending on user interactions. To read more about it jump to, [create visualizations at runtime](#runtime).

We’ve also made it easier than ever for you to build maps using the mapping library of your choice. Whether you are using Leaflet or Google Maps your CartoDB.js code remains the same. This makes our API documentation simple and straightforward. It also makes it easy for you to remember and keep consistent if you development or maintain multiple maps online. 

To use CartoDB.js in your web-page, you no longer need to host the library on your servers, instead we have made a fast and lightweight version of it available for you online. This has the extra benefit that whenever we fix bugs they get fixed automatically on your visualizations without having to update anything on your side. To start building maps with your CartoDB hosted tables, just including the CartoDB.js inside the HEAD tag of your page:

<div class="margin20"></div>
``` html
    <link rel="stylesheet" href="http://libs.cartocdn.com/cartodb.js/v2/themes/css/cartodb.css" />
    <!--[if lte IE 8]>
        <link rel="stylesheet" href="http://libs.cartocdn.com/cartodb.js/v2/themes/css/cartodb.ie.css" />
    <![endif]-->
    <script src="http://libs.cartocdn.com/cartodb.js/v2/cartodb.js"></script>
```
<div class="margin20"></div>

The library is being mirrored on servers all over the world (using a CDN), so you can be sure that no matter where your website viewers are, they will get CartoDB.js loaded in the fastest way possible. 


##### Using CartoDB visualizations in your webpage

The **cartodb.createVis** method is probably going to be the most important one in your CartoDB toolbox. 

This is the easiest way to quickly get a CartoDB map onto your webpage. It handles all the details of loading a map interface, basemap, and your CartoDB data visualization. You can start by giving cartodb.js the DIV ID from your HTML where you want to place your map and the Viz JSON URL from your CartoDB map. 

<div class="margin20"></div>
``` javascript
    cartodb.createVis('map', 'http://examples-beta.cartodb.com/api/v1/viz/791/viz.json');
```
<div class="margin20"></div>

That's it! No need to create the map instance, insert controls, or load layers, it handles it all for you. You just give cartodb.js a set of options (zoom, loader, infowindows...) to modify how your final map looks, see **cartodb.Vis** in the API section for the full list of options.

You can also use the returned **layer** to build functionality (show/hide, click, hover, custom infowindows) using the new layer:

<div class="margin20"></div>
``` javascript
    cartodb.createVis('map', 'http://examples-beta.cartodb.com/api/v1/viz/791/viz.json')
        .done(function(vis, layers) {
            // layer 0 is the base layer, layer 1 is cartodb layer
            layers[1].on('featureOver', function(e, latlng, pos, data) {
              cartodb.log.log(e, latlng, pos, data);
            });
    
            // you can also get the map object created by cartodb.js
            map = vis.getNativeMap();
            // Now, perform any operations you need
            // map.setZoom(3)
            // map.setCenter(new google.maps.Latlng(...))
        });
```
<div class="margin20"></div>

If you have used Google Maps for you basemap in your CartoDB account, using **createViz** requires that you load the Google Maps V3 JavaScript libarary in the HEAD of your HTML. If you use other basemaps, cartodb.js will load the Leaflet library for you automatically. 

##### Add CartoDB layer to an existing map

With visualizations already created through the CartoDB website, you can simply use the **createLayer** function to add them into your web pages. Unlike the **cartodb.createVis**, you will use this method if you create you **map** instance independantly of cartodb.js. This is useful when you have more things on your map apart from CartoDB layers or you have an existing application.

This method works the same whether you are using Google Maps or Leaflet. Learn the details and different uses of layers in our API documentation below.

To show you just how simple CartoDB.js can be, let's put it all together. Start by including the necessary libararies in the HEAD of your HTML (remember the Google Maps JS library if you are using a Google Maps basemap):

<div class="margin20"></div>
``` html
    <link rel="stylesheet" href="http://libs.cartocdn.com/cartodb.js/v2/themes/css/cartodb.css" />
    <!--[if lte IE 8]>
        <link rel="stylesheet" href="http://libs.cartocdn.com/cartodb.js/v2/themes/css/cartodb.ie.css" />
    <![endif]-->
    <script src="http://libs.cartocdn.com/cartodb.js/v2/cartodb.js"></script>
```
<div class="margin20"></div>

Next, in the BODY of your HTML include a DIV for your map and the minimum CartoDB.js script to load your data.

<div class="margin20"></div>
``` javascript
    <div id="map"></div>
    <script>
        var map = new L.Map('map', { 
          center: [0,0],
          zoom: 2
        })
        cartodb.createLayer(map, 'http://examples-beta.cartodb.com/api/v1/viz/766/viz.json')
          .on('error', function(err) {
            alert("some error occurred: " + err);
          });
    </script>
```
<div class="margin20"></div>

In the above case, we create a new map, but in your case you probably already have the instance of **map** available in your code. 

See **cartodb.createLayer** in the API section or see a [simple example](https://github.com/CartoDB/cartodb.js/blob/develop/examples/easy.html).



<h5 id="runtime">Creating visualizations at runtime</h5>

All CartoDB services are available via the APIs. That means that you can create a new visualization without having to create them before on the CartoDB website. This is particularly useful when you are modifying the visualization depending on user interactions that change the SQL to get the data or CartoCSS to style it. This method, although more advance, provides all the flexibility you might need to create the most dynamic visualizations.

When you create a visualization using the CartoDB website, you get automatically a viz.json URL defining it. When you want to create the visualization via JS, obviously you dont have it, so you will pass all the required parameters to the library so that it can create the visualization at runtime and display it on your map. It is pretty simple.

<div class="margin20"></div>
``` javascript
    cartodb.createLayer(map, {
        type: 'cartodb',
        options: {
            table: 'mytable',
            user_name: 'cartodb_username'
            query: 'select * from mytable where age > 10'
        }
    }).done(function(layer) {
        map.addLayer(layer);
    });
```
<div class="margin20"></div>

That's it! That is all the code you need to start developing your own maps with CartoDB.js. If you want to start building applications straight away, head over to our tutorials to see how to start making your own maps.

### Advanced functionality

The CartoDB.js has many great features for you to use in your applications. Let’s take a look at the most important for your application development.

##### Viz JSON support

The Viz.JSON document tells CartoDB.js all the information about your map, including the style you want to use for your data and the filters you want to apply with SQL. The Viz JSON file is served with each map you create in your CartoDB account.

Although the Viz JSON file stores all your map settings, all the values are also easy to customize with CartoDB.js if you want to do something completely different than what you designed in your console. Loading the Viz JSON is as simple as:

<div class="margin20"></div>
``` javascript
    cartodb.createVis('map', 'http://examples.cartodb.com/api/v1/viz/ne_10m_populated_p_1/viz.json')
```

##### Bounds wrapper

We have added easy method to get the bounding box for any dataset or filtered query using the CartoDB.js library. The **getBounds** function can be useful for guiding users to the right location on a map or for loading only the right data at the right time based on user actions.

<div class="margin20"></div>
``` javascript
    var sql = new cartodb.SQL({ user: 'cartodb_user' });
    sql.getBounds('select * from table').done(function(bounds) {
        console.log(bounds);
    });
```

##### Event listener support

The CartoDB.js is highly asynchronous, meaning your application can get on with what it needs to do while the library efficiently does what you request in the background. This is useful for loading maps or getting query results. At the same time, we have made it very simple to add listeners and callbacks to the async portions of the library.

###### Loading events

The **createLayer** and **createVis** functions returns two important events for you to take advantage of: the first is **done**, which will let your code know that the library has successfully read the information from the Viz JSON and loaded the layer you requested. The second is ‘error’, which lets you know something did not go as expected when loading a requested layer:

<div class="margin20"></div>
``` javascript
    cartodb.createLayer(map, 'http://examples.cartodb.com/api/v1/viz/0001/viz.json')
      .on('done', function(layer) {
        alert(‘CartoDB layer loaded!’);
      }).on('error', function(err) {
        alert("some error occurred: " + err);
      });
```
<div class="margin20"></div>

###### Active layer events

The next important set of events for you to use happen on those layers that are already loaded (returned by the **done** event above). Three events are triggered by layers on your webpage, each requires the layer to include an **interactivity** layer. The first event is **featureClick**, which lets you set up events after the user clicks anything that you have mapped.

<div class="margin20"></div>
``` javascript
    layer.on('featureClick', function(e, latlng, pos, data) {
      console.log("mouse clicked polygon with data: " + data);
    });
```
<div class="margin20"></div>

The second event is the **featureOver** event, which lets you listen for when the user’s mouse is over a feature. Be careful, as these functions can get costly if you have a lot of features on a map.

<div class="margin20"></div>
``` javascript
    layer.on('featureOver', function(e, latlng, pos, data) {
      console.log("mouse over polygon with data: " + data);
    });
```
<div class="margin20"></div>

Similarly, there is the **featureOut** event. This is best used if you do things like highlighting polygons on mouseover and need a way to know when to remove the highlighting after the mouse has left.

<div class="margin20"></div>
``` javascript
    layer.on('featureOut', function(e, latlng, pos, data) {
      console.log("mouse left polygon with data: " + data);
    });
```
<div class="margin20"></div>

##### Leaflet integration

If you want to use [Leaflet](http://leafletjs.com) it gets even easier, CartoDB.js handles loading all the necessary libraries for you! just include CartoDB.js and CartoDB.css in the HEAD of your website and you are ready to go! The CartoDB.css document isn’t mandatory, however if you are making a map and are not familiar with writing your own CSS for the various needed elements, it can greatly help to jumpstart the process. Adding it is as simple as adding the main JavaScript library:

<div class="margin20"></div>
``` html
    <link rel="stylesheet" href="http://libs.cartocdn.com/cartodb.js/v2/themes/css/cartodb.css" />
    <script src="http://libs.cartocdn.com/cartodb.js/v2/cartodb.js"></script>
```

##### IE support

We have worked hard to support Internet Explorer with CartoDB.js. It currently works for IE7 through IE10. The biggest change you should note is that for the CSS you will need to include an additional IE CSS document we have made available. Your <head> tag should now house links to three documents, as follows,

<div class="margin20"></div>
``` html
    <link rel="stylesheet" href="http://libs.cartocdn.com/cartodb.js/v2/themes/css/cartodb.css" />
    <!--[if lte IE 8]>
        <link rel="stylesheet" href="http://libs.cartocdn.com/cartodb.js/v2/themes/css/cartodb.ie.css" />
    <![endif]-->
    <script src="http://libs.cartocdn.com/cartodb.js/v2/cartodb.js"></script>
```

##### Persistent version hosting

We are committed to making sure your website works as intended no matter what changes in the future. While we may find more efficient or more useful features to add to the library as time progresses. We never want to break things you have already developed, for this reason, we make versioned CartoDB.js libraries available to you, meaning that the way they function will never unexpectedly change on you.

We recommend that you always develop against the most recent version of CartoDB.js, always found at:

<div class="margin20"></div>
``` javascript
    http://libs.cartocdn.com/cartodb.js/v2/cartodb.js
```
<div class="margin20"></div>

Anytime you wish to push a stable version of your site to the web though, you can find the version of CartoDB.js you are using by looking at the first line of the library, here:

<div class="margin20"></div>
``` javascript
    http://libs.cartocdn.com/cartodb.js/v2/cartodb.js
```
<div class="margin20"></div>

Or, by running the following in your code:

<div class="margin20"></div>
``` javascript
    alert(cartodb.VERSION)
```
<div class="margin20"></div>

Now, that you have your CartoDB.js version, you can point your site at that release. If the current version of CartoDB.js is 2.0.11, the URL would be:

<div class="margin20"></div>
``` javascript
    http://libs.cartocdn.com/cartodb.js/v2/2.0.11/cartodb.js
```
<div class="margin20"></div>

You can do the same for the CSS documents we provide:

<div class="margin20"></div>
``` javascript
    http://libs.cartocdn.com/cartodb.js/v2/2.0.11/themes/css/cartodb.css
```
<div class="margin20"></div>

### Usage examples
If you want to start playing with the library, there are several examples to start with:

  <div class="margin20"></div>

  + An easy example using the library ( [live](http://cartodb.github.com/cartodb.js/examples/easy.html) | [code](https://github.com/CartoDB/cartodb.js/blob/develop/examples/easy.html) ).
  + Leaflet integration ( [live](http://cartodb.github.com/cartodb.js/examples/leaflet.html) | [code](https://github.com/CartoDB/cartodb.js/blob/develop/examples/leaflet.html) ).
  + Google Maps v3 integration ( [live](http://cartodb.github.com/cartodb.js/examples/gmaps.html) | [code](https://github.com/CartoDB/cartodb.js/blob/develop/examples/gmaps.html) ).  
  + Customizing the infowindow data ( [live](http://cartodb.github.com/cartodb.js/examples/custom_infowindow.html) | [code](https://github.com/CartoDB/cartodb.js/blob/develop/examples/custom_infowindow.html) ).
  + An example using a layer selector ( [live](http://cartodb.github.com/cartodb.js/examples/layer_selector.html) | [code](https://github.com/CartoDB/cartodb.js/blob/develop/examples/layer_selector.html) ).
  + The Hobbit map done with the library ( [live](http://cartodb.github.com/cartodb.js/examples/TheHobbitLocations/) | [code](https://github.com/CartoDB/cartodb.js/tree/develop/examples/TheHobbitLocations) ).



### API

The documentation below reflects CartoDB.js for the 2.0.x library versions. For major changes in the library we will update the documentation here. This documentation is meant to help developers find specific methods for using the CartoDB.js library.

For any questions regarding the usage of the library or for problems with the documentation please contact us at [support@cartodb.com](mailto:support@cartodb.com).


### Creating maps

##### cartodb.Vis

**cartodb.Vis** is probably going to be the most important instrument in your toolbox. This method allows to do a complete visualization, managing everything for the map and layer creation. In addition, it allows you to add easily modify widgets like zoom, loader, infowindow, tooltips, and overlays.

##### cartodb.createVis(map_id, vizjson_url[, options] [, callback])

Creates a visualization inside the map_id DOM object:

<div class="margin20"></div>
``` javascript
    var url = 'http://examples-beta.cartodb.com/api/v1/viz/791/viz.json';
    cartodb.createVis('map', url)
      .done(function(vis, layers) {
      });
```
<div class="margin20"></div>

###### ARGUMENTS
  + **map_id**: a DOM object, for example **$('#map')** or a DOM id.
  + **vizjson_url**: url of the vizjson object.
  + **options**:
    - shareable: add facebook and twitter share buttons.
    - title: adds a header with the title of the visualization.
    - description: adds description to the header (as you set in the UI).
    - searchControl: adds a search control (default: false).
    - zoomControl: adds zoom control (default: true).
    - loaderControl: adds loading control (default: true).
    - center_lat: center coordinates where the map is initializated.
    - center_lon.
    - zoom: initial zoom.
    - cartodb_logo: default to true, set to false if you want to remove the cartodb logo
    - infowindow: set to false if you want to disable the infowindow (enabled by default)

##### cartodb.Vis.getLayers()
Return an array of layers in the map. The first is the base layer.

##### cartodb.Vis.addOverlay(options)
Add an overlay to the map, these are the overlays you can add: zoom, tooltip, infobox.

###### RETURNS
An overlay object, depending on the options.type different object will be returned, see cartodb.vis.Overlays.

##### cartodb.Vis.getOverlay(type)
Return the first overlay with the specified **type**.

<div class="margin20"></div>
``` javascript
    var zoom = vis.getOverlay('zoom')
    zoom.clean() // remove it from the screen
```
<div class="margin20"></div>


##### cartodb.Vis.getOverlays()
Returns a list of overlays currently on the screen (see overlays description).

##### cartodb.Vis.getNativeMap ()
Returns the native map object being used. It can be google.maps.Map or L.Map depending on the provider you setup in the UI.

##### cartodb.vis.Overlays
An overlay is a control shown on top of the map.

Overlay objects are always created using method **addOverlay** of cartodb.Vis object.

An overlay is internally a **Backbone.View** so if you know how backbone works you can use it. If you want to use plain DOM objects you can access to **overlay.el** (**overlay.$el** for jquery object).



### Creating layer functions

##### cartodb.createLayer(map, layerSource [, options] [, callback])

With visualizations already created through the CartoDB console, you can simply use the **createLayer** function to add them into your web pages. Unlike **createVis**, this method requires an already activated **map** object and it does not load a basemap for you. The method works the same whether your map object is [Google Maps](https://developers.google.com/maps/documentation/javascript/) or [Leaflet](http://leafletjs.com).

###### ARGUMENTS

  + **map**: leaflet L.Map or google maps google.maps.Map object. The map should be initialized before calling this function.
  + **layerSource**: contains information about the layer. It can be specified in 2 ways:
    
    - passing the url where the layer data is located:
      
      ``` javascript
          cartodb.createLayer(map, 'http://myserver.com/layerdata.json')
      ```

    - passing the data directly:
      
      ``` javascript
          cartodb.createLayer(map, { ... layer metadata ... });
      ```

      <div class="margin20"></div>
      Layer metadata is always in the form: { type: 'LAYER_TYPE_NAME', options: {....} }
        - for type **cartodb** options should be:
            - user_name: your username in cartodb, username.cartodb.com (mandatory).
            - table_name: the table you want to display (mandatory).
            - query: sql query applied.
            - tile_style: cartocss applied.
            - interactivity: data available in interactivity (see featureOver and featureClick).
            - featureOver: callback called when pointer is on a feature.
            - featureClick: callback called when user cliks on a feature.
            - featureOut: called then the pointer gets out of a feature.
            - interaction: default true, set it to false when you don't want interactivity layer yo be loaded (recomended if you don't user interaction).
            - cartodb_logo: default to true, set to false if you want to remove the cartodb logo

  + **options**: each type of layer has different options.

  + **callback(layer)**: if a function is specified is called when the layer is created passing it as argument.


###### RETURNS

Promise object. You can listen for the following events:

  + **done**: triggered when the layer is created, the layer is passed as first argument. Each layer type has different options, see layers section.
  + **error**: triggered when the layer couldn't be created. The error string is the first argument.


###### example:

<div class="margin20"></div>
``` javascript
    var map;
    var mapOptions = {
      zoom: 5,
      center: new google.maps.LatLng(43, 0),
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    map = new google.maps.Map(document.getElementById('map'),  mapOptions);

    cartodb.createLayer(map, 'http://examples.cartodb.com/tables/TODO/cartodb.js')
      .on('done', function(layer) {
        layer
          .on('featureOver', function(e, latlng, pos, data) {
            console.log(e, latlng, pos, data);
          })
          .on('error', function(err) {
            console.log('error: ' + err);
          });
      }).on('error', function(err) {
        console.log("some error occurred: " + err);
      });
```


##### **layer.clear()**

  Should be called after removing the layer from the map.

##### **layer.hide()**

  Hides the cartodb layer from the map. Disables the interaction if it was enabled.

##### **layer.show()**

  Show the cartodb layer in the map if it was previously added. Enables the interaction if it was enabled.

##### layer.isVisible()

  Get the visibility of the layer. Returns true or false.

###### RETURNS

  true: if layer is visible.

##### layer.setOpacity(opacity)

  Change the opacity of the layer.

###### ARGUMENTS

  + **opacity**: value in range [0, 1].

##### **layer.setInteraction(enable)**

  Sets the interaction of your layer to true (enabled) or false (disabled). When is disabled **featureOver**, **featureClick** and **featureOut** are **not** triggered.

###### ARGUMENTS

  + **enable**: true if the interaction needs to be enabled.

##### **layer.setQuery(sql)**

  Sets the sql query. The layer will show the geometry returned by this query. When the query raises an error, **error** event is triggered. If you set sql to null the query is set to 'select * form {{table_name}}'.

  The layer is refreshed just after you execute this function.

###### ARGUMENTS

  + **sql**: postgres valid sql query. {{table_name}} can be used as variable, it will replaced by the table_name used in the visualization.

###### EXAMPLE
  ``` javascript
      // this will show in the map the geometries with area greater than 10
      layer.setQuery("SELECT * FROM {{table_name}} WHERE area > 10");
  
      // error management
      layer.setQuery("wrong syntax query");
      layer.on('error', function(err) {
        console.log("there was some problem: " + err);
      });
  ```

##### layer.setCartoCSS(cartoCSS, version='2.0.1')

  Changes the style of the layer.
  An 'error' event is triggered on the layer if something is wrong with the style.
  Set cartoCSS to **null** to reset to original style

###### ARGUMENTS

  + **cartoCSS**: Changes the cartoCSS style applied to the tiles.
  + **version**: cartoCSS version. You usually do not need to include this.

###### EXAMPLE
<div class="margin20"></div>
``` javascript
    layer.setCartoCSS("#{{table_name}}{ marker-fill:blue }");
```

##### layer.setInteractivity(fieldsArray)

  Change the columns you want to get data.

##### layer.setOptions(options)

  Change any parameter at the same time refreshing the tiles once.

###### available options

  + **query**: see setQuery.
  + **tile_style**: see setStyle.
  + **opacity**: see setOpacity.
  + **interactivity**: see setInteractivity.


###### EXAMPLE

<div class="margin20"></div>

``` javascript
    layer.setOptions({
       query: "SELECT * FROM {{table_name}} WHERE cartodb_id < 100",
       interactivity: "cartodb_id,the_geom,magnitude"
    });
```


### Creating layer events

You can add custom functions to layer events. This is useful for integrating your website with your maps, adding events for mouseovers and click events.

##### layer.featureOver -> (event, latlng, pos, data)

   A callback when hovers in a feature.

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

##### layer.featureOut -> ()

  A callback when hovers out any feature.

##### layer.featureClick -> (event, latlng, pos, data)

  A callback when clicks in a feature.

###### callback arguments

  Same as **featureOver**.



### Specific UI functions

There are a few functions in CartoDB.js for creating, enabling, and disabling pieces of the user-interface.

##### cartodb.geo.ui.Tooltip
Shows a small tooltip on hover:

``` javascript
    var tooltip = vis.addOverlay({
      type: 'tooltip'
      template: '<p>{{variable}}</p>' // mustache template
    });
```

##### cartodb.geo.ui.Tooltip.enable
The tooltip is shown when hover on feature when is called.

##### cartodb.geo.ui.Tooltip.disable
The tooltip is not shown when hover on feature.


##### cartodb.geo.ui.InfoBox
Show an small box when the user hovers on a map feature. The position is fixed:

``` javascript
    var box = vis.addOverlay({
      type: 'infobox',
      template: '<p>{{name_to_display}}</p>'
      width: 200, // width of the box
      position: 'bottom|right' // top, bottom, left and right are available
    });
```

##### cartodb.geo.ui.InfoBox.enable
The tooltip is shown when hover on feature when is called.

##### cartodb.geo.ui.InfoBox.disable
The tooltip is not shown when hover on feature.

##### cartodb.geo.ui.Zoom
Shows the zoom control:

``` javascript
    vis.addOverlay({ type: 'zoom' });
```
##### cartodb.geo.ui.Zoom.show()
##### cartodb.geo.ui.Zoom.hide()


### Getting data with SQL

CartoDB offers a powerful SQL API for you to query and retreive data from your CartoDB tables. The CartoDB.js offers a simple to use wrapper for sending those requests and using the results. 


##### cartodb.SQL

**cartodb.SQL** is the tool you will use to access data you store in your CartoDB tables. This is a really powerful technique for returning things like: **items closest to a point**, **items ordered by date**, or **GeoJSON vector geometries**. It’s all powered with SQL and our tutorials will show you how easy it is to begin with SQL.

<div class="margin20"></div>
``` javascript
    var sql = new cartodb.SQL({ user: 'cartodb_user' });
    sql.execute("select * from table where id > {{id}}", { id: 3 })
      .done(function(data) {
        console.log(data.rows);
      })
      .error(function(errors) {
        // errors contains a list of errors
        console.log("error:" + err);
      })
```
<div class="margin20"></div>

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

``` javascript
    sql.execute('select * from table')
      .done(fn)
      .error(fnError)
```
 
##### **getBounds**(sql [,vars][, options][, callback])

Return the bounds [ [sw_lat, sw_lon], [ne_lat, ne_lon ] ] for the geometry resulting of specified query.

``` javascript
    sql.getBounds('select * form table').done(function(bounds) {
        console.log(bounds);
    });
```
  
###### ARGUMENTS

  + **sql**: a string with the sql query to calculate the bounds from.




### Versions

Keep in mind the version of CartoDB.js you are using for development. For any live code, we recommend you link directly to the tested CartoDB.js version from your development. You can find the version at anytime as follows:

##### **cartodb.VERSION**

Contains the library version, should be something like '2.0.11'.




# Other important stuff

CartoDB.js has many great features for you to use in your applications. Let’s take a look at some of the most important ones:

## Viz JSON support

The Viz.JSON document tells CartoDB.js all the information about your map, including the style you want to use for your data and the filters you want to apply with SQL. The Viz JSON file is served with each map you create in your CartoDB account.

Although the Viz JSON file stores all your map settings, all these settings can be easily customized with CartoDB.js. For example, if you want to do something completely different than what you initially designed it for. Loading the Viz JSON is as simple as:

```javascript
cartodb.createVis('map', 'http://examples.carto.com/api/v2/viz/ne_10m_populated_p_1/viz.json')
```

---

## How to set a different host than carto.com

CartoDB.js sends all requests to the carto.com domain by default. If you are running your own
instance of CartoDB you can change the URLs to specify a different host.

A different host can be configured by using ``sql_api_template`` and ``maps_api_template`` in the ``options`` parameter
for any ``cartodb`` function call.

The format of these templates is as follows:

```javascript
sql_api_template: 'https://{user}.test.com'
```

CartoDB.js will replace ``{user}``.

Notice that you don't need to set the path to the endpoint, CartoDB.js will set it automatically.

---

## Bounds wrapper

We have added an easy method to get the bounding box for any dataset or filtered query using the CartoDB.js library. The **getBounds** function can be useful for guiding users to the right location on a map or for loading only the right data at the right time based on user actions.

```javascript
var sql = new cartodb.SQL({ user: 'cartodb_user' });

sql.getBounds('SELECT * FROM table_name').done(function(bounds) {
  console.log(bounds);
});
```

---

## Event listener support

CartoDB.js is highly asynchronous. Your application can get on with what it needs to do while the library efficiently does what you request in the background. This is useful for loading maps or getting query results. At the same time, we have made it very simple to add listeners and callbacks to the async portions of the library.

### Loading events

The **createLayer** and **createVis** functions trigger two important events for you to take advantage of. The first one is **done**, which will let your code know that the library has successfully read the information from the Viz JSON and loaded the layer you requested. The second is **error**, which lets you know that something did not go as expected when trying to load the requested layer:

```javascript
cartodb.createLayer(map, 'http://examples.carto.com/api/v1/viz/0001/viz.json')
  .addTo(map)
  .on('done', function(layer) {
    alert(‘CartoDB layer loaded!’);
  }).on('error', function(err) {
    alert("some error occurred: " + err);
  });
```

### Active layer events

The next important set of events for you to use happen on those layers that are already loaded (returned by the **done** event above). Three events are triggered by layers on your webpage, each requires the layer to include an **interactivity** layer. The first event is **featureClick**, which lets you set up events after the user clicks anything that you have mapped.

```javascript
layer.on('featureClick', function(e, latlng, pos, data, layer) {
  console.log("mouse clicked polygon with data: " + data);
});
```

The second event is the **featureOver** event, which lets you listen for mouse hovers on any feature. Be careful, as these functions can get costly if you have a lot of features on a map.

```javascript
layer.on('featureOver', function(e, latlng, pos, data, layer) {
  console.log("mouse over polygon with data: " + data);
});
```

Finally, there is the **featureOut** event. This is best used if you do things like highlighting polygons on mouseover and need a way to know when to remove the highlighting after the mouse has left.

```javascript
layer.on('featureOut', function(e, latlng, pos, data, layer) {
  console.log("mouse left polygon with data: " + data);
});
```

---

## Leaflet integration

If you want to use [Leaflet](http://leafletjs.com) it gets even easier. CartoDB.js handles loading all the necessary libraries for you! Just include CartoDB.js and CartoDB.css in the HEAD of your website and you are ready to go! The CartoDB.css document isn’t mandatory. However, if you are making a map and are not familiar with writing your own CSS for the various needed elements, it can help you jumpstart the process. Using Leaflet is as simple as adding the main JavaScript library:

```html
<link rel="stylesheet" href="http://libs.cartocdn.com/cartodb.js/v3/3.15/themes/css/cartodb.css" />
<script src="http://libs.cartocdn.com/cartodb.js/v3/3.15/cartodb.js"></script>
```

---

## HTTPS support

You can use all the functionality of CartoDB.js with HTTPs support. Be sure to use https when importing both the JS library and the CSS file. You will also need to use HTTPs in the Viz.JSON URL you pass to **createVis**.

```html
<div id="map"></div>

<link rel="stylesheet" href="https://cartodb-libs.global.ssl.fastly.net/cartodb.js/v3/3.15/themes/css/cartodb.css" />
<script src="https://cartodb-libs.global.ssl.fastly.net/cartodb.js/v3/3.15/cartodb.js"></script>

<script>
  var map = new L.Map('map', {
    center: [0,0],
    zoom: 2
  })
  cartodb.createLayer(map, 'https://examples.carto.com/api/v1/viz/15589/viz.json', { https: true })
    .addTo(map)
    .on('error', function(err) {
      alert("some error occurred: " + err);
    });
</script>
```

---

## Persistent version hosting

We are committed to making sure your website works as intended no matter what changes in the future. We may find more efficient or more useful features to add to the library as time progresses. But we never want to break things you have already developed. For this reason, we make versioned CartoDB.js libraries available to you. The way they function will never unexpectedly change on you.

We recommend that you always develop against the most recent version of CartoDB.js:

```html
<script src="http://libs.cartocdn.com/cartodb.js/v3/3.15/cartodb.js"></script>
```

Anytime you wish to push a stable version of your site to the web though, you can find the version of CartoDB.js you are using by looking at the first line of the library or running the following in your code:

```javascript
alert(cartodb.VERSION)
```

Once you know which version of CartoDB.js you're using, you can point your site to that release. If the current version of CartoDB.js is 3.15.8, the URL would be:

```html
<script src="http://libs.cartocdn.com/cartodb.js/v3/3.15.8/cartodb.js"></script>
```

You can do the same for the CSS documents we provide:

```html
<link rel="stylesheet" href="http://libs.cartocdn.com/cartodb.js/v3/3.15.8/themes/css/cartodb.css" />
```

# Core API functionality

In case you are not using Leaflet, or you want to implement your own layer object, CartoDB provides a way to get the tiles url for a layer definition.

If you want to use this functionality, you only need to load cartodb.core.js from our cdn. No CSS is needed:

<div class="code-title">Core API functionallity</div>
```html
<script src="http://libs.cartocdn.com/cartodb.js/v3/3.15/cartodb.core.js"></script>
```

An example using this funcionality can be found in a ModestMaps example: [view live](http://cartodb.github.com/cartodb.js/examples/modestmaps.html) / [source code](https://github.com/CartoDB/cartodb.js/blob/develop/examples/modestmaps.html).

Notice that cartodb.SQL is also included in that JavaScript file

## cartodb.Tiles

### cartodb.Tiles.getTiles(_layerOptions, callback_)

Fetch the tile template for the layer definition.

### Arguments

+ **layerOptions**: the data that defines the layer. It should contain at least user_name and sublayer list. These are the available options:

<div class="code-title">cartodb.Tiles.getTiles</div>
```javascript
{
  user_name: 'mycartodbuser',
  sublayers: [{
    sql: "SELECT * FROM table_name";
    cartocss: '#layer { marker-fill: #F0F0F0; }'
  }],
  maps_api_template: 'https://{user}.cartodb.com' // Optional
}
```

+ **callback(tilesUrl, error)**: a function that recieves the tiles templates. In case of an error, the first param is null and the second one will be an object with an errors attribute that contains the list of errors. The tilesUrl object contains url template for tiles and interactivity grids:

<div class="code-title">cartodb.Tiles.getTiles</div>
```javascript
{
  tiles: [
    "http://{s}.cartodb.com/HASH/{z}/{x}/{y}.png",
    ...
  ],
  grids: [
    // for each sublayer there is one entry on this array
    [
      "http://{s}.cartodb.com/HASH/0/{z}/{x}/{y}.grid.json"
    ],
    [
      "http://{s}.cartodb.com/HASH/1/{z}/{x}/{y}.grid.json"
    ],
    ...
  ]
}
```

### Example

In this example, a layer with one sublayer is created. The sublayer renders all the content from a table.

<div class="code-title">cartodb.Tiles.getTiles</div>
```javascript
var layerData = {
  user_name: 'mycartodbuser',
  sublayers: [{
    sql: "SELECT * FROM table_name";
    cartocss: '#layer { marker-fill: #F0F0F0; }'
  }]
};
cartodb.Tiles.getTiles(layerData, function(tiles, err) {
  if(tiler == null) {
    console.log("error: ", err.errors.join('\n'));
    return;
  }
  console.log("url template is ", tiles.tiles[0]);
}
```

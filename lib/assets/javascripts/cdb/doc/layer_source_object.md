# Layer Source Object

## Standard Layer Source Object (_type: 'cartodb'_)

Used for most maps with tables that are set to public or public with link.

#### Arguments

Layer Source Objects are defined with the [Layergroup Configurations](http://docs.carto.com/carto-engine/maps-api/mapconfig/#layergroup-configurations).

Name |Description
--- | ---
type | A string value that defines the layer type. Required.

options | Options vary, depending on the `type` of layer source you are using:
--- | ---
&#124;_ `mapnik`| See [Mapnik Layer Options](http://docs.carto.com/carto-engine/maps-api/mapconfig/#mapnik-layer-options).
&#124;_ `cartodb` | An alias for Mapnik (for backward compatibility).
&#124;_ `torque` | See [Torque Layer Options](http://docs.carto.com/carto-engine/maps-api/mapconfig/#torque-layer-options).
&#124;_ `http` | See [HTTP Layer Options](http://docs.carto.com/carto-engine/maps-api/mapconfig/#http-layer-options).
&#124;_ `plain` | See [Plain Layer Options](http://docs.carto.com/carto-engine/maps-api/mapconfig/#plain-layer-options).
&#124;_ `named` | See [Named Map Layer Options](http://docs.carto.com/carto-engine/maps-api/mapconfig/#named-map-layer-options).

#### Example

```javascript
{
  user_name: 'your_user_name', // Required
  type: 'cartodb', // Required
  sublayers: [{
    sql: "SELECT * FROM table_name", // Required
    cartocss: '#table_name {marker-fill: #F0F0F0;}', // Required
    interactivity: "column1, column2, ...", // Optional
  },
  {
    sql: "SELECT * FROM table_name", // Required
    cartocss: '#table_name {marker-fill: #F0F0F0;}', // Required
    interactivity: "column1, column2, ...", // Optional
   },
   ...
  ]
}
```
For other layer source definitions, see [this example](https://github.com/CartoDB/cartodb.js/blob/4ba5148638091fd2c194f48b2fa3ed6ac4ecdb23/examples/layer_definition.html).

## Named Maps Layer Source Object (_type: 'namedmap'_)

Used for making public maps with private data. See [Named Maps](http://docs.carto.com/carto-engine/maps-api/named-maps/) for more information.

#### Example

```javascript
{
  user_name: 'your_user_name', // Required
  type: 'namedmap', // Required
  named_map: {
    name: 'name_of_map', // Required
    // Optional
    layers: [{
      layer_name: "sublayer0", // Optional
      interactivity: "column1, column2, ..." // Optional
    },
    {
      layer_name: "sublayer1",
      interactivity: "column1, column2, ..."
    },
      ...
    ],
    // Optional
    params: {
      color: "hex_value",
      num: 2
    }
  }
}
```

## Multiple types of layers Source Object

`cartodb.createLayer` combining multiple types of layers and setting a filter

#### Example

```javascript
cartodb.createLayer(map, {
  user_name: 'examples',
  type: 'cartodb',
  sublayers: [
    {
      type: "http",
      urlTemplate: "http://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png",
      subdomains: [ "a", "b", "c" ]
    },
    {
     sql: 'select * from country_boundaries',
     cartocss: '#layer { polygon-fill: #F00; polygon-opacity: 0.3; line-color: #F00; }'
    },
  ],
}, { filter: ['http', 'mapnik'] })
```

visjson
=======

this is the spec for visjson:
```
  {
     // required
     // follows the http://semver.org/ style version number
     "version": "0.1.0"
   
    // optional
    // default: [0, 0]
    // [lat, lon] where map is placed when is loaded. If bounds is present it is ignored
     "center": [0, 0],
   
    // optional
    // default: 4
    "zoom": 4,

    // optional
    // default: null
    // bounds the map show at the beginning. If center and/or zoom are present
    // they are ignored
    "bounds": [
      [-1, -1], // sw lat, lon
      [ 1,  1]  // ne lat, lon
    ],

    // optional
    // visulization title
    // default: ''
    "title": ""

    // optional
    // visualization description
    // default: ''
    "description": ""

    // optional
    // visualization description
    // default: ''
    url: "http://javi.cartodb.com/tables/20343",

    // mandatory 
    // map provider (gmaps or leaflet)
    map_provider: "googlemaps",

     // optional
     // default: []
     // contains the layers
     "layers": [
      // xyz tiled
      {
       type: "tiled"
       order: 0,
       options: {
          name: "CartoDB Flat Blue",
          urlTemplate: "http://{s}.api.cartocdn.com/base-flatblue/{z}/{x}/{y}.png",
          maxZoom: 10,
          attribution: "©2013 CartoDB <a href='http://cartodb.com' target='_blank'>Terms of use</a>",
         },
       },
       
       // plain color layer
       {
        order: 0,
        type: "background"
        options: {
          color: "#eeeeee",
          image: "",
          maxZoom: 28,
          id: 59811,
        },
       },
       
       // cartodb layer (deprecated)
       {
         type: 'cartodb',
         order: 1,
         options: {
            type: "CartoDB",
            active: true,
            opacity: 0.99,
            interactivity: "cartodb_id",
            debug: false,
            tiler_domain: "cartodb.com",
            tiler_port: "443",
            tiler_protocol: "https",
            sql_domain: "cartodb.com",
            sql_port: "443",
            sql_protocol: "https",
            extra_params: {
                cache_policy: "persist",
                cache_buster: 1364213207314
            },
            cdn_url: "",
            auto_bound: false,
            visible: true,
            style_version: "2.1.1",
            table_name: "counties_ny_export",
            user_name: "javi",
            query_wrapper: null
         },
         infowindow: {
            fields: [{
                name: "fips",
                title: true,
                position: 2
            },
            ...
            ],
            template_name: '...',
            template: 'html template'
         }
       },
       
       // layergroup
       {
         type: 'layergroup',
         order: 1,
         options: {
            type: "CartoDBLayerGroup",
            tiler_domain: "cartodb.com",
            tiler_port: "443",
            tiler_protocol: "https",
            sql_domain: "cartodb.com",
            sql_port: "443",
            sql_protocol: "https",
            user_name: "javi",
            layerdefinition: see https://github.com/Vizzuality/Windshaft/wiki/Multilayer-API
         },
         infowindow: {
            fields: [{
                name: "fips",
                title: true,
                position: 2
            },
            ...
            ],
            template_name: '...',
            template: 'html template'
         }
       },

       // named-map 
       {
         type: 'namedmap',
         order: 1,
         options: {
            type: "named-map",
            tiler_domain: "cartodb.com",
            tiler_port: "443",
            tiler_protocol: "https",
            user_name: "javi",
            require_password: true/false,
            named_map: {
                name: 'test',
                params: {
                    //template params
                    color: '#FFF',
                    other_var: 1
                },
                layers: [{
                    infowindow:
                    legend:
                    }, {...}

                ]
            },
         }
       },
       
       // torque
       {
         type: 'torque',
         order: XX,
         options: {
            stat_tag: "d4a5c7e4-4ad6-11e3-ab17-3085a9a9563c",
            tiler_protocol: "http",
            tiler_domain: "cartodb.com",
            tiler_port: "80",
            cdn_url: {
              http: "api.cartocdn.com",
              https: "cartocdn.global.ssl.fastly.net"
            },
            query: null,
            table_name: "sensor_log_2013_10_27_12_01",
            user_name: "javi", // cartodb username
            cartocss: "valid cartocss",
            named_map: { //if this key is present named_map is used, if not it means it's an anonymous map
                name: 'test',
                layer_index: 1, // layer_index inside named map
                params: {
                    //template params
                    color: '#FFF',
                    other_var: 1
                },
            }
         }
       },
     ],

     overlays: [{
       type: 'zoom',
       template: 'mustache template'
       options: {
         ... other options

       }
     }],
   
  }
```

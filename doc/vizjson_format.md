
visjson
=======

this is the spec for visjson:

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
       {
         type: 'tilejson',
         order: 0,
         options: {
         }
       },
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
       {
         type: 'cartodb_layergroup',
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
       }
     ],

     overlays: [{
       type: 'zoom',
       template: 'mustache template'
       options: {
         ... other options

       }
     }],
   
  }


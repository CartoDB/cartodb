# VizJSON v3

*Status: draft*

```javascript
  {
     // required
     "version": "3.0.0"
   
    // optional (default: [0, 0])
    // [lat, lon] where map is placed when is loaded. It's ignored if bounds attribute is present.
     "center": [0, 0],
   
    // optional (default: 4)
    "zoom": 4,

    // optional (default: null)
    // [[lat, lon], [lat, lon]] The bounds that the map show at the beginning. If center and/or zoom are present
    // they are ignored
    "bounds": [
      [-1, -1], // sw lat, lon
      [ 1,  1]  // ne lat, lon
    ],

    // optional (default: '')
    // visualization title
    "title": ""

    // optional (default: '')
    // visualization description
    "description": ""

    // mandatory, "leaflet" or "googlemaps"
    map_provider: "leaflet",
    
    // mandatory
    legends: true,
    
    // mandatory
    scrollwheel: false,
    
    // optional (default: null)
    user : {
      avatar_url: '<avatar url>',
      fullname: '<user fullname>'
    },
    
    // optional (default: false)
    vector: false,

     // optional (default: [])
     // contains the layers
     "layers": [
      // xyz tiled
      {
       type: "tiled"
       order: 0,
       options: {
          attribution: "© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="http://cartodb.com/attributions#basemaps">CartoDB</a>",
          labels: { url: "http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png" },
          minZoom: 0,
          maxZoom: 10,
          urlTemplate: "http://{s}.api.cartocdn.com/base-flatblue/{z}/{x}/{y}.png"
         },
       },
       
       // plain color layer
       {
        order: 0,
        type: "background"
        options: {
          base_type: "plain",
          className: "plain",
          color: "#eeeeee",
          image: "",
          maxZoom: 32,
          type: "Plain"
        },
       },

       // layergroup
       {
         type: 'layergroup',
         options: {
            attribution: "",
            filter: "mapnik",
            maps_api_template: "http://{user}.localhost.lan:8181",
            sql_api_template: "http://{user}.localhost.lan:8080",
            user_name: "javi",
            layer_definition: see https://github.com/CartoDB/Windshaft/blob/master/doc/Multilayer-API.md
         }
       },

       // named-map 
       {
         type: 'namedmap',
         order: 1,
         options: {
            type: "namedmap",
            user_name: "javi",
            attribution: "",
            filter: "mapnik",
            maps_api_template: "http://{user}.localhost.lan:8181",
            sql_api_template: "http://{user}.localhost.lan:8080",
            named_map: {
                name: 'test',
                stat_tag: "a5c626a0-a29f-11e4-bee0-010c4c326911",
                params: {
                    //template params
                    color: '#FFF',
                    other_var: 1,
                },
                layers: [{
                    infowindow: '',
                    legend: '',
                    layer_name: 'name_of_layer',
                    interactivity: 'column1, column2, ...',
                    visible: true/false
                    }, {...}
                ],
            },
         }
       },
       
       // torque
       {
         type: 'torque',
         order: 1,
         sql: "select * from mytable",
         cartocss: '/** torque visualization */ ...'
         cartocss_version: '2.1.1',
         legend: {
            show_title: false,
            template: "",
            title: "",
            type: "none",
            visible: true
         },
         options: {
            stat_tag: "d4a5c7e4-4ad6-11e3-ab17-3085a9a9563c",
            table_name: "sensor_log_2013_10_27_12_01",
            user_name: "javi",
            visible: true,
            
            named_map: { //if this key is present named_map is used, if not it means it's an anonymous map
                name: 'tpl_test',
                layer_index: 1, // layer_index inside Named Map
                params: {
                    //template params
                    color: '#FFF',
                    other_var: 1
                }
            }
         }
       },
     ],

     // optional (default: [])
     overlays: [{
       type: 'zoom',
       template: 'mustache template'
       options: {
         ... other options
       }
     }],
     
    // mandatory
    datasource: {
      maps_api_template: "http://{user}.localhost.lan:8181",
      stat_tag: "47f329b2-fd5e-11e5-a82a-080027880ca6",
      user_name: "juanignaciosl"
    },
 
     // optional (default: [])
     analyses: [
        {
          id: 'a1',
          type: 'buffer',
          params: { // These params depend on the analysis type
            radio: 3000,
            source: {
              id: 'a0',
              table_name: 'mytable',
              type: 'source',
              params: {
                query: 'select * from mytable',
              }
            }
          }
        }
     ],
     
     // optional (default: [])
     widgets: [
      {
        id: "ecb84086-8ad6-4baf-88ae-b160f67e073b",
        layer_id: "825c1f09-db33-46dc-a60a-3cee7f28fbcf",
        options: { // These options depend on the widget type
          aggregation: "count",
          aggregation_column: "category_t",
          column: "category_t",
          sync_on_bbox_change: true,
          sync_on_data_change: true
        }
        order: 1,
        title: "Category category_t",
        type: "category"
      }
     ]
   
  }
```

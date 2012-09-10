
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
     // default: []
     // contains the layers
     "layers": [
       {
         type: 'tilejson',
         data: {
           // tilejson information. Read tilejson specs
         }
       },
       {
         type: 'cartodb',
         data: {
           // cartodb layer information
         }
       }
     ],
   
     overlays: [{
       type: 'zoom',
       template: 'mustache template'
     }],
   
  }



  //var map = null;
  var markers = [];
  var bounds;
  var geocoder;
  var image;
  var globalZindex = 1;
  var po;
  var map;
  var radius = 10, tips = {};
  var layer;
  var tile_url = 'http://ec2-50-16-103-51.compute-1.amazonaws.com/tiles/{X}/{Y}/{Z}/1/';
  var map_type;

  function initMap() {
    // Map html and events -> mapElements.js
     createMapElements();   
  }



  function showMap() {
    $('div.map_window div.map_curtain').hide();
    $('p.georeferencing').hide();
      
    if (map==null) {
      po = org.polymaps;
      map = po.map()
          .container(document.getElementById('map').appendChild(po.svg('svg')))
          .center({lon: -1.3183, lat: 29.075})
          .zoom(2)
          .zoomRange([1, 20])
          .add(po.drag())
          .add(po.wheel())
          .add(po.dblclick());

          map.add(po.image()
              .url(po.url("http://{S}tile.cloudmade.com"
              + "/1a1b06b230af4efdbb989ea99e9841af"
              + "/998/256/{Z}/{X}/{Y}.png")
              .hosts(["a.", "b.", "c.", ""])));

          layer = po.image().url(po.url(tile_url + table_name + '/'+map_type+'/?sql='+sql+'&style=' + encodeURIComponent(JSON.stringify(style))));
          map.add(layer);
    } else {
      closeMapElements();
      layer.url(po.url(tile_url + table_name + '/'+ map_type +'/?sql='+sql+'&style=' + encodeURIComponent(JSON.stringify(style))));
    }
  }


  function hideMap() {
    $('div.map_window div.map_curtain').show();
  }
  

  
  
  function refreshLayer(_style) {
    layer.url(po.url(tile_url + table_name + '/'+ map_type +'/?sql='+sql+'&style=' + encodeURIComponent(JSON.stringify(_style))));
    layer.reload();
  }

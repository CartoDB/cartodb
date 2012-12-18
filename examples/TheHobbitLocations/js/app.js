var map;

function main() {

  var vis = new cartodb.vis.Vis({ el: $('#map') });

  var options = {
    center: [-42.27730877423707, 172.63916015625],
    zoom: 6
  };

  vis
    .load('http://saleiva.cartodb.com/api/v1/viz/14863/viz.json', options)
    .done(function(vis, layers) {
      // there are two layers, base layer and points layer
      var layer = layers[1];
      layer.setInteractivity(['cartodb_id', 'name_to_display']);

      // remove the zoom overlay (it is added by default)
      vis.getOverlay('zoom').clean();

      // Set the custom infowindow template defined on the html
      layer.infowindow.set('template', $('#infowindow_template').html());

      vis.addOverlay({
        type: 'tooltip',
        template: '<p>{{name_to_display}}</p>'
      });

    });

  /*

  var center = new L.LatLng(-42.27730877423707, 172.63916015625);

  map = L.map('map', { 
    zoomControl: false,
    center: [-42.50247797334869, 173.6993408203125],
    zoom: 6
  })

  // Add the baselayer
  L.tileLayer('http://a.tiles.mapbox.com/v3/cartodb.map-ygd8rje5/{z}/{x}/{y}.png', {
    attribution: 'MapBox'
  }).addTo(map);

  // Create the cartodb layer using the vizjson.
  cartodb.createLayer(map, 'http://saleiva.cartodb.com/api/v1/viz/14863/viz.json', {
    query: 'select * from {{table_name}}',
    interactivity: 'cartodb_id, name_to_display'
  })
  .on('done', function(layer) {
    map.addLayer(layer);

    // Set the custom infowindow template defined on the html
    layer.infowindow.set('template', $('#infowindow_template').html());

    // Defines what to do on the over event
    layer.on('featureOver', function(e, latlng, pos, data) {
      $('#pointTT > p').text(data.name_to_display);
      $('#pointTT').show();
      $('#pointTT').css({
          'left':(pos.x-$('#pointTT').width()/2)+'px',
          'top':(pos.y-30)+'px'
      });
    });

    layer.on('featureOut', function(e, latlng, pos, data) {
      $('#pointTT').hide();
    });

    layer.on('error', function(err) {
      console.log('error: ' + err);
    });

  }).on('error', function() {
    console.log("some error occurred");
  });
  */

}

window.onload = function() {
  cartodb.load('../../src/', function() {
    main();
  });
}

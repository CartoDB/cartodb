var map;

function main() {

  var center = new L.LatLng(-42.27730877423707, 172.63916015625);

  map = L.map('map', { 
    zoomControl: false,
    center: [-42.50247797334869, 173.6993408203125],
    zoom: 6
  })

  // add a nice baselayer from mapbox
  L.tileLayer('http://a.tiles.mapbox.com/v3/cartodb.map-ygd8rje5/{z}/{x}/{y}.png', {
    attribution: 'MapBox'
  }).addTo(map);

  cartodb.createLayer(map, 'http://saleiva.cartodb.com/api/v1/viz/14863/viz.json', {
    query: 'select * from {{table_name}}',
    interactivity: 'cartodb_id, name_to_display'
  })

  .on('done', function(layer) {
    map.addLayer(layer);
    map.setView(center,6);

    layer.infowindow.set('template', $('#infowindow_template').html());

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

}

// you could use $(window).load(main);
window.onload = main;
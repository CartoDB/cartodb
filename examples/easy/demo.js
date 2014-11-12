var layer;

function main() {

  var map = L.map('map', { 
    zoomControl: false,
    center: [0, 0],
    zoom: 3
  });

  // add a nice baselayer from Stamen 
  L.tileLayer('http://a.tiles.mapbox.com/v3/examples.map-20v6611k/{z}/{x}/{y}.png', {
    attribution: 'MapBox'
  }).addTo(map);

  cartodb.createLayer(map, {
    user_name: 'documentation',
    type: 'cartodb',
    sublayers: [{
      sql: "SELECT e.cartodb_id, e.area, w.subregion, w.un, e.the_geom, e.the_geom_webmercator FROM european_countries_e e LEFT JOIN world_borders w ON e.iso_2_code = w.iso2",
      cartocss: "#layer{ line-color: #FFF; line-opacity: 1; line-width: 1; polygon-opacity: 0.8; } #european_countries_e [ area <= 1638094.0] { polygon-fill: #B10026; } #european_countries_e [ area <= 34895.0] { polygon-fill: #E31A1C; } #european_countries_e [ area <= 24193.0] { polygon-fill: #FC4E2A; } #european_countries_e [ area <= 10025.0] { polygon-fill: #FD8D3C; } #european_countries_e [ area <= 6889.0] { polygon-fill: #FEB24C; } #european_countries_e [ area <= 4808.0] { polygon-fill: #FED976; } #european_countries_e [ area <= 3288.0] { polygon-fill: #FFFFB2; }",
      interactivity: "cartodb_id"
    }]
  })
    .addTo(map)
    .on('done', function(lyr) {

      cdb.vis.Vis.addInfowindow(map, lyr.getSubLayer(0), ['cartodb_id', 'subregion', 'un'])

    }).on('error', function() {
      console.log("some error occurred");
    });
}

window.onload = main;
// var $ = require('jquery');
// var CartoDBLayerGMaps = require('../../../../src/geo/gmaps/cartodb-layer-gmaps');

// describe('CartoDBLayerGMaps: Hide funcionality', function() {
//   var div, map, cdb_layer;

//   beforeEach(function() {
//     div = document.createElement('div');
//     div.setAttribute("id","map");
//     div.style.height = "100px";
//     div.style.width = "100px";

//     map = new google.maps.Map(div, {
//       center: new google.maps.LatLng(51.505, -0.09),
//       disableDefaultUI: false,
//       zoom: 13,
//       mapTypeId: google.maps.MapTypeId.ROADMAP,
//       mapTypeControl: false
//     });

//     cdb_layer = new CartoDBLayerGMaps({
//       map: map,
//       user_name:"examples",
//       tile_style: 'test',
//       table_name: 'earthquakes',
//       query: "SELECT * FROM {{table_name}}",
//       tile_style: "#{{table_name}}{marker-fill:#E25B5B}",
//       opacity:0.8,
//       interactivity: "cartodb_id, magnitude",
//       featureOver: function(ev,latlng,pos,data) {},
//       featureOut: function() {},
//       featureClick: function(ev,latlng,pos,data) {},
//       debug: true
//     });

//     map.overlayMapTypes.setAt(0, cdb_layer);

//   });


//   it('if hides layers should work', function(done) {

//     setTimeout(function () {
//       cdb_layer.hide();

//       setTimeout(function() {
//         var $tile = $(div).find("img[gtilekey]").first()
//           , opacity = cdb_layer.options.opacity
//           , before_opacity = cdb_layer.options.previous_opacity;

//         expect(cdb_layer.visible).toBeFalsy();
//         expect($tile.css("opacity")).toEqual('0');
//         expect(opacity).toEqual(0);
//         expect(before_opacity).not.toEqual(0);
//         done();
//       }, 500);
//     }, 500);
//   });

//   it('If sets opacity to 0, layer should be visible', function(done) {
//     setTimeout(function () {
//       cdb_layer.setOpacity(0);
//       expect(cdb_layer.options.visible).toBeTruthy();
//       done();
//     }, 500);
//   });

//   it('toggle layer from a visible state should work', function(done) {

//     setTimeout(function () {
//       cdb_layer.hide();
//       visibility = cdb_layer.toggle();

//       setTimeout(function() {
//         var $tile = $(div).find("img[gtilekey]").first()
//           , opacity = cdb_layer.options.opacity;

//         expect(visibility).toBeTruthy();
//         expect(cdb_layer.visible).toBeTruthy();
//         expect($tile.css("opacity")).toEqual('0.99');
//         expect(opacity).toEqual(0.99);
//         done();
//       }, 500);

//     }, 500);
//   });

// });

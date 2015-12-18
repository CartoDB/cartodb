// var $ = require('jquery');
// var CartoDBLayerGMaps = require('../../../../src/geo/gmaps/cartodb-layer-gmaps');

// describe('CartoDBLayerGMaps: Show funcionality', function() {
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


//   it('If layer is visible, show shouldn\'t do anything', function(done) {
//     setTimeout(function () {
//       expect(cdb_layer.show).toThrow();
//       var opacity = cdb_layer.options.opacity;
//       expect(cdb_layer.options.visible).toBeTruthy();
//       done();
//     }, 500);
//   });

//   it('Shows layer after hide it', function(done) {
//     setTimeout(function () {
//       cdb_layer.hide();
//       cdb_layer.show();
//       expect(cdb_layer.options.visible).toBeTruthy();
//       done();
//     }, 500);
//   });

//   it('If hides layer and set an opacity greater than 0, layer shouln\'t be visible', function(done) {
//     setTimeout(function () {
//       cdb_layer.hide();
//       cdb_layer.setOpacity(0.2);
//       expect(cdb_layer.visible).toBeFalsy();
//       done();
//     }, 500);
//   });

//   it('toggle layer from hidden state should work', function(done) {

//     setTimeout(function () {
//       cdb_layer.show();
//       visibility = cdb_layer.toggle();

//       setTimeout(function() {
//         var $tile = $(div).find("img[gtilekey]").first()
//           , opacity = cdb_layer.options.opacity
//           , before_opacity = cdb_layer.options.previous_opacity;

//         expect(cdb_layer.visible).toBeFalsy();
//         expect(visibility).toBeFalsy();
//         expect($tile.css("opacity")).toEqual('0');
//         expect(opacity).toEqual(0);
//         expect(before_opacity).not.toEqual(0);
//         done();
//       }, 500);

//     }, 500);
//   });
// });

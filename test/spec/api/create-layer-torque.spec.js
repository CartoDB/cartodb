// var $ = require('jquery');
// var L = cdb.L;

// describe('api/create-layer (torque)', function() {
//   describe('loadLayer leaflet', function() {
//     loadLayerSpecs(function() {
//       return L.map($('<div>')[0]).setView([0, 0], 3);
//     });
//   });

//   describe('loadLayer gmaps', function() {
//     loadLayerSpecs(function() {
//       return new google.maps.Map($('<div>')[0],{
//         zoom: 3,
//         center: new google.maps.LatLng(0, 0),
//         mapTypeId: google.maps.MapTypeId.ROADMAP
//       });
//     });
//   });

//   //
//   // shared specs for each map
//   //
//   function loadLayerSpecs(mapFn) {

//     describe("(shared)", function() {
//       var map;
//       beforeEach(function() {
//         map = mapFn();
//         cartodb.torque = torque;
//       });

//       afterEach(function() {
//         delete cartodb.torque;
//       });

//       it("should load specified layer", function(done) {
//         var layer;
//         var s = jasmine.createSpy('createLayer');
//         cdb.createLayer(map, {
//           updated_at: 'jaja',
//           layers: [
//             null,
//             {kind: 'cartodb', options: { user_name: 'test', table_name: 'test', tile_style: 'test'}, infowindow: null },
//             {kind: 'torque', options: { user_name: 'test', table_name: 'test', tile_style: 'Map{ -torque-frame-count: 10; }#test { marker-width: 10; }'}, infowindow: null }
//           ]
//         }, { layerIndex: 2 }, s).done(function(lyr) {
//           layer = lyr;
//         });

//         setTimeout(function() {
//           expect(s).toHaveBeenCalled();
//           // check it's a torque layer and not a cartodb one
//           expect(layer.model.get('type')).toEqual('torque');
//           done();
//         }, 500);
//       });

//       it("should load the `torque` layer by default", function(done) {
//         var layer;

//         cdb.createLayer(map, {
//           updated_at: 'jaja',
//           layers: [
//             { type: 'tiled', options: {} },
//             { type: 'tiled', options: {} },
//             {
//               type: 'torque',
//               options: {
//                 'torque-steps': 3
//               }
//             }
//           ]
//         }).done(function(lyr) {
//           layer = lyr;
//         });

//         setTimeout(function() {
//           expect(layer).toBeDefined();
//           expect(layer.type).toEqual('torque');
//           done();
//         }, 0);
//       });

//       it("should add a torque layer", function(done) {
//         var layer;
//         var s = jasmine.createSpy('createLayer');

//         cdb.createLayer(map, {
//           updated_at: 'jaja',
//           layers: [
//             null,
//             {kind: 'cartodb', options: { user_name: 'test', table_name: 'test', tile_style: 'test'}, infowindow: null },
//             {kind: 'torque', options: { user_name: 'test', table_name: 'test', tile_style: 'Map { -torque-frame-count: 10;} #test { marker-width: 10; }'}, infowindow: null }
//           ]
//         }, { layerIndex: 2 }, s).done(function(lyr) {
//           layer = lyr;
//         }).addTo(map)

//         var wait = 500;
//         if (!map.getContainer) wait = 2500;

//         setTimeout(function() {
//           if (map.getContainer) expect($(map.getContainer()).find('.cartodb-timeslider').length).toBe(1)
//           if (map.getDiv)       expect($(map.getDiv()).find('.cartodb-timeslider').length).toBe(1)
//           done()
//         }, wait);
//       });

//       it("should ask for https data when https is on at torque layer", function(done) {
//         var layer;
//         var s = jasmine.createSpy('createLayer');

//         cdb.createLayer(map, {
//           updated_at: 'jaja',
//           layers: [
//             null,
//             {kind: 'cartodb', options: { user_name: 'test', table_name: 'test', tile_style: 'test'}, infowindow: null },
//             {kind: 'torque', options: { user_name: 'test', table_name: 'test', tile_style: 'Map { -torque-frame-count: 10;} #test { marker-width: 10; }'}, infowindow: null }
//           ]
//         }, { layerIndex: 2, https: true }, s).done(function(lyr) {
//           layer = lyr;

//         }).addTo(map)

//         var wait = 500;
//         if (!map.getContainer) wait = 2500;

//         setTimeout(function() {
//           expect(layer.provider.options.tiler_protocol).toBe("https");
//           done()
//         }, wait);
//       });

//       it("should not add a torque layer timeslider if steps are not greater than 1", function(done) {
//         var layer;
//         var s = jasmine.createSpy('createLayer');

//         cdb.createLayer(map, {
//           updated_at: 'jaja',
//           layers: [
//             null,
//             {kind: 'cartodb', options: { user_name: 'test', table_name: 'test', tile_style: 'test'}, infowindow: null },
//             {kind: 'torque', options: { user_name: 'test', table_name: 'test', tile_style: 'Map { -torque-frame-count: 1;} #test { marker-width: 10; }'}, infowindow: null }
//           ]
//         }, { layerIndex: 2 }, s).done(function(lyr) {
//           layer = lyr;
//         }).addTo(map)

//         var wait = 500;
//         if (!map.getContainer) wait = 2500;

//         setTimeout(function() {
//           if (map.getContainer) expect($(map.getContainer()).find('.cartodb-timeslider').length).toBe(0)
//           if (map.getDiv)       expect($(map.getDiv()).find('.cartodb-timeslider').length).toBe(0)
//           done()
//         }, wait);
//       });

//       it("should add cartodb logo with torque layer although it is not defined", function(done) {
//         var layer;
//         var s = jasmine.createSpy('createLayer');

//         cdb.createLayer(map, {
//           updated_at: 'jaja',
//           layers: [
//             null,
//             {kind: 'cartodb', options: { user_name: 'test', table_name: 'test', tile_style: 'test'}, infowindow: null },
//             {kind: 'torque', options: { user_name: 'test', table_name: 'test', tile_style: 'Map{ -torque-frame-count: 10;}#test { marker-width: 10; }'}, infowindow: null }
//           ]
//         }, { layerIndex: 2 }, s).done(function(lyr) {
//           layer = lyr;
//         }).addTo(map)

//         var wait = 500;
//         if (!map.getContainer) wait = 2500;

//         setTimeout(function() {
//           expect(layer.options.cartodb_logo).toEqual(undefined);
//           if (map.getContainer) expect($(map.getContainer()).find('.cartodb-logo').length).toBe(1)
//           if (map.getDiv)       expect($(map.getDiv()).find('.cartodb-logo').length).toBe(1)
//           done();
//         }, wait);
//       });

//       it("should create a named map", function(done) {
//         var layer;

//         cdb.createLayer(map, {
//           type: 'namedmap',
//           user_name: 'dev',
//           options: {
//             named_map: {
//               name: 'testing',
//               params: {
//                 color: 'red'
//               }
//             }
//           }
//         }).done(function(lyr) {
//           layer = lyr;
//         });

//         setTimeout(function() {
//           expect(layer).not.toEqual(undefined);
//           expect(layer.toJSON()).toEqual({ color: 'red' });
//           done();
//         }, 100);
//       });

//       it("should use access_token", function(done) {
//         cdb.createLayer(map, {
//           type: 'namedmap',
//           user_name: 'dev',
//           options: {
//             named_map: {
//               name: 'testing',
//               params: {
//                 color: 'red'
//               }
//             }
//           }
//         }, { https: true,  auth_token: 'at_rambo' }).done(function(layer) {
//           spyOn(layer, 'createMap').and.returnValue({
//             layergroupid: 'test',
//             metadata: {
//               layers: []
//             }
//           })
//           layer.getTiles(function(tiles) {
//             expect(tiles.tiles[0].indexOf("auth_token=at_rambo")).not.toEqual(-1);
//           });
//           done();
//         });
//       });

//       it("should create a layer from the list of sublayers", function(done) {
//         var layer;

//         cdb.createLayer(map, {
//           type: 'cartodb',
//           sublayers: [{
//             sql: 'select * from table',
//             cartocss: 'test',
//             interactivity: 'testi'
//           }]
//         }).done(function(lyr) {
//           layer = lyr;
//         });

//         setTimeout(function() {
//           expect(layer).not.toEqual(undefined);
//           expect(layer.toJSON()).toEqual({
//             version: '1.3.0',
//             stat_tag: 'API',
//             layers: [{
//               type: 'cartodb',
//               options: {
//                 sql: 'select * from table',
//                 cartocss: 'test',
//                 cartocss_version: '2.1.0',
//                 interactivity: ['testi']
//               }
//             }]
//           });
//           done();
//         }, 100);
//       });

//       it("should return a promise that responds to addTo", function(done) {
//         var layer;

//         cdb.createLayer(map, {
//           type: 'cartodb',
//           sublayers: [{
//             sql: 'select * from table',
//             cartocss: 'test',
//             interactivity: 'testi'
//           }]
//         })
//         .addTo(map)
//         .done(function(lyr) {
//           layer = lyr;
//         });

//         setTimeout(function() {
//           expect(layer).not.toEqual(undefined);
//           if(map.overlayMapTypes) {
//             expect(layer).toBe(map.overlayMapTypes.getAt(0));
//           } else {
//             expect(layer).toBe(map._layers[L.stamp(layer)]);
//           }
//           done();
//         }, 100);

//       });
//     });
//   }

// });

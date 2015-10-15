// // TODO:
// //  - Make sure all params are sent (stat_tag, auth_token)
// //  - Stack requests to instantiateMap
// //  - Add profiling (cartodb.core.Profiler.metric)
// //  - Accept reqwest as an ajax client
// //  - Accept an instantiateCallback
// //  - caching of get requests (cache option to $.ajax)
// //  - client.instantiateMap returns an instance of cdb.windshaft.PublicMap or
// //    cdb.windshaft.PrivateMap
// describe('cdb.windshaft.Client', function() {

//   describe('.instantiateMap', function() {

//     var ajax, ajaxParams, client, mapDefinition;

//     beforeEach(function() {
//       ajax = function(params) {
//         ajaxParams = params;
//         params.success({});
//       }

//       mapDefinition = {
//         toJSON: function() {
//           return {
//             a: 1
//           };
//         }
//       };
//     })

//     describe('GET request', function() {

//       it('should use a GET request', function(done) {
//         var client = new cdb.windshaft.Client({
//           ajax: ajax,
//           user_name: 'wadus',
//           maps_api_template: 'http://{user}.cartodb.com:80',
//           stat_tag: '123456789'
//         });

//         client.instantiateMap(mapDefinition, function(map) {
//           expect(ajaxParams.dataType).toEqual('jsonp');
//           expect(ajaxParams.type).toBeUndefined(); // GET request
//           expect(ajaxParams.url).toEqual('http://wadus.cartodb.com:80/api/v1/map?stat_tag=123456789&config=%7B%22a%22%3A1%7D');
//           expect(ajaxParams.jsonpCallback().indexOf('_cdbc_')).toEqual(0);
//           expect(ajaxParams.cache).toEqual(true);

//           expect(map).toBeDefined();
//           done();
//         })
//       })

//       describe('compression', function() {

//         it("should compress the map definition using LZMA and the browser's btoa function", function(done) {
//           var client = new cdb.windshaft.Client({
//             ajax: ajax,
//             user_name: 'wadus',
//             maps_api_template: 'http://{user}.cartodb.com:80',
//             stat_tag: '123456789',
//             force_compress: true
//           });

//           spyOn(window, "btoa");

//           var payload = JSON.stringify({ config: JSON.stringify(mapDefinition.toJSON()) });
//           LZMA.compress(payload, 3, function(encoded) {
//             lzma = cdb.core.util.array2hex(encoded);
//             client.instantiateMap(mapDefinition, function(map) {
//               expect(window.btoa.calls.count()).toEqual(2);
//               expect(window.btoa.calls.mostRecent().args.length).toEqual(1);
//               expect(ajaxParams.url.indexOf('lzma=' + lzma)).not.toEqual(-1);
//               done();
//             })
//           })
//         });

//         it("should compress the map definition using LZMA and cdb.core.util.encodeBase64", function(done) {
//           var client = new cdb.windshaft.Client({
//             ajax: ajax,
//             user_name: 'wadus',
//             maps_api_template: 'http://{user}.cartodb.com:80',
//             stat_tag: '123456789',
//             force_compress: true
//           });

//           var _btoa = window.btoa;
//           window.btoa = undefined;

//           spyOn(cdb.core.util, "encodeBase64");

//           var payload = JSON.stringify({ config: JSON.stringify(mapDefinition.toJSON()) });
//           LZMA.compress(payload, 3, function(encoded) {
//             lzma = cdb.core.util.array2hex(encoded);
//             client.instantiateMap(mapDefinition, function(map) {
//               expect(cdb.core.util.encodeBase64.calls.count()).toEqual(2);
//               expect(cdb.core.util.encodeBase64.calls.mostRecent().args.length).toEqual(1);
//               expect(ajaxParams.url.indexOf('lzma=' + lzma)).not.toEqual(-1);

//               window.btoa = _btoa;

//               done();
//             })
//           });
//         });
//       });

//       it('should handle errors returned by the tiler', function(done) {
//         ajax = function(params) {
//           ajaxParams = params;
//           params.success({ errors: ['Error!'] });
//         };

//         var client = new cdb.windshaft.Client({
//           ajax: ajax,
//           user_name: 'wadus',
//           maps_api_template: 'http://{user}.cartodb.com:80',
//           stat_tag: '123456789'
//         });

//         client.instantiateMap(mapDefinition, function(map, error) {
//           expect(map).toBeNull();
//           expect(error.errors).toEqual([ 'Error!' ]);
//           done();
//         });
//       })

//       it('should handle ajax errors', function(done) {
//         var ajaxParams;
//         var ajax = function(params) {
//           ajaxParams = params;
//           params.error('Error!');
//         };

//         var client = new cdb.windshaft.Client({
//           ajax: ajax,
//           user_name: 'wadus',
//           maps_api_template: 'http://{user}.cartodb.com:80',
//           stat_tag: '123456789'
//         });

//         client.instantiateMap(mapDefinition, function(map, error) {
//           expect(map).toBeNull();
//           expect(error.errors).toEqual([ 'Unknown error' ]);
//           done();
//         });
//       })
//     })

//     describe('POST request', function() {

//       var longMapDefinition = {
//         toJSON: function() {
//           var data = { a: '' };
//           for (var i = 0; i < cdb.windshaft.Client.MAX_GET_SIZE + 10; i++) {
//             data.a += '0';
//           }
//           return data;
//         }
//       }

//       it('should use a POST request when serialized mapDefinition is longer than max GET size', function(done) {
//         var client = new cdb.windshaft.Client({
//           ajax: ajax,
//           user_name: 'wadus',
//           maps_api_template: 'http://{user}.cartodb.com:80',
//           stat_tag: '123456789'
//         });

//         client.instantiateMap(longMapDefinition, function(map) {
//           expect(ajaxParams.crossOrigin).toEqual(true);
//           expect(ajaxParams.type).toEqual('POST'); // POST request
//           expect(ajaxParams.method).toEqual('POST'); // POST request
//           expect(ajaxParams.dataType).toEqual('json');
//           expect(ajaxParams.contentType).toEqual('application/json');
//           expect(ajaxParams.url).toEqual('http://wadus.cartodb.com:80/api/v1/map?stat_tag=123456789');
//           expect(ajaxParams.data).toEqual(JSON.stringify(longMapDefinition.toJSON()));

//           expect(map).toBeDefined();
//           done();
//         })
//       })

//       it('should use a POST request when CORS is available and forcing CORS', function(done) {
//         cdb.core.util.isCORSSupported = function() {
//           return true;
//         }

//         mapDefinition = {
//           toJSON: function() {
//             return { a: 'wadus' };
//           }
//         }

//         var client = new cdb.windshaft.Client({
//           ajax: ajax,
//           user_name: 'wadus',
//           maps_api_template: 'http://{user}.cartodb.com:80',
//           stat_tag: '123456789',
//           force_cors: true
//         });

//         client.instantiateMap(mapDefinition, function(map) {
//           expect(ajaxParams.crossOrigin).toEqual(true);
//           expect(ajaxParams.type).toEqual('POST'); // POST request
//           expect(ajaxParams.method).toEqual('POST'); // POST request
//           expect(ajaxParams.dataType).toEqual('json');
//           expect(ajaxParams.contentType).toEqual('application/json');
//           expect(ajaxParams.url).toEqual('http://wadus.cartodb.com:80/api/v1/map?stat_tag=123456789');
//           expect(ajaxParams.data).toEqual(JSON.stringify(mapDefinition.toJSON()));

//           expect(map).toBeDefined();
//           done();
//         })
//       })

//       it('should handle errors returned by the tiler', function(done) {
//         ajax = function(params) {
//           ajaxParams = params;
//           params.success({ errors: ['Error!'] });
//         };

//         var client = new cdb.windshaft.Client({
//           ajax: ajax,
//           user_name: 'wadus',
//           maps_api_template: 'http://{user}.cartodb.com:80',
//           stat_tag: '123456789'
//         });

//         client.instantiateMap(longMapDefinition, function(map, error) {
//           expect(map).toBeNull();
//           expect(error.errors).toEqual([ 'Error!' ]);
//           done();
//         });
//       })

//       it('should handle ajax errors', function(done) {
//         var ajaxParams;
//         var ajax = function(params) {
//           ajaxParams = params;
//           params.error('Error!');
//         };

//         var client = new cdb.windshaft.Client({
//           ajax: ajax,
//           user_name: 'wadus',
//           maps_api_template: 'http://{user}.cartodb.com:80',
//           stat_tag: '123456789'
//         });

//         client.instantiateMap(longMapDefinition, function(map, error) {
//           expect(map).toBeNull();
//           expect(error.errors).toEqual([ 'Unknown error' ]);
//           done();
//         });
//       })
//     })
//   })
// })
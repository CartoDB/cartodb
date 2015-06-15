describe('MapProperties', function() {

  describe('.getMapId', function() {
    it('returns the id of the map', function() {
      var mapProperties = new MapProperties( { layergroupid: 'wadus' });
      expect(mapProperties.getMapId()).toEqual('wadus');
    })
  });

  describe('.getLayerIndexByType', function() {

    it('returns the index of a layer of a given type', function() {
      var layers = [
        { type: 'mapnik' },
        { type: 'http' },
        { type: 'mapnik' }
      ]
      var mapProperties = new MapProperties({
        metadata: {
          layers: layers
        }
      });
      expect(mapProperties.getLayerIndexByType(0, 'mapnik')).toEqual(0);
      expect(mapProperties.getLayerIndexByType(1, 'mapnik')).toEqual(2);
      expect(mapProperties.getLayerIndexByType(0, 'http')).toEqual(1);
      expect(mapProperties.getLayerIndexByType(10, 'http')).toEqual(-1);
    })
  })
})

describe("LayerDefinition", function() {

  var layerDefinition;

  beforeEach(function(){
    var layer_definition = {
      version: '1.0.0',
      stat_tag: 'vis_id',
      layers: [
        {
          type: 'cartodb',
          options: {
            sql: 'select * from ne_10m_populated_places_simple',
            cartocss: '#layer { marker-fill: red; }',
            interactivity: ['test', 'cartodb_id']
          }
        },
        {
          type: 'cartodb',
          options: {
            sql: "select * from european_countries_export",
            cartocss: '#layer { polygon-fill: #000; polygon-opacity: 0.8;}',
            cartocss_version : '2.0.0',
            interactivity: ['       test2    ', 'cartodb_id2']
          }
        }
      ]
    };
    layerDefinition = new LayerDefinition(layer_definition, {
      tiler_domain: "cartodb.com",
      tiler_port: "8081",
      tiler_protocol: "http",
      user_name: 'rambo',
      no_cdn: true,
      subdomains: [null]
    });
  });

  describe('.removeLayer', function() {

    it("should remove a layer", function() {
      layerDefinition.removeLayer(0);
      expect(layerDefinition.getLayerCount()).toEqual(1);
      expect(layerDefinition.getLayer(0)).toEqual({
         type: 'cartodb', 
         options: {
           sql: "select * from european_countries_export",
           cartocss: '#layer { polygon-fill: #000; polygon-opacity: 0.8;}',
           cartocss_version: '2.0.0',
           interactivity: ['       test2    ', 'cartodb_id2']
         }
      });
    });
  });

  describe('.addLayer', function() {

    it("should add a layer", function() {
      layerDefinition.addLayer({ sql : 'b', cartocss: 'b'});
      expect(layerDefinition.getLayerCount()).toEqual(3);

      expect(layerDefinition.getLayer(2).type).toEqual('cartodb')
      expect(layerDefinition.getLayer(2).options).toEqual({
        sql: 'b',
        cartocss: 'b'
      });

      layerDefinition.addLayer({ sql : 'a', cartocss: 'a'}, 0);

      expect(layerDefinition.getLayer(0).type).toEqual('cartodb');
      expect(layerDefinition.getLayer(0).options).toEqual({
        sql: "a",
       cartocss: 'a'
      });
    });

    it('should add cartodb layers by default or the specified type', function() {
      layerDefinition.addLayer({ sql : 'b', cartocss: 'b'});

      expect(layerDefinition.getLayer(2).type).toEqual('cartodb')

      layerDefinition.addLayer({ type: 'http', urlTemplate: 'urlTemplate' });

      expect(layerDefinition.getLayer(3).type).toEqual('http');
    });

    it('should mark the definition as updated', function() {
      spyOn(layerDefinition, '_definitionUpdated');

      layerDefinition.addLayer({ sql : 'b', cartocss: 'b'});

      expect(layerDefinition._definitionUpdated).toHaveBeenCalled();
    });

    it("shouldn't add the layer and throw an error if is not valid (missing required attributes)", function() {
      var layerCount = layerDefinition.getLayerCount();

      expect(function() {
        layerDefinition.addLayer({
          sql : 'b'
        });
      }).toThrow('Layer definition should contain all the required attributes');

      // Layer has not been added
      expect(layerDefinition.getLayerCount()).toEqual(layerCount);
    });

    it("shouldn't mark the definition as updated if layer is not valid", function() {
      spyOn(layerDefinition, '_definitionUpdated');

      expect(function() {
        layerDefinition.addLayer({
          sql : 'b'
        });
      }).toThrow('Layer definition should contain all the required attributes');

      expect(layerDefinition._definitionUpdated).not.toHaveBeenCalled();
    });
  });

  describe('.getLayerCount', function() {

    it('should return the number of layers in the definition', function() {
      expect(layerDefinition.getLayerCount()).toEqual(2);
    });
  });

  describe("getTooltipData", function() {

    it ('should return tooltip data if tooltip is present and has fields', function() {
      layerDefinition.layers = [{
        tooltip: {
          fields: ['wadus']
        }
      }];

      var tooltip = layerDefinition.getTooltipData(0);
      expect(tooltip).toEqual({ fields: ['wadus'] });
    });

    it ('should return NULL if tooltip is not present or does NOT have fields', function() {
      layerDefinition.layers = [{
        tooltip: {}
      }];

      var tooltip = layerDefinition.getTooltipData(0);
      expect(tooltip).toBeNull()

      layerDefinition.layers = [{
        tooltip: {
          fields: []
        }
      }];

      var tooltip = layerDefinition.getTooltipData(0);
      expect(tooltip).toBeNull()
    });
  })

  describe('.toJSON', function() {

    it("should return json spec of visible layers", function() {
      expect(layerDefinition.toJSON()).toEqual({
        version: '1.0.0',
        stat_tag: 'vis_id',
        layers: [
          {
            type: 'cartodb', 
            options: {
              sql: 'select * from ne_10m_populated_places_simple',
              cartocss: '#layer { marker-fill: red; }',
              cartocss_version: '2.1.0',
              interactivity: ['test', 'cartodb_id']
            }
          },
          {
            type: 'cartodb', 
            options: {
              sql: "select * from european_countries_export",
              cartocss: '#layer { polygon-fill: #000; polygon-opacity: 0.8;}',
              cartocss_version: '2.0.0',
              interactivity: ['test2', 'cartodb_id2']
            }
          }
        ]
      });
    });

    it("should not include hidden layers", function() {
      layerDefinition.getSubLayer(0).hide();

      expect(layerDefinition.toJSON()).toEqual({
        version: '1.0.0',
        stat_tag: 'vis_id',
        layers: [{
           type: 'cartodb', 
           options: {
             sql: "select * from european_countries_export",
             cartocss: '#layer { polygon-fill: #000; polygon-opacity: 0.8;}',
             cartocss_version: '2.0.0',
             interactivity: ['test2', 'cartodb_id2']
           }
         }
        ]
      });
    });
  });

  describe('.getLayerNumberByIndex, getLayerIndexByNumber', function() {

    it("should manage layer index with hidden layers", function() {
      expect(layerDefinition.getLayerNumberByIndex(0)).toEqual(0);
      expect(layerDefinition.getLayerNumberByIndex(1)).toEqual(1);

      expect(layerDefinition.getLayerIndexByNumber(0)).toEqual(0);
      expect(layerDefinition.getLayerIndexByNumber(1)).toEqual(1);

      layerDefinition.getSubLayer(0).hide();
      expect(layerDefinition.getLayerNumberByIndex(0)).toEqual(1);
      expect(layerDefinition.getLayerNumberByIndex(1)).toEqual(-1);

      expect(layerDefinition.getLayerIndexByNumber(1)).toEqual(0);
    });
  });

  describe("sublayers", function() {

    describe('.getSubLayer', function() {

      it("should return the sublayer at the specified position", function() {
        var sublayer = layerDefinition.getSubLayer(0);
        expect(sublayer instanceof CartoDBSubLayer).toEqual(true);
        expect(sublayer.getSQL()).toEqual('select * from ne_10m_populated_places_simple');
        expect(sublayer.getCartoCSS()).toEqual('#layer { marker-fill: red; }');
      });
    });

    describe('.getSubLayerCount', function() {

      it("should return the number of sublayers", function() {
        expect(layerDefinition.getSubLayerCount()).toEqual(2);
        var sub = layerDefinition.createSubLayer({
          sql: 'select * from table',
          cartocss: 'test',
          interactivity: 'test'
        });
        expect(layerDefinition.getSubLayerCount()).toEqual(3);
        sub.remove();
        expect(layerDefinition.getSubLayerCount()).toEqual(2);
      });
    });

    it("hide should remove interaction", function() {
      var interaction =  layerDefinition.interactionEnabled = {}
      layerDefinition.setInteraction = function(layer, value) {
        layerDefinition.interactionEnabled[layer] = value;
      };
      layerDefinition.getSubLayer(0).setInteraction(true);
      expect(interaction[0]).toEqual(true);
      layerDefinition.getSubLayer(0).hide();
      expect(interaction[0]).toEqual(false);
      layerDefinition.getSubLayer(0).show();
      expect(interaction[0]).toEqual(true);
      layerDefinition.getSubLayer(1).hide();
      layerDefinition.getSubLayer(1).show();
      expect(interaction[1]).toEqual(undefined);
    });

    it("should be the same object for the same sublayer", function() {
      expect(layerDefinition.getSubLayer(0)).toBe(layerDefinition.getSubLayer(0));
    });
  });

  describe('.setInteractivity', function() {

    it("should set interactivity", function() {
      layerDefinition.setInteractivity(1, ['cartodb_id', 'rambo   ']);
      expect(layerDefinition.getLayer(1).options.interactivity).toEqual(['cartodb_id','rambo']);
      layerDefinition.setInteractivity(['cartodb_id', 'john']);
      expect(layerDefinition.getLayer(0).options.interactivity).toEqual(['cartodb_id', 'john']);
      expect(layerDefinition.toJSON().layers[0].options.interactivity).toEqual(['cartodb_id', 'john']);
    });
  });

  describe('.getLayerToken', function() {

    it("should return null token when there are no visible layers", function(done) {
      layerDefinition.getSubLayer(0).hide();
      layerDefinition.getSubLayer(1).hide();
      var tk = 'test'
      layerDefinition.getLayerToken(function(a) {
        tk =  a;
      })

      setTimeout(function() {
        expect(tk).toEqual(null);
        done();
      }, 100);
    });

    it("should use jsonp when request is less than 2kb", function(done) {
      var params;
      layerDefinition.options.ajax = function(p) { 
        params = p;
        p.success({ layergroupid: 'test' });
      };

      layerDefinition.getLayerToken();
      setTimeout(function() {
        expect(params.dataType).toEqual('jsonp');
        done();
      }, 100)
    });

    it("should use not use compression for small layergroups", function(done) {
      layerDefinition.options.cors = false;
      layerDefinition.options.api_key = 'test';
      layerDefinition.options.ajax = function(p) { 
        params = p;
        p.success({ layergroupid: 'test' });
      };

      layerDefinition.getLayerToken();

      setTimeout(function() {
        expect(params.url.indexOf('config') !== -1).toEqual(true);
        done();
      }, 100);
    });

    it("should return values for the latest query", function(done) {
      tokens = [];
      layerDefinition.options.ajax = function(p) { 
        layerDefinition.getLayerToken(function(a) {
          tokens.push(a);
        });
        layerDefinition.options.ajax = function(p) { 
          p.success({ layergroupid: 'test2' });
        }
        p.success({ layergroupid: 'test' });
      };

      layerDefinition.getLayerToken(function(a) {
        tokens.push(a);
      });
      layerDefinition.getLayerToken(function(a) {
        tokens.push(a);
      });

      setTimeout(function() {
        expect(tokens.length).toEqual(3);
        expect(tokens[0]).toEqual(tokens[1]);
        expect(tokens[0]).toEqual(tokens[2]);
        expect(tokens[0].layergroupid).toEqual('test2');
        done();
      }, 1000);
    });

    it("should include stat_tag", function(done) {
      var params, lzma;
      layerDefinition.options.cors = false;
      layerDefinition.options.ajax = function(p) { 
        params = p;
        p.success({ layergroupid: 'test' });
      };
      layerDefinition.getLayerToken(function() {
      });

      setTimeout(function() {
        expect(params.url.indexOf("stat_tag=vis_id")).not.toEqual(-1)
        done();
      }, 300);
    });

    it("should use jsonp when cors is not available", function(done) {
      var params, lzma;
      layerDefinition.options.cors = false;
      layerDefinition.options.api_key = 'test';
      layerDefinition.options.force_compress = true;
      layerDefinition.options.ajax = function(p) { 
        params = p;
        p.success({ layergroupid: 'test' });
      };

      var json = layerDefinition.toJSON();
      json = JSON.stringify({ config: JSON.stringify(json) });
      LZMA.compress(json, 3, function(encoded) {
        lzma = cdb.core.util.array2hex(encoded);
        layerDefinition.getLayerToken(function() {
        });
      });

      setTimeout(function() {
        expect(params.url).toEqual(layerDefinition._tilerHost() + '/api/v1/map?map_key=test&stat_tag=vis_id&lzma=' + encodeURIComponent(lzma));
        done();
      }, 600);
    });

    it("should add api_key", function() {
      var url = null;
      layerDefinition.options.cors = true;
      layerDefinition.options.compressor = function(data, level, call) {
        call("config=" + data);
      }
      layerDefinition.options.ajax = function(p) { 
        url = p.url;
        p.success({ layergroupid: 'test' });
      };

      layerDefinition.options.api_key = 'key';
      layerDefinition._getLayerToken();
      expect(url.indexOf('map_key=key')).not.toEqual(-1);

      layerDefinition.options.map_key = 'key2';
      delete layerDefinition.options.api_key
      layerDefinition._getLayerToken();
      expect(url.indexOf('map_key=key2')).not.toEqual(-1);

      delete layerDefinition.options.map_key
      layerDefinition.options.extra_params = {}
      layerDefinition.options.extra_params.map_key = 'key4';
      layerDefinition._getLayerToken();
      expect(url.indexOf('map_key=key4')).not.toEqual(-1);

      layerDefinition.options.extra_params = {}
      layerDefinition.options.extra_params.api_key = 'key4';
      layerDefinition._getLayerToken();
      expect(url.indexOf('map_key=key4')).not.toEqual(-1);
    });

    it("should use a GET request to get the token", function(done) {
      var layer = layerDefinition.getSubLayer(0);

      spyOn(layerDefinition, '_requestGET').and.callThrough();
      spyOn(layerDefinition, '_requestPOST').and.callThrough();

      var query = "SELECT * FROM RAMBO_CHARLIES where area < 1000";
      layer.setSQL(query);
      layerDefinition.getLayerToken();

      setTimeout(function(){
        expect(layerDefinition._requestGET).toHaveBeenCalled();
        expect(layerDefinition._requestPOST).not.toHaveBeenCalled();
        done();
      }, 100);
    });

    it("should use a POST request to get the token", function(done) {
      var layer = layerDefinition.getSubLayer(0);

      spyOn(layerDefinition, '_requestGET').and.callThrough();
      spyOn(layerDefinition, '_requestPOST').and.callThrough();

      var query = "select 1 ";
      for (var i = 0; i < 1600; i++){
        query += ", " + Math.floor(Math.random() * 100) + 1;
      }
      query += ', * from rambo_charlies where area > 10';
      layer.setSQL(query);
      layerDefinition.getLayerToken();

      setTimeout(function(){
        expect(layerDefinition._requestGET).not.toHaveBeenCalled();
        expect(layerDefinition._requestPOST).toHaveBeenCalled();
        done();
      }, 100);
    });

  });

  describe('.getTiles', function() {

    it("should fetch the map properties and invoke the callback with URLs for tiles and grids", function() {
      var mapProperties = {
        "layergroupid": "layergroupid",
        "metadata": {
          "layers": [
            { "type": "mapnik", "meta": {} },
            { "type": "mapnik", "meta": {} }
          ]
        }
      }

      var expectedURLs = {
        "tiles": [
          "http://rambo.cartodb.com:8081/api/v1/map/layergroupid/0,1/{z}/{x}/{y}.png"
        ],
        "grids": [
          [ "http://rambo.cartodb.com:8081/api/v1/map/layergroupid/0/{z}/{x}/{y}.grid.json" ],
          [ "http://rambo.cartodb.com:8081/api/v1/map/layergroupid/1/{z}/{x}/{y}.grid.json" ]
        ]
      }

      var callback = jasmine.createSpy("callback");
      layerDefinition.getLayerToken = function (callback) {
        callback(mapProperties);
      }
      spyOn(layerDefinition, "getLayerToken").and.callThrough();

      layerDefinition.getTiles(callback);

      expect(layerDefinition.getLayerToken).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(expectedURLs);
    });

    it("should only fetch the map properties if they were already fetched and the definition is valid", function() {
      var mapProperties = {
        "layergroupid": "layergroupid",
        "metadata": {
          "layers": [
            { "type": "mapnik", "meta": {} },
            { "type": "mapnik", "meta": {} }
          ]
        }
      }
      var expectedURLs = {
        "tiles": [
          "http://rambo.cartodb.com:8081/api/v1/map/layergroupid/0,1/{z}/{x}/{y}.png"
        ],
        "grids": [
          [ "http://rambo.cartodb.com:8081/api/v1/map/layergroupid/0/{z}/{x}/{y}.grid.json" ],
          [ "http://rambo.cartodb.com:8081/api/v1/map/layergroupid/1/{z}/{x}/{y}.grid.json" ]
        ]
      }

      var callback = jasmine.createSpy("callback");
      layerDefinition.getLayerToken = function (callback) {
        callback(mapProperties);
      }
      spyOn(layerDefinition, "getLayerToken").and.callThrough();

      layerDefinition.getTiles(callback);

      expect(layerDefinition.getLayerToken).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(expectedURLs);

      // Reset spies
      callback.calls.reset();
      layerDefinition.getLayerToken.calls.reset();

      // Invoke the method again -> It should have cached the map properties
      layerDefinition.getTiles(callback);

      expect(layerDefinition.getLayerToken).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(expectedURLs);

      // Reset spies
      callback.calls.reset();
      layerDefinition.getLayerToken.calls.reset();

      // Invalidate the definition and try again -> It should query again
      layerDefinition.invalidate();
      layerDefinition.getTiles(callback);

      expect(layerDefinition.getLayerToken).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(expectedURLs);
    });

    it("should invoke the callback with URLs for tiles and grids (for mapnik layers ONLY)", function() {
      var mapProperties = {
        "layergroupid": "layergroupid",
        "metadata": {
          "layers": [
            { "type": "http", "meta": {} },
            { "type": "mapnik", "meta": {} },
            { "type": "mapnik", "meta": {} }
          ]
        }
      }

      // LayerDefinition contains two mapnik layers (0 and 1), but the tiler contains:
      // 0 - http
      // 1 - mapnik
      // 2 - mapnik
      // We need to fetch the grid for layers 1 and 2. Those are the indexes that the tiler understands.
      var expectedGridURLs = [
        [ "http://rambo.cartodb.com:8081/api/v1/map/layergroupid/1/{z}/{x}/{y}.grid.json" ],
        [ "http://rambo.cartodb.com:8081/api/v1/map/layergroupid/2/{z}/{x}/{y}.grid.json" ]
      ]

      var callback = jasmine.createSpy("callback");
      layerDefinition.getLayerToken = function (callback) {
        callback(mapProperties);
      }
      spyOn(layerDefinition, "getLayerToken").and.callThrough();

      layerDefinition.getTiles(callback);

      expect(layerDefinition.getLayerToken).toHaveBeenCalled();
      var actualGridURLs = callback.calls.mostRecent().args[0].grids;
      expect(callback).toHaveBeenCalled();
      expect(actualGridURLs).toEqual(expectedGridURLs);
    });

    it("should include extra params", function() {

      var mapProperties = {
        "layergroupid": "layergroupid",
        "metadata": {
          "layers": [
            { "type": "mapnik", "meta": {} },
            { "type": "mapnik", "meta": {} }
          ]
        }
      }

      layerDefinition.options.extra_params = {
        'map_key': 'testapikey',
        'should_not': 'included'
      }

      spyOn(layerDefinition, 'getLayerToken').and.callFake(function(callback) {
        callback(mapProperties);
      })

      layerDefinition.getTiles(function(tiles) {
        expect(tiles.tiles[0].indexOf('map_key=testapikey')).not.toEqual(-1)
        expect(tiles.tiles[0].indexOf('should_not')).toEqual(-1)
      });
    });

    it("should cache the mapProperties", function() {
      var mapProperties = {
        layergroupid: 'test',
        metadata: { layers: [] },
        cdn_url: {
          http: 'cdn.test.com',
          https:'cdn.testhttps.com'
        }
      }
      spyOn(layerDefinition, 'getLayerToken').and.callFake(function(callback) {
        callback(mapProperties);
      })

      // Request tiles for the first time
      layerDefinition.getTiles();

      expect(layerDefinition.getLayerToken).toHaveBeenCalled();
      expect(layerDefinition.mapProperties.getMapId()).toEqual('test');

      // Reset calls to layerDefinition.getLayerToken
      layerDefinition.getLayerToken.calls.reset();

      // Request tiles again
      layerDefinition.getTiles();

      // We already have mapProperties so we don't need to request them again
      expect(layerDefinition.getLayerToken).not.toHaveBeenCalled();
      expect(layerDefinition.mapProperties.getMapId()).toEqual('test');
    });

    it("should use empty gif there there is no layers", function(done) {
      layerDefinition.getSubLayer(0).hide();
      layerDefinition.getSubLayer(1).hide();
      layerDefinition.getLayerToken = function (callback) {
        callback(null);
      }

      layerDefinition.getTiles(function(t) {
        urls = t;
      })

      setTimeout(function() {
        expect(urls.tiles[0]).toEqual(MapBase.EMPTY_GIF);
        done();
      }, 100)
    });

    it("should set refresh timer after being updated", function(done) {

      var mapProperties = {
        "layergroupid": "layergroupid",
        "metadata": {
          "layers": [
            { "type": "mapnik", "meta": {} },
            { "type": "mapnik", "meta": {} }
          ]
        }
      }

      layerDefinition.options.refreshTime = 10;
      layerDefinition.options.ajax = function(p) {
        params = p;
        p.success(mapProperties);
      };

      layerDefinition.getTiles(function(tiles) {});

      spyOn(layerDefinition,'invalidate');

      setTimeout(function() {
        expect(layerDefinition.invalidate).toHaveBeenCalled();
        done();
      }, 200);
    });
  });

  describe('.fetchAttributes', function() {
    var callback;

    beforeEach(function() {
      callback = jasmine.createSpy("callback");
    })

    it('should fetch the attributes and invoke the callback', function() {
      var mapProperties = {
        "layergroupid": "layergroupid",
        "metadata": {
          "layers": [
            { "type": "mapnik", "meta": {} },
            { "type": "mapnik", "meta": {} }
          ]
        }
      }

      layerDefinition.getLayerToken = function (callback) {
        callback(mapProperties);
      }

      // Fetch the map properties first
      layerDefinition.getTiles();

      var ajax = layerDefinition.options.ajax = jasmine.createSpy('ajax');
      var callback = jasmine.createSpy('callback');

      layerDefinition.fetchAttributes(0, 'feature_id', 2, callback);

      // Ajax request to the right endpoint with right attributes
      expect(ajax).toHaveBeenCalled();
      var ajaxOptions = ajax.calls.mostRecent().args[0];
      expect(ajaxOptions.dataType).toEqual('jsonp');
      expect(ajaxOptions.jsonpCallback).toEqual('_cdbi_layer_attributes_' + layerDefinition._attrCallbackName);
      expect(ajaxOptions.url).toEqual('http://rambo.cartodb.com:8081/api/v1/map/layergroupid/0/attributes/feature_id');
      expect(ajaxOptions.cache).toEqual(true);

      // Ajax succeeds
      ajaxOptions.success('wadus');

      expect(callback).toHaveBeenCalledWith('wadus');
    })

    it('should convert layergroup indexes to the corresponding indexes in the tiler', function() {
      var mapProperties = {
        "layergroupid": "layergroupid",
        "metadata": {
          "layers": [
            { "type": "http", "meta": {} },
            { "type": "mapnik", "meta": {} },
            { "type": "http", "meta": {} },
            { "type": "mapnik", "meta": {} }
          ]
        }
      }

      layerDefinition.getLayerToken = function (callback) {
        callback(mapProperties);
      }

      // Fetch the map properties first
      layerDefinition.getTiles();

      var ajax = layerDefinition.options.ajax = jasmine.createSpy('ajax');

      // Fetch attributes for layer 0 (which is layer 1 in the tiler)
      layerDefinition.fetchAttributes(0, 'feature_id', 2, callback);

      var expectedUrl = 'http://rambo.cartodb.com:8081/api/v1/map/layergroupid/1/attributes/feature_id';
      var actualUrl = ajax.calls.mostRecent().args[0].url;

      expect(actualUrl).toEqual(expectedUrl);

      // Fetch attributes for layer 1 (which is layer 3 in the tiler)
      layerDefinition.fetchAttributes(1, 'feature_id', 2, callback);

      var expectedUrl = 'http://rambo.cartodb.com:8081/api/v1/map/layergroupid/3/attributes/feature_id';
      var actualUrl = ajax.calls.mostRecent().args[0].url;

      expect(actualUrl).toEqual(expectedUrl);
    })
  })

  describe('._buildMapsApiTemplate, ._host', function() {

    it("should use the tiler url when there's explicitly empty cdn defined", function() {
      layerDefinition.options.cdn_url = {
        http: "", https: ""
      };

      expect(layerDefinition._host()).toEqual('http://rambo.cartodb.com:8081');
      expect(layerDefinition._host('0')).toEqual('http://rambo.cartodb.com:8081');

      layerDefinition.options.tiler_protocol = "https";
      layerDefinition._buildMapsApiTemplate(layerDefinition.options);

      expect(layerDefinition._host()).toEqual('https://rambo.cartodb.com:8081');
      expect(layerDefinition._host('a')).toEqual('https://rambo.cartodb.com:8081');
    });

    it("should use the tiler url when there's explicitly no cdn", function() {
      layerDefinition.options.cdn_url = undefined;

      expect(layerDefinition._host()).toEqual('http://rambo.cartodb.com:8081');
      expect(layerDefinition._host('0')).toEqual('http://rambo.cartodb.com:8081');

      layerDefinition.options.tiler_protocol = "https";
      layerDefinition._buildMapsApiTemplate(layerDefinition.options);

      expect(layerDefinition._host()).toEqual('https://rambo.cartodb.com:8081');
      expect(layerDefinition._host('a')).toEqual('https://rambo.cartodb.com:8081');
    });

    it("should use cdn_url from tiler when present", function(done) {
      var params;
      delete layerDefinition.options.no_cdn;
      layerDefinition.options.ajax = function(p) { 
        params = p;
        p.success({ layergroupid: 'test', metadata: { layers: [] }, cdn_url: { http: 'cdn.test.com', https:'cdn.testhttps.com' }});
      };

      layerDefinition.getTiles();

      setTimeout(function() {
        expect(layerDefinition._host()).toEqual('http://cdn.test.com/rambo');

        setTimeout(function() {
          layerDefinition.options.tiler_protocol = 'https';
          layerDefinition._buildMapsApiTemplate(layerDefinition.options);
          layerDefinition.getTiles();

          setTimeout(function() {
            expect(layerDefinition._host()).toEqual('https://cdn.testhttps.com/rambo');
            done();
          }, 100)

        }, 200);

      }, 100);
    });
  });

  describe('._layerGroupTiles', function() {

    var mapProperties;

    beforeEach(function() {
      mapProperties = new MapProperties({
        "layergroupid": "test_layer",
        "metadata": {
          "layers": [
            {
              "type": "mapnik",
              "meta": {}
            },
            {
              "type": "torque",
              "meta": {
                "start": 1000,
                "end": 246000,
                "data_steps": 246,
                "column_type": "number"
              }
            },
            {
              "type": "http",
              "meta": {}
            }
          ],
          "torque": {
            "1": {
              "start": 1000,
              "end": 246000,
              "data_steps": 246,
              "column_type": "number"
            }
          }
        }
      })
    })

    it("should generate url for tiles", function() {
      var tiles = layerDefinition._layerGroupTiles(mapProperties);
      expect(tiles.tiles.length).toEqual(1);
      expect(tiles.grids.length).toEqual(2);
      expect(tiles.grids[0].length).toEqual(1);
      expect(tiles.grids[0][0]).toEqual('http://rambo.cartodb.com:8081/api/v1/map/test_layer/0/{z}/{x}/{y}.grid.json');
    });

    it('should generate url for tiles and only include non-torque layers', function() {
      var tiles = layerDefinition._layerGroupTiles(mapProperties);
      // Layers in the metadata are: 0 (mapnik), 1 (torque), 2 (http) -> Only 0 and 2 are part of the URL
      expect(tiles.tiles).toEqual([ 'http://rambo.cartodb.com:8081/api/v1/map/test_layer/0,2/{z}/{x}/{y}.png' ]);
    })

    it('should filter layers if a filter has been specified', function() {
      layerDefinition.options.filter = undefined;

      var tiles = layerDefinition._layerGroupTiles(mapProperties);
      expect(tiles.tiles).toEqual([ 'http://rambo.cartodb.com:8081/api/v1/map/test_layer/0,2/{z}/{x}/{y}.png' ]);

      layerDefinition.options.filter = "http";
      tiles = layerDefinition._layerGroupTiles(mapProperties);
      expect(tiles.tiles).toEqual([ 'http://rambo.cartodb.com:8081/api/v1/map/test_layer/2/{z}/{x}/{y}.png' ]);

      layerDefinition.options.filter = "mapnik";
      tiles = layerDefinition._layerGroupTiles(mapProperties);
      expect(tiles.tiles).toEqual([ 'http://rambo.cartodb.com:8081/api/v1/map/test_layer/0/{z}/{x}/{y}.png' ]);

      layerDefinition.options.filter = ["http", "mapnik"];
      tiles = layerDefinition._layerGroupTiles(mapProperties);
      expect(tiles.tiles).toEqual([ 'http://rambo.cartodb.com:8081/api/v1/map/test_layer/0,2/{z}/{x}/{y}.png' ]);

      // Filter doesn't mach any valid type -> Render empty gifs
      layerDefinition.options.filter = "wadus";

      var tiles = layerDefinition._layerGroupTiles(mapProperties);
      expect(tiles.tiles).toEqual([ MapBase.EMPTY_GIF ]);
      expect(tiles.grids).toEqual([]);
    })

    it("should generate url for tiles with params", function() {
      var tiles = layerDefinition._layerGroupTiles(mapProperties, {
        api_key: 'api_key_test',
        updated_at: '1234'
      });
      expect(tiles.tiles[0]).toEqual('http://rambo.cartodb.com:8081/api/v1/map/test_layer/0,2/{z}/{x}/{y}.png?api_key=api_key_test&updated_at=1234');
      expect(tiles.grids[0][0]).toEqual('http://rambo.cartodb.com:8081/api/v1/map/test_layer/0/{z}/{x}/{y}.grid.json?api_key=api_key_test&updated_at=1234');
    });

    it("should generate url for tiles using a cdn", function() {
      layerDefinition.options.no_cdn = false;
      layerDefinition.options.cdn_url = { http: "api.cartocdn.com" }
      layerDefinition.options.subdomains = ['a', 'b', 'c', 'd'];

      var tiles = layerDefinition._layerGroupTiles(mapProperties);
      expect(tiles.tiles[0]).toEqual('http://a.api.cartocdn.com/rambo/api/v1/map/test_layer/0,2/{z}/{x}/{y}.png');
      expect(tiles.tiles[1]).toEqual('http://b.api.cartocdn.com/rambo/api/v1/map/test_layer/0,2/{z}/{x}/{y}.png');
      expect(tiles.grids[0][0]).toEqual('http://a.api.cartocdn.com/rambo/api/v1/map/test_layer/0/{z}/{x}/{y}.grid.json');
      expect(tiles.grids[0][1]).toEqual('http://b.api.cartocdn.com/rambo/api/v1/map/test_layer/0/{z}/{x}/{y}.grid.json');
    });

    it("should generate url for tiles without a cdn when cdn_url is empty", function() {
      layerDefinition.options.no_cdn = false;
      layerDefinition.options.subdomains = ['a', 'b', 'c', 'd'];
      var tiles = layerDefinition._layerGroupTiles(mapProperties);
      expect(tiles.tiles[0]).toEqual('http://rambo.cartodb.com:8081/api/v1/map/test_layer/0,2/{z}/{x}/{y}.png');
      expect(tiles.tiles[1]).toEqual('http://rambo.cartodb.com:8081/api/v1/map/test_layer/0,2/{z}/{x}/{y}.png');
      expect(tiles.grids[0][0]).toEqual('http://rambo.cartodb.com:8081/api/v1/map/test_layer/0/{z}/{x}/{y}.grid.json');
      expect(tiles.grids[0][1]).toEqual('http://rambo.cartodb.com:8081/api/v1/map/test_layer/0/{z}/{x}/{y}.grid.json');
    });
  });

  describe('.invalidate', function() {

    it('should clear the mapProperties and urls', function() {
      layerDefinition.mapProperties = 'test';
      layerDefinition.urls = ['test'];

      layerDefinition.invalidate();

      expect(layerDefinition.mapProperties).toEqual(null);
      expect(layerDefinition.urls).toEqual(null);
    });
  });

  describe('LayerDefinition.layerDefFromSubLayers', function() {

    it("should generate layerdef", function() {
      var layerDef = LayerDefinition.layerDefFromSubLayers([{
        sql: 'test',
        cartocss:'test'
      }]);

      expect(layerDef).toEqual({
        version: '1.3.0',
        stat_tag: 'API',
        layers: [{
          type: 'cartodb',
          options: {
            sql: 'test',
            cartocss:'test',
            cartocss_version: '2.1.0'
          }
        }]
      });
    });

    it("should return the right type of layers", function() {
      var layerDef = LayerDefinition.layerDefFromSubLayers([{
        type: 'http',
        urlTemplate: 'urlTemplate'
      }]);

      expect(layerDef).toEqual({
        version: '1.3.0',
        stat_tag: 'API',
        layers: [{
          type: 'http',
          options: {
            urlTemplate: 'urlTemplate'
          }
        }]
      });
    });
  });
});

describe("NamedMap", function() {
  var namedMap, named_map;

  beforeEach(function() {
    named_map = {
      name: 'testing',
      params: {
        color: 'red'
      },
      layers: [{
          infowindow: {
            fields: [ { title:'test', value:true, position:0, index:0 } ]
          }
      }]
    };
    namedMap= new NamedMap(named_map, {
      tiler_domain:   "cartodb.com",
      tiler_port:     "8081",
      tiler_protocol: "http",
      user_name: 'rambo',
      no_cdn: true,
      subdomains: [null]
    });
  });

  it("should include instanciation callback", function(done) {
    namedMap = new NamedMap(named_map, {
      tiler_domain:   "cartodb.com",
      tiler_port:     "8081",
      tiler_protocol: "https",
      user_name: 'rambo',
      no_cdn: true,
      subdomains: [null],
      instanciateCallback: 'testing'

    });
    namedMap.options.ajax = function(p) { 
      params = p;
      p.success({ layergroupid: 'test', metadata: { layers: [] } });
    };

    namedMap._getLayerToken();
    namedMap.getTiles(function(t) {
      tiles = t;
    });

    setTimeout(function() {
      expect(params.jsonpCallback).toEqual('testing');
      expect(params.cache).toEqual(true);
      done();
    }, 100);
  })

  it("should instance named_map with no layers", function(done) {
    var named_map = {
      name: 'testing'
    };
    var nm = new NamedMap(named_map, {
      tiler_domain:   "cartodb.com",
      tiler_port:     "8081",
      tiler_protocol: "http",
      user_name: 'rambo',
      no_cdn: true,
      subdomains: [null]
    });
    var params;
    nm.options.ajax = function(p) { 
      params = p;
      p.success({ layergroupid: 'test' });
    };

    nm._getLayerToken();

    setTimeout(function() {
      expect(params.dataType).toEqual('jsonp');
      done();
    }, 100);
  });

  it("should instance named_map", function(done) {
    var params;
    namedMap.options.ajax = function(p) { 
      params = p;
      p.success({ layergroupid: 'test' });
    };

    namedMap._getLayerToken();

    setTimeout(function() {
      expect(params.dataType).toEqual('jsonp');
      expect(params.url).toEqual('http://rambo.cartodb.com:8081/api/v1/map/named/testing/jsonp?config=' + encodeURIComponent(JSON.stringify({ color: 'red', layer0: 1})));
      done();
    }, 100);
  });

  it("should instance named_map using POST", function(done) {
    var params;
    namedMap.options.cors = true;
    namedMap.options.force_cors =true;
    namedMap.options.ajax = function(p) { 
      params = p;
      p.success({ layergroupid: 'test' });
    };

    namedMap._getLayerToken();

    setTimeout(function() {
      expect(params.type).toEqual('POST');
      expect(params.dataType).toEqual('json');
      expect(params.url).toEqual('http://rambo.cartodb.com:8081/api/v1/map/named/testing')
      expect(params.data).toEqual(JSON.stringify({color: 'red', layer0: 1}));
      done();
    }, 100);
  });

  it("shoud have infowindow", function() {
    expect(namedMap.containInfowindow()).toEqual(true);
  });

  describe('.fetchAttributes', function() {
    var callback;

    beforeEach(function() {
      callback = jasmine.createSpy("callback");
    })

    it('should fetch the attributes and invoke the callback', function() {
      var mapProperties = {
        "layergroupid": "layergroupid",
        "metadata": {
          "layers": [
            { "type": "mapnik", "meta": {} },
            { "type": "mapnik", "meta": {} }
          ]
        }
      }

      namedMap.getLayerToken = function (callback) {
        callback(mapProperties);
      }

      // Fetch the map properties first
      namedMap.getTiles();

      var ajax = namedMap.options.ajax = jasmine.createSpy('ajax');
      var callback = jasmine.createSpy('callback');

      namedMap.fetchAttributes(0, 'feature_id', 2, callback);

      // Ajax request to the right endpoint with right attributes
      expect(ajax).toHaveBeenCalled();
      var ajaxOptions = ajax.calls.mostRecent().args[0];
      expect(ajaxOptions.dataType).toEqual('jsonp');
      expect(ajaxOptions.jsonpCallback).toEqual('_cdbi_layer_attributes_' + namedMap._attrCallbackName);
      expect(ajaxOptions.url).toEqual('http://rambo.cartodb.com:8081/api/v1/map/layergroupid/0/attributes/feature_id');
      expect(ajaxOptions.cache).toEqual(true);

      // Ajax succeeds
      ajaxOptions.success('wadus');

      expect(callback).toHaveBeenCalledWith('wadus');
    })

    it('should fetch attributes using an auth_token', function() {
      var mapProperties = {
        "layergroupid": "layergroupid",
        "metadata": {
          "layers": [
            { "type": "mapnik", "meta": {} },
            { "type": "mapnik", "meta": {} }
          ]
        }
      }

      namedMap.getLayerToken = function (callback) {
        callback(mapProperties);
      }

      namedMap.options.extra_params = {
        auth_token: 'token'
      }

      // Fetch the map properties first
      namedMap.getTiles();

      var ajax = namedMap.options.ajax = jasmine.createSpy('ajax');
      namedMap.fetchAttributes(0, 'feature_id', 2, callback);

      // Ajax request to the right endpoint with right attributes
      expect(ajax).toHaveBeenCalled();
      var ajaxOptions = ajax.calls.mostRecent().args[0];

      var expectedUrl = 'http://rambo.cartodb.com:8081/api/v1/map/layergroupid/0/attributes/feature_id?auth_token=token';
      expect(ajaxOptions.url).toEqual(expectedUrl);
    })

    it('should fetch attributes using multiple auth_tokens', function() {
      var mapProperties = {
        "layergroupid": "layergroupid",
        "metadata": {
          "layers": [
            { "type": "mapnik", "meta": {} },
            { "type": "mapnik", "meta": {} }
          ]
        }
      }

      namedMap.getLayerToken = function (callback) {
        callback(mapProperties);
      }

      namedMap.options.extra_params = {
        auth_token: [ 'token1', 'token2' ]
      }

      // Fetch the map properties first
      namedMap.getTiles();

      var ajax = namedMap.options.ajax = jasmine.createSpy('ajax');
      namedMap.fetchAttributes(0, 'feature_id', 2, callback);

      // Ajax request to the right endpoint with right attributes
      expect(ajax).toHaveBeenCalled();
      var ajaxOptions = ajax.calls.mostRecent().args[0];

      var expectedUrl = 'http://rambo.cartodb.com:8081/api/v1/map/layergroupid/0/attributes/feature_id?auth_token[]=token1&auth_token[]=token2';
      expect(ajaxOptions.url).toEqual(expectedUrl);
    })

    it('should convert layergroup indexes to the corresponding indexes in the tiler', function() {
      var mapProperties = {
        "layergroupid": "layergroupid",
        "metadata": {
          "layers": [
            { "type": "http", "meta": {} },
            { "type": "mapnik", "meta": {} },
            { "type": "http", "meta": {} },
            { "type": "mapnik", "meta": {} }
          ]
        }
      }

      namedMap.getLayerToken = function (callback) {
        callback(mapProperties);
      }

      // Fetch the map properties first
      namedMap.getTiles();

      var ajax = namedMap.options.ajax = jasmine.createSpy('ajax');

      // Fetch attributes for layer 0 (which is layer 1 in the tiler)
      namedMap.fetchAttributes(0, 'feature_id', 2, callback);

      var expectedUrl = 'http://rambo.cartodb.com:8081/api/v1/map/layergroupid/1/attributes/feature_id';
      var actualUrl = ajax.calls.mostRecent().args[0].url;

      expect(actualUrl).toEqual(expectedUrl);

      // Fetch attributes for layer 1 (which is layer 3 in the tiler)
      namedMap.fetchAttributes(1, 'feature_id', 2, callback);

      var expectedUrl = 'http://rambo.cartodb.com:8081/api/v1/map/layergroupid/3/attributes/feature_id';
      var actualUrl = ajax.calls.mostRecent().args[0].url;

      expect(actualUrl).toEqual(expectedUrl);
    })
  })

  it("should get sublayer", function() {
    named_map = {
      name: 'testing',
      params: {
        color: 'red'
      }
    };
    namedMap = new NamedMap(named_map, {})
    expect(namedMap.getSubLayer(0)).not.toEqual(undefined);
  });

  it("should enable/disable layers", function(done) {
    var params;
    namedMap.layers.push({
      options:  {},
        infowindow: {
          fields: [ { title:'test', value:true, position:0, index:0 } ]
        }
    });
    namedMap.options.ajax = function(p) { 
      params = p;
      p.success({ layergroupid: 'test' });
    };

    namedMap.getSubLayer(0).hide();
    namedMap._getLayerToken();

    setTimeout(function() {
      var config ="config=" + encodeURIComponent(JSON.stringify({color: 'red', layer0: 0, layer1: 1}));
      expect(params.url.indexOf(config)).not.toEqual(-1);

      var token = 'test';

      setTimeout(function() {
        namedMap.getSubLayer(1).hide();
        namedMap._getLayerToken(function(d) {
          token = d;
        });

        expect(token).not.toEqual(null);

        setTimeout(function() {
          namedMap.getSubLayer(0).show();
          namedMap._getLayerToken();

          setTimeout(function() {
            var config ="config=" + encodeURIComponent(JSON.stringify({color: 'red', layer0: 1, layer1: 0}));
            expect(params.url.indexOf(config)).not.toEqual(-1);
            done();
          }, 200);

        }, 100);

      }, 100);

    }, 100);
  });

  it("should raise errors when try to set sql or cartocss", function() {
    expect(function() { namedMap.setCartoCSS('test') }).toThrow(new Error("cartocss is read-only in NamedMaps"));
    expect(function() { namedMap.setSQL('sql') }).toThrow(new Error("SQL is read-only in NamedMaps"));

    expect(function() {
      namedMap.getSubLayer(0).set({ 'sql':'test', })
    }).toThrow(new Error("sql is read-only in NamedMaps"));

    expect(function() {
      namedMap.getSubLayer(0).set({ interactivity: 'test1' });
    }).toThrow(new Error("interactivity is read-only in NamedMaps"));

    expect(function() {
      namedMap.getSubLayer(0).setInteractivity('test1');
    }).toThrow(new Error("interactivity is read-only in NamedMaps"));

    expect(function() {
      namedMap.getSubLayer(0).set({ 'hidden': 1 });
    }).not.toThrow();

    expect(function() {
      namedMap.getSubLayer(0).remove();
    }).toThrow(new Error("sublayers are read-only in Named Maps"));
    expect(function() {
      namedMap.createSubLayer();
    }).toThrow(new Error("sublayers are read-only in Named Maps"));
    expect(function() {
      namedMap.addLayer();
    }).toThrow(new Error("sublayers are read-only in Named Maps"));
  });

  it("should raise errors when try to get sql or cartocss", function() {
    expect(function() { namedMap.getCartoCSS('test') }).toThrow(new Error("cartocss can't be accessed in NamedMaps"));
    expect(function() { namedMap.getSQL('sql') }).toThrow(new Error("SQL can't be accessed in NamedMaps"));
  })

  it("should send auth_token when it's provided", function(done) {
    var tiles;
    var named_map = {
      name: 'testing',
      auth_token: 'auth_token_test',
      params: {
        color: 'red'
      },
      layers: [{}]
    };
    namedMap = new NamedMap(named_map, {
      tiler_domain:   "cartodb.com",
      tiler_port:     "8081",
      tiler_protocol: "https",
      user_name: 'rambo',
      no_cdn: true,
      subdomains: [null]
    });

    var mapProperties = {
      "layergroupid": "layergroupid",
      "metadata": {
        "layers": [
          { "type": "mapnik", "meta": {} },
          { "type": "mapnik", "meta": {} }
        ]
      }
    }

    namedMap.options.ajax = function(p) { 
      params = p;
      p.success(mapProperties);
    };

    namedMap._getLayerToken();
    namedMap.getTiles(function(t) {
      tiles = t;
    });

    setTimeout(function() {
      expect(params.url.indexOf('auth_token=auth_token_test')).not.toEqual(-1);
      expect(tiles.tiles[0].indexOf('auth_token=auth_token_test')).not.toEqual(-1);
      expect(tiles.grids[0][0].indexOf('auth_token=auth_token_test')).not.toEqual(-1);

      namedMap.setAuthToken('test2');
      namedMap._getLayerToken();

      setTimeout(function() {
        expect(params.url.indexOf('auth_token=test2')).not.toEqual(-1);

        setTimeout(function() {
          namedMap.setAuthToken(['token1', 'token2']);
          namedMap._getLayerToken();
          namedMap.getTiles(function(t) {
            tiles = t;
          });

          setTimeout(function() {
            expect(params.url.indexOf('auth_token[]=token1')).not.toEqual(-1);
            expect(tiles.tiles[0].indexOf('auth_token[]=token1')).not.toEqual(-1);
            expect(tiles.grids[0][0].indexOf('auth_token[]=token1')).not.toEqual(-1);
            done();
          }, 100);

        }, 100);

      }, 100);

    }, 100);
  });

  it("set param without default param", function(done) {
    var named_map = {
      stat_tag: 'stat_tag_named_map',
      name: 'testing',
      auth_token: 'auth_token_test',
      layers: [{}]
    };
    namedMap = new NamedMap(named_map, {
      tiler_domain:   "cartodb.com",
      tiler_port:     "8081",
      tiler_protocol: "https",
      user_name: 'rambo',
      no_cdn: true,
      subdomains: [null]
    });
    namedMap.options.ajax = function(p) { 
      params = p;
      p.success({ layergroupid: 'test' });
    };
    namedMap.setParams('color', 'red');
    namedMap._getLayerToken();

    setTimeout(function() {
      var config = "config=" + encodeURIComponent(JSON.stringify({color: 'red', layer0: 1}));
      expect(params.url.indexOf(config)).not.toEqual(-1);
      console.log(params.url);
      expect(params.url.indexOf("stat_tag=stat_tag_named_map")).not.toEqual(-1);
      done();
    }, 100);
  });

  it("should add params", function(done) {
    var params;
    namedMap.options.ajax = function(p) { 
      params = p;
      p.success({ layergroupid: 'test' });
    };
    namedMap.named_map.params = { color: 'red' }
    spyOn(namedMap,'onLayerDefinitionUpdated');
    namedMap.setParams('test', 10);

    expect(namedMap.onLayerDefinitionUpdated).toHaveBeenCalled();

    namedMap._getLayerToken();

    setTimeout(function() {
      var config ="config=" + encodeURIComponent(JSON.stringify({color: 'red', test: 10, layer0: 1}));
      console.log(params.url);
      expect(params.url.indexOf(config)).not.toEqual(-1);

      setTimeout(function() {
        namedMap.setParams('color', null);
        namedMap._getLayerToken();

        setTimeout(function() {
          var config ="config=" + encodeURIComponent(JSON.stringify({ test: 10, layer0: 1}));
          console.log(params.url);
          expect(params.url.indexOf(config)).not.toEqual(-1);
          done();
        }, 100);

      }, 100);

    }, 100);
  });

  it("should use https when auth_token is provided", function() {
    var named_map = {
      name: 'testing',
      auth_token: 'auth_token_test',
    };
    try {
      namedMap = new NamedMap(named_map, {
        tiler_domain:   "cartodb.com",
        tiler_port:     "8081",
        tiler_protocol: "http",
        user_name: 'rambo',
        no_cdn: true,
        subdomains: [null]
      });
      expect(0).toBe(1);
    } catch(e) {
      expect(e.message).toEqual("https must be used when map has token authentication");
    }
  });

  it("should return layer by index", function() {
    expect(namedMap.getLayerIndexByNumber(0)).toEqual(0);
    expect(namedMap.getLayerIndexByNumber(1)).toEqual(1);
  });

  it("should throw an error message when there is an error with the namedmaps", function(done) {

    var named_map = {
      stat_tag: 'stat_tag_named_map',
      name: 'testing',
      auth_token: 'auth_token_test'
    };

    namedMap = new NamedMap(named_map, {
      tiler_domain:   "cartodb.com",
      tiler_port:     "8081",
      tiler_protocol: "https",
      user_name: 'rambo',
      no_cdn: true,
      subdomains: [null]
    });

    namedMap.options.ajax = function(p) { 
      params = p;
      p.success({ errors: 'not found' });
    };

    var _data, _error;
    var callb = function (dt,er){
      _data = dt;
      _error = er;
    };

    namedMap.getTiles(callb);

    setTimeout(function() {
      var res = "not found";

      expect(_error.errors).toEqual(res);
      expect(true).toEqual(true);

      done();
    }, 100);

  });

});

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

    it('returns the given index if metadata is empty', function() {
      var mapProperties = new MapProperties({});

      expect(mapProperties.getLayerIndexByType(0, 'mapnik')).toEqual(0);
      expect(mapProperties.getLayerIndexByType(1, 'mapnik')).toEqual(1);
    })
  })

  describe('.getLayerIndexesByType', function() {
    var mapProperties;

    beforeEach(function() {
      var layers = [
        { type: 'mapnik' },
        { type: 'http' },
        { type: 'torque' },
        { type: 'mapnik' }
      ]
      mapProperties = new MapProperties({
        metadata: {
          layers: layers
        }
      });
    })

    it('should return the indexes of all non-torque layers if no types are specified', function() {
      expect(mapProperties.getLayerIndexesByType()).toEqual([0, 1, 3]);
      expect(mapProperties.getLayerIndexesByType('')).toEqual([0, 1, 3]);
      expect(mapProperties.getLayerIndexesByType([])).toEqual([0, 1, 3]);
    })

    it('should return the indexes of the layers of the given types', function() {
      expect(mapProperties.getLayerIndexesByType('mapnik')).toEqual([0, 3]);
      expect(mapProperties.getLayerIndexesByType('http')).toEqual([1]);
      expect(mapProperties.getLayerIndexesByType(['http', 'mapnik'])).toEqual([0, 1, 3]);
    })

    it('returns wadus if metadata is empty', function() {
      mapProperties = new MapProperties({ });
      expect(mapProperties.getLayerIndexesByType()).toBeUndefined();
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
          },
          visible: true
        },
        {
          type: 'cartodb',
          options: {
            sql: "select * from european_countries_export",
            cartocss: '#layer { polygon-fill: #000; polygon-opacity: 0.8;}',
            cartocss_version : '2.0.0',
            interactivity: ['       test2    ', 'cartodb_id2']
          },
          visible: true
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
        },
        visible: true
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

  describe(".getTooltipData", function() {

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
      // Hide layer 0 using sublayer.hide
      layerDefinition.getSubLayer(0).hide();

      // Hide layer 1 updating visible
      layerDefinition.layers[1].visible = false;

      // No layers are present
      expect(layerDefinition.toJSON()).toEqual({
        version: '1.0.0',
        stat_tag: 'vis_id',
        layers: []
      });
    });
  });

  describe('.getLayerNumberByIndex', function() {

    var layers;
    var layer_definition;

    it("should return -1 if there are no layers", function() {
      layer_definition = {
        version: '1.0.0',
        stat_tag: 'vis_id',
        layers: []
      };
      layerDefinition.setLayerDefinition(layer_definition);

      expect(layerDefinition.getLayerNumberByIndex(0)).toEqual(-1);
      expect(layerDefinition.getLayerNumberByIndex(10)).toEqual(-1);
    });

    it("should return -1 if layer is hidden", function() {
      var layer_definition = {
        version: '1.0.0',
        stat_tag: 'vis_id',
        layers: [
          { options: { 'hidden': true } }
        ]
      };

      layerDefinition.setLayerDefinition(layer_definition);

      expect(layerDefinition.getLayerNumberByIndex(0)).toEqual(-1);
    });

    it("should return -1 if layer is not visible", function() {
      var layer_definition = {
        version: '1.0.0',
        stat_tag: 'vis_id',
        layers: [
          { 
            visible: false,
            options: { }
          }
        ]
      };

      layerDefinition.setLayerDefinition(layer_definition);

      expect(layerDefinition.getLayerNumberByIndex(0)).toEqual(-1);
    });

    it("should return 0 if layer is not hidden", function() {
      var layer_definition = {
        version: '1.0.0',
        stat_tag: 'vis_id',
        layers: [
          { options: { 'hidden': false } }
        ]
      };

      layerDefinition.setLayerDefinition(layer_definition);

      expect(layerDefinition.getLayerNumberByIndex(0)).toEqual(0);
    });

    it("should return the index of the layer given the index of visible layers", function() {
      layers = [
        { options: { 'hidden': false } },
        { options: { 'hidden': true } },
        { options: { 'hidden': false } }
      ]
      layer_definition = {
        version: '1.0.0',
        stat_tag: 'vis_id',
        layers: layers
      };

      layerDefinition.setLayerDefinition(layer_definition);

      expect(layerDefinition.getLayerNumberByIndex(0)).toEqual(0);
      expect(layerDefinition.getLayerNumberByIndex(1)).toEqual(2);
      expect(layerDefinition.getLayerNumberByIndex(2)).toEqual(-1);
    });
  });

  describe('.getLayerIndexByNumber', function() {

    var layers;
    var layer_definition;

    it("should return undefined if there are no layers", function() {
      layer_definition = {
        version: '1.0.0',
        stat_tag: 'vis_id',
        layers: []
      };
      layerDefinition.setLayerDefinition(layer_definition);

      expect(layerDefinition.getLayerIndexByNumber(0)).toBeUndefined();
      expect(layerDefinition.getLayerIndexByNumber(2)).toBeUndefined();
    });

    it("should return the index of the visible layer given the index of the layer", function() {
      var layer_definition = {
        version: '1.0.0',
        stat_tag: 'vis_id',
        layers: [
          { options: { 'hidden': true }},
          { options: { 'hidden': false }},
          { options: { 'hidden': true }}
        ]
      };

      layerDefinition.setLayerDefinition(layer_definition);

      expect(layerDefinition.getLayerIndexByNumber(0)).toEqual(0);
      expect(layerDefinition.getLayerIndexByNumber(1)).toEqual(0);
      expect(layerDefinition.getLayerIndexByNumber(2)).toEqual(1);
      expect(layerDefinition.getLayerIndexByNumber(3)).toBeUndefined();
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

  describe('.createMap', function() {

    var ajax, ajaxParams, callback, fakeMapProperties, fakeMapConfig, originalSetTimeout;

    beforeEach(function() {
      ajaxParams = undefined;
      fakeMapProperties = {};
      fakeMapConfig = 'fakeMapConfig';
      layerDefinition.options.ajax = ajax = function(params) {
        ajaxParams = params;
        params.success(fakeMapProperties || {});
      }
      callback = jasmine.createSpy('callback');
      layerDefinition.toJSON = function() {
        return fakeMapConfig;
      };

      // Mock setTimeout that runs functions inmediatly
      originalSetTimeout = jasmine.getGlobal().setTimeout;
      jasmine.getGlobal().setTimeout = function (func, millis) {
        func();
      };
    })

    afterEach(function() {
      jasmine.getGlobal().setTimeout = originalSetTimeout;
    })

    it("should stack requests and invoke the callbacks with the mapProperties returned by the last request", function(done) {
      // Use the native setTimeout for this test
      jasmine.getGlobal().setTimeout = originalSetTimeout;

      var tokens = [];
      var i = 0;
      layerDefinition.options.ajax = function(p) {

        // Override ajax again
        layerDefinition.options.ajax = function(p) { 
          p.success({ layergroupid: 'layergroup_' + ++i });
        }

        // Before the ajax request is done, another request is sent
        layerDefinition.createMap(function(a) {
          tokens.push(a);
        });

        p.success({ layergroupid: 'layergroup_' + ++i });
      };

      layerDefinition.createMap(function(a) {
        tokens.push(a);
      });
      layerDefinition.createMap(function(a) {
        tokens.push(a);
      });

      setTimeout(function() {
        expect(tokens.length).toEqual(3);
        expect(tokens[0]).toEqual({ layergroupid: 'layergroup_2' });
        expect(tokens[1]).toEqual({ layergroupid: 'layergroup_2' });
        expect(tokens[2]).toEqual({ layergroupid: 'layergroup_2' });
        done();
      }, 4);
    });

    it('should not create a map if there are no visible layers', function() {
      for (var i=0; i<layerDefinition.getLayerCount(); i++) {
        layerDefinition.getSubLayer(i).hide();
      }

      layerDefinition.createMap(callback);

      expect(callback).toHaveBeenCalledWith(null, undefined);
      expect(callback.calls.count()).toEqual(1);
      expect(ajaxParams).toBeUndefined();
    })

    it("should create a map if there are no visible layers but it's a named map", function() {
      layerDefinition.named_map = {};

      for (var i=0; i<layerDefinition.getLayerCount(); i++) {
        layerDefinition.getSubLayer(i).hide();
      }

      layerDefinition.createMap(callback);

      expect(callback).toHaveBeenCalledWith(fakeMapProperties, undefined);
      expect(callback.calls.count()).toEqual(1);
      expect(ajaxParams.dataType).toEqual('jsonp');
    })

    describe('params', function() {

      it('should use a map/api key', function() {
        fakeMapConfig = 'mapConfig';

        layerDefinition.options.extra_params = { api_key: 'key' };
        layerDefinition.createMap(callback);

        expect(ajaxParams.url.indexOf('map_key=key')).not.toEqual(-1);
      })

      it('should use a map/api key', function() {
        fakeMapConfig = 'mapConfig';

        layerDefinition.options.extra_params = { map_key: 'key' };
        layerDefinition.createMap(callback);

        expect(ajaxParams.url.indexOf('map_key=key')).not.toEqual(-1);
      })

      it('should use a map/api key', function() {
        fakeMapConfig = 'mapConfig';

        layerDefinition.options.api_key = 'key';
        layerDefinition.createMap(callback);

        expect(ajaxParams.url.indexOf('map_key=key')).not.toEqual(-1);
      })

      it('should use a map/api key', function() {
        fakeMapConfig = 'mapConfig';

        layerDefinition.options.map_key = 'key';
        layerDefinition.createMap(callback);

        expect(ajaxParams.url.indexOf('map_key=key')).not.toEqual(-1);
      })

      it('should use an auth_token', function() {
        fakeMapConfig = 'mapConfig';

        layerDefinition.options.extra_params = { auth_token: 'token' };
        layerDefinition.createMap(callback);

        expect(ajaxParams.url.indexOf('auth_token=token')).not.toEqual(-1);
      })

      it('should multiple auth_token(s)', function() {
        fakeMapConfig = 'mapConfig';

        layerDefinition.options.extra_params = { auth_token: ['token1', 'token2'] };
        layerDefinition.createMap(callback);

        expect(ajaxParams.url.indexOf('auth_token[]=token1&auth_token[]=token2')).not.toEqual(-1);
      })

      it('should use a stat_tag', function() {
        layerDefinition.stat_tag = 'stat_tag';
        layerDefinition.createMap(callback);

        expect(ajaxParams.url.indexOf('stat_tag=stat_tag')).not.toEqual(-1);
      })
    })

    it("should set a refresh timer after creating the map", function() {
      layerDefinition.options.refreshTime = 100;

      spyOn(layerDefinition,'invalidate');

      layerDefinition.createMap(callback);

      expect(layerDefinition.invalidate).toHaveBeenCalled();
    });

    describe('GET request', function() {

      it('should create a map using a GET request', function() {
        fakeMapProperties = {};
        fakeMapConfig = 'mapConfig';

        layerDefinition.createMap(callback);

        expect(callback).toHaveBeenCalledWith(fakeMapProperties, undefined);
        expect(callback.calls.count()).toEqual(1);
        expect(ajaxParams.dataType).toEqual('jsonp');
        expect(ajaxParams.type).toBeUndefined(); // GET request
        expect(ajaxParams.url).toEqual('http://rambo.cartodb.com:8081/api/v1/map?stat_tag=vis_id&config=%22mapConfig%22');
        expect(ajaxParams.jsonpCallback().indexOf('_cdbc_')).toEqual(0);
        expect(ajaxParams.cache).toEqual(true);
      })

      it('should use the right endpoint', function() {
        layerDefinition.JSONPendPoint = '/api/v2/';

        layerDefinition.createMap(callback);

        expect(ajaxParams.url).toEqual('http://rambo.cartodb.com:8081/api/v2/?stat_tag=vis_id&config=%22fakeMapConfig%22');

        delete layerDefinition.JSONPendPoint;
        layerDefinition.endPoint = '/api/v3/'

        layerDefinition.createMap(callback);

        expect(ajaxParams.url).toEqual('http://rambo.cartodb.com:8081/api/v3/?stat_tag=vis_id&config=%22fakeMapConfig%22');
      })

      it('should the instanciateCallback as the jsonpCallback', function() {
        var callback = function() {
          console.log('hello world!')
        }
        layerDefinition.options.instanciateCallback = callback;

        layerDefinition.createMap(callback);

        expect(ajaxParams.jsonpCallback).toEqual(callback);
      })

      it('should use a cdn', function() {
        layerDefinition._host = function() { return 'http://cdn.test.com'; }
        layerDefinition._tilerHost = function() { return 'http://rambo.cartodb.com:8081'; }

        layerDefinition.options.dynamic_cdn = true;
        layerDefinition.createMap(callback);

        expect(ajaxParams.url.indexOf('http://cdn.test.com/api/v1/map?')).toEqual(0);
      });

      it("should compress the map definition using LZMA and the browser's btoa function", function() {
        layerDefinition.options.force_compress = true;

        spyOn(window, "btoa");

        var json = layerDefinition.toJSON();
        json = JSON.stringify({ config: JSON.stringify(json) });
        LZMA.compress(json, 3, function(encoded) {
          lzma = cdb.core.util.array2hex(encoded);

          layerDefinition.createMap(callback);
        });

        expect(window.btoa.calls.count()).toEqual(2);
        expect(window.btoa.calls.mostRecent().args.length).toEqual(1);
        expect(ajaxParams.url.indexOf('lzma=' + lzma)).not.toEqual(-1);
      });

      it("should compress the map definition using LZMA and cdb.core.util.encodeBase64", function() {
        layerDefinition.options.force_compress = true;

        var _btoa = window.btoa;
        window.btoa = undefined;
        spyOn(cdb.core.util, "encodeBase64");

        var json = layerDefinition.toJSON();
        json = JSON.stringify({ config: JSON.stringify(json) });
        LZMA.compress(json, 3, function(encoded) {
          lzma = cdb.core.util.array2hex(encoded);

          layerDefinition.createMap(callback);
        });

        expect(cdb.core.util.encodeBase64.calls.count()).toEqual(2);
        expect(cdb.core.util.encodeBase64.calls.mostRecent().args.length).toEqual(1);
        expect(ajaxParams.url.indexOf('lzma=' + lzma)).not.toEqual(-1);

        window.btoa = _btoa;
      });

      it('should handle errors returned by the tiler', function() {
        fakeMapProperties = { errors: ['Error!']};

        layerDefinition.createMap(callback);

        expect(callback).toHaveBeenCalledWith(null, { errors: [ 'Error!' ] });
      })

      it('should handle ajax errors', function() {
        layerDefinition.options.ajax = ajax = function(params) {
          ajaxParams = params;
          params.error('error!');
        }

        layerDefinition.createMap(callback);

        expect(callback).toHaveBeenCalledWith(null, { errors: [ 'unknow error' ] });
      })
    })

    describe('POST request', function() {

      beforeEach(function() {
        fakeMapConfig = 'a';
        for (var i = 0; i < 3000; i++) {
          fakeMapConfig += 'a';
        }
      })

      it('should use a POST request when request body is greater than maximum GET size', function() {
        layerDefinition.createMap(callback);

        expect(callback).toHaveBeenCalledWith(fakeMapProperties, undefined);
        expect(callback.calls.count()).toEqual(1);
        expect(ajaxParams.crossOrigin).toEqual(true);
        expect(ajaxParams.type).toEqual('POST'); // POST request
        expect(ajaxParams.method).toEqual('POST'); // POST request
        expect(ajaxParams.dataType).toEqual('json');
        expect(ajaxParams.contentType).toEqual('application/json');
        expect(ajaxParams.url).toEqual('http://rambo.cartodb.com:8081/api/v1/map?stat_tag=vis_id');
        expect(ajaxParams.data).toEqual('"' + fakeMapConfig + '"');
      })

      it('should use a POST request when forcing CORS', function() {
        fakeMapConfig = 'aaaa';
        layerDefinition.options.cors = 'something';
        layerDefinition.options.force_cors = true;

        layerDefinition.createMap(callback);

        expect(callback).toHaveBeenCalledWith(fakeMapProperties, undefined);
        expect(callback.calls.count()).toEqual(1);
        expect(ajaxParams.crossOrigin).toEqual(true);
        expect(ajaxParams.type).toEqual('POST'); // POST request
        expect(ajaxParams.method).toEqual('POST'); // POST request
        expect(ajaxParams.dataType).toEqual('json');
        expect(ajaxParams.contentType).toEqual('application/json');
        expect(ajaxParams.url).toEqual('http://rambo.cartodb.com:8081/api/v1/map?stat_tag=vis_id');
        expect(ajaxParams.data).toEqual('"' + fakeMapConfig + '"');
      })

      it('should use the right endpoint', function() {
        layerDefinition.options.cors = 'something';
        layerDefinition.options.force_cors = true;
        layerDefinition.endPoint = '/api/v20/';

        layerDefinition.createMap(callback);

        expect(ajaxParams.url).toEqual('http://rambo.cartodb.com:8081/api/v20/?stat_tag=vis_id');
      })

      it('should handle errors returned by the tiler', function() {
        fakeMapProperties = { errors: ['Error!']};

        layerDefinition.createMap(callback);

        expect(callback).toHaveBeenCalledWith(null, { errors: [ 'Error!' ] });
      })

      it('should handle ajax errors', function() {
        layerDefinition.options.ajax = ajax = function(params) {
          ajaxParams = params;
          params.error('error!');
        }

        layerDefinition.createMap(callback);

        expect(callback).toHaveBeenCalledWith(null, { errors: [ 'unknow error' ] });
      })
    })
  });

  describe('.getTiles', function() {
    var mapProperties, callback;

    beforeEach(function() {
      callback = jasmine.createSpy("callback");
      mapProperties = {};
      layerDefinition.createMap = function (_callback) {
        _callback(mapProperties);
      }
      spyOn(layerDefinition, "createMap").and.callThrough();
    })

    it("should fetch the map properties and invoke the callback with URLs for tiles and grids", function() {
      mapProperties = {
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

      layerDefinition.getTiles(callback);

      expect(layerDefinition.createMap).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(expectedURLs);
    });

    it("should generate url for tiles using a cdn", function() {
      mapProperties = {
        "layergroupid": "layergroupid",
        "metadata": {
          "layers": [
            { "type": "mapnik", "meta": {} },
            { "type": "mapnik", "meta": {} }
          ]
        }
      }

      layerDefinition.options.no_cdn = false;
      layerDefinition.options.cdn_url = { http: "api.cartocdn.com" }
      layerDefinition.options.subdomains = ['a', 'b', 'c', 'd'];

      layerDefinition.getTiles(callback);

      var expectedURLs = {
        tiles: [
          'http://a.api.cartocdn.com/rambo/api/v1/map/layergroupid/0,1/{z}/{x}/{y}.png',
          'http://b.api.cartocdn.com/rambo/api/v1/map/layergroupid/0,1/{z}/{x}/{y}.png',
          'http://c.api.cartocdn.com/rambo/api/v1/map/layergroupid/0,1/{z}/{x}/{y}.png',
          'http://d.api.cartocdn.com/rambo/api/v1/map/layergroupid/0,1/{z}/{x}/{y}.png'
        ],
        grids: [
          [
            'http://a.api.cartocdn.com/rambo/api/v1/map/layergroupid/0/{z}/{x}/{y}.grid.json',
            'http://b.api.cartocdn.com/rambo/api/v1/map/layergroupid/0/{z}/{x}/{y}.grid.json',
            'http://c.api.cartocdn.com/rambo/api/v1/map/layergroupid/0/{z}/{x}/{y}.grid.json',
            'http://d.api.cartocdn.com/rambo/api/v1/map/layergroupid/0/{z}/{x}/{y}.grid.json'
          ], [ 
            'http://a.api.cartocdn.com/rambo/api/v1/map/layergroupid/1/{z}/{x}/{y}.grid.json',
            'http://b.api.cartocdn.com/rambo/api/v1/map/layergroupid/1/{z}/{x}/{y}.grid.json',
            'http://c.api.cartocdn.com/rambo/api/v1/map/layergroupid/1/{z}/{x}/{y}.grid.json',
            'http://d.api.cartocdn.com/rambo/api/v1/map/layergroupid/1/{z}/{x}/{y}.grid.json'
          ]
        ]
      }
      expect(callback).toHaveBeenCalledWith(expectedURLs);
    });

    it("should use the cdn returned by the tiler", function() {
      mapProperties = {
        "layergroupid": "layergroupid",
        "metadata": {
          "layers": [
            { "type": "mapnik", "meta": {} },
            { "type": "mapnik", "meta": {} }
          ]
        },
        "cdn_url": {
          "http": "wadus.cartocdn.com"
        }
      }

      layerDefinition.options.no_cdn = false;
      layerDefinition.options.cdn_url = { http: "api.cartocdn.com" }
      layerDefinition.options.subdomains = ['a', 'b', 'c', 'd'];

      layerDefinition.getTiles(callback);

      var expectedURLs = {
        tiles: [
          'http://a.wadus.cartocdn.com/rambo/api/v1/map/layergroupid/0,1/{z}/{x}/{y}.png',
          'http://b.wadus.cartocdn.com/rambo/api/v1/map/layergroupid/0,1/{z}/{x}/{y}.png',
          'http://c.wadus.cartocdn.com/rambo/api/v1/map/layergroupid/0,1/{z}/{x}/{y}.png',
          'http://d.wadus.cartocdn.com/rambo/api/v1/map/layergroupid/0,1/{z}/{x}/{y}.png'
        ],
        grids: [
          [
            'http://a.wadus.cartocdn.com/rambo/api/v1/map/layergroupid/0/{z}/{x}/{y}.grid.json',
            'http://b.wadus.cartocdn.com/rambo/api/v1/map/layergroupid/0/{z}/{x}/{y}.grid.json',
            'http://c.wadus.cartocdn.com/rambo/api/v1/map/layergroupid/0/{z}/{x}/{y}.grid.json',
            'http://d.wadus.cartocdn.com/rambo/api/v1/map/layergroupid/0/{z}/{x}/{y}.grid.json'
          ], [
            'http://a.wadus.cartocdn.com/rambo/api/v1/map/layergroupid/1/{z}/{x}/{y}.grid.json',
            'http://b.wadus.cartocdn.com/rambo/api/v1/map/layergroupid/1/{z}/{x}/{y}.grid.json',
            'http://c.wadus.cartocdn.com/rambo/api/v1/map/layergroupid/1/{z}/{x}/{y}.grid.json',
            'http://d.wadus.cartocdn.com/rambo/api/v1/map/layergroupid/1/{z}/{x}/{y}.grid.json'
          ]
        ]
      }
      expect(callback).toHaveBeenCalledWith(expectedURLs);
    });

    it("should generate url for tiles without a cdn when cdn_url is empty", function() {
      mapProperties = {
        "layergroupid": "layergroupid",
        "metadata": {
          "layers": [
            { "type": "mapnik", "meta": {} },
            { "type": "mapnik", "meta": {} }
          ]
        }
      }

      layerDefinition.options.no_cdn = false;
      layerDefinition.options.subdomains = ['a', 'b', 'c', 'd'];

      layerDefinition.getTiles(callback);

      var expectedURLs = {
        tiles: [
          'http://rambo.cartodb.com:8081/api/v1/map/layergroupid/0,1/{z}/{x}/{y}.png',
          'http://rambo.cartodb.com:8081/api/v1/map/layergroupid/0,1/{z}/{x}/{y}.png',
          'http://rambo.cartodb.com:8081/api/v1/map/layergroupid/0,1/{z}/{x}/{y}.png',
          'http://rambo.cartodb.com:8081/api/v1/map/layergroupid/0,1/{z}/{x}/{y}.png'
        ],
        grids: [
          [
            'http://rambo.cartodb.com:8081/api/v1/map/layergroupid/0/{z}/{x}/{y}.grid.json',
            'http://rambo.cartodb.com:8081/api/v1/map/layergroupid/0/{z}/{x}/{y}.grid.json',
            'http://rambo.cartodb.com:8081/api/v1/map/layergroupid/0/{z}/{x}/{y}.grid.json',
            'http://rambo.cartodb.com:8081/api/v1/map/layergroupid/0/{z}/{x}/{y}.grid.json'
          ], [
            'http://rambo.cartodb.com:8081/api/v1/map/layergroupid/1/{z}/{x}/{y}.grid.json',
            'http://rambo.cartodb.com:8081/api/v1/map/layergroupid/1/{z}/{x}/{y}.grid.json',
            'http://rambo.cartodb.com:8081/api/v1/map/layergroupid/1/{z}/{x}/{y}.grid.json',
            'http://rambo.cartodb.com:8081/api/v1/map/layergroupid/1/{z}/{x}/{y}.grid.json'
          ]
        ]
      };
      expect(callback).toHaveBeenCalledWith(expectedURLs);
    });

    it("should only fetch the map properties if they were already fetched and the definition is valid", function() {
      mapProperties = {
        "layergroupid": "layergroupid",
        "metadata": {
          "layers": [
            { "type": "mapnik", "meta": {} },
            { "type": "mapnik", "meta": {} }
          ]
        }
      }

      layerDefinition.getTiles(callback);

      var expectedURLs = {
        "tiles": [
          "http://rambo.cartodb.com:8081/api/v1/map/layergroupid/0,1/{z}/{x}/{y}.png"
        ],
        "grids": [
          [ "http://rambo.cartodb.com:8081/api/v1/map/layergroupid/0/{z}/{x}/{y}.grid.json" ],
          [ "http://rambo.cartodb.com:8081/api/v1/map/layergroupid/1/{z}/{x}/{y}.grid.json" ]
        ]
      }

      expect(layerDefinition.createMap).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(expectedURLs);

      // Reset spies
      callback.calls.reset();
      layerDefinition.createMap.calls.reset();

      // Invoke the method again -> It should have cached the map properties
      layerDefinition.getTiles(callback);

      expect(layerDefinition.createMap).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(expectedURLs);

      // Reset spies
      callback.calls.reset();
      layerDefinition.createMap.calls.reset();

      // Invalidate the definition and try again -> It should query again
      layerDefinition.invalidate();
      layerDefinition.getTiles(callback);

      expect(layerDefinition.createMap).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(expectedURLs);
    });

    it("should invoke the callback with URLs for tiles and grids (for mapnik layers ONLY)", function() {
      mapProperties = {
        "layergroupid": "layergroupid",
        "metadata": {
          "layers": [
            { "type": "http", "meta": {} },
            { "type": "mapnik", "meta": {} },
            { "type": "mapnik", "meta": {} }
          ]
        }
      }

      layerDefinition.getTiles(callback);

      // LayerDefinition contains two mapnik layers (0 and 1), but the tiler contains:
      // 0 - http
      // 1 - mapnik
      // 2 - mapnik
      // We need to fetch the grid for layers 1 and 2. Those are the indexes that the tiler understands.
      var expectedURLs = {
        "tiles": [
          "http://rambo.cartodb.com:8081/api/v1/map/layergroupid/0,1,2/{z}/{x}/{y}.png"
        ],
        "grids": [
          [ "http://rambo.cartodb.com:8081/api/v1/map/layergroupid/1/{z}/{x}/{y}.grid.json" ],
          [ "http://rambo.cartodb.com:8081/api/v1/map/layergroupid/2/{z}/{x}/{y}.grid.json" ]
        ]
      }
      expect(callback).toHaveBeenCalledWith(expectedURLs);
    });

    it("should only include the specified layer types in the tiles", function() {
      layerDefinition.options.filter = "http";

      mapProperties = {
        "layergroupid": "layergroupid",
        "metadata": {
          "layers": [
            { "type": "mapnik", "meta": {} },
            { "type": "http", "meta": {} },
            { "type": "mapnik", "meta": {} },
            { "type": "http", "meta": {} }
          ]
        }
      }

      layerDefinition.getTiles(callback);

      // Tile URL is telling the tiler to only render layers 1 and 3 (both http)
      var expectedURLs = {
        "tiles": [
          "http://rambo.cartodb.com:8081/api/v1/map/layergroupid/1,3/{z}/{x}/{y}.png"
        ],
        "grids": [
          [ "http://rambo.cartodb.com:8081/api/v1/map/layergroupid/0/{z}/{x}/{y}.grid.json" ],
          [ "http://rambo.cartodb.com:8081/api/v1/map/layergroupid/2/{z}/{x}/{y}.grid.json" ]
        ]
      }
      expect(callback).toHaveBeenCalledWith(expectedURLs);
    })

    it("should use an empty gif if filter returns no layers", function() {
      layerDefinition.options.filter = "http";

      mapProperties = {
        "layergroupid": "layergroupid",
        "metadata": {
          "layers": [
            { "type": "mapnik", "meta": {} },
            { "type": "mapnik", "meta": {} },
          ]
        }
      }

      layerDefinition.getTiles(callback);

      // No layers match the filter -> Render empty gifs
      var expectedURLs = {
        tiles: [ MapBase.EMPTY_GIF ],
        grids: [ ]
      }
      expect(callback).toHaveBeenCalledWith(expectedURLs);
    })

    it("should include extra params", function() {
      mapProperties = {
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

      layerDefinition.getTiles(function(tiles) {
        expect(tiles.tiles[0].indexOf('map_key=testapikey')).not.toEqual(-1)
        expect(tiles.tiles[0].indexOf('should_not')).toEqual(-1)
      });
    });

    it("should cache the mapProperties", function() {
      mapProperties = {
        layergroupid: 'test',
        metadata: { layers: [] },
        cdn_url: {
          http: 'cdn.test.com',
          https:'cdn.testhttps.com'
        }
      }

      // Request tiles for the first time
      layerDefinition.getTiles();

      expect(layerDefinition.createMap).toHaveBeenCalled();
      expect(layerDefinition.mapProperties.getMapId()).toEqual('test');

      // Reset calls to layerDefinition.createMap
      layerDefinition.createMap.calls.reset();

      // Request tiles again
      layerDefinition.getTiles();

      // We already have mapProperties so we don't need to request them again
      expect(layerDefinition.createMap).not.toHaveBeenCalled();
      expect(layerDefinition.mapProperties.getMapId()).toEqual('test');
    });

    it("should use an empty gif if there are no visible layers", function() {
      var urls;
      layerDefinition.getSubLayer(0).hide();
      layerDefinition.getSubLayer(1).hide();
      layerDefinition.createMap = function (callback) {
        callback(null);
      }

      layerDefinition.getTiles(function(t) {
        urls = t;
      })

      expect(urls.tiles[0]).toEqual(MapBase.EMPTY_GIF);
      expect(urls.grids[0]).toBeUndefined();
    });
  });

  describe('.fetchAttributes', function() {
    var mapProperties, callback, ajax;

    beforeEach(function() {
      callback = jasmine.createSpy("callback");
      ajax = layerDefinition.options.ajax = jasmine.createSpy('ajax');
      mapProperties = {};
      layerDefinition.createMap = function (callback) {
        callback(mapProperties);
      }
    })

    it('should fetch the attributes and invoke the callback', function() {
      mapProperties = {
        "layergroupid": "layergroupid",
        "metadata": {
          "layers": [
            { "type": "mapnik", "meta": {} },
            { "type": "mapnik", "meta": {} }
          ]
        }
      }

      // Fetch the map properties first
      layerDefinition.getTiles();

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
      mapProperties = {
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

      // Fetch the map properties first
      layerDefinition.getTiles();

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

    it('should handle hidden layers properly', function() {
      var layer_definition = {
        version: '1.0.0',
        stat_tag: 'vis_id',
        layers: [
          {
            type: 'http',
            urlTemplate: 'urlTemplate',
            options: {}
          },
          {
            type: 'http',
            urlTemplate: 'urlTemplate',
            options: {}
          },
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

      layerDefinition.setLayerDefinition(layer_definition);

      // Hide the first `http` sublayer
      layerDefinition.getSubLayer(0).hide();

      // Hide the first `mapnik` sublayer
      layerDefinition.getSubLayer(1).hide();

      // Tiler returns the two layers that are visible
      mapProperties = {
        "layergroupid": "layergroupid",
        "metadata": {
          "layers": [
            { "type": "http", "meta": {} },
            { "type": "mapnik", "meta": {} },
          ]
        }
      }

      // Fetch the map properties
      layerDefinition.getTiles();

      // Fetch attributes for 2nd mapnik layer (which is layer 1 in the tiler)
      layerDefinition.fetchAttributes(2, 'feature_id', 2, callback);

      var expectedUrl = 'http://rambo.cartodb.com:8081/api/v1/map/layergroupid/1/attributes/feature_id';
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

  describe('.invalidate', function() {

    it('should clear the mapProperties and urls', function() {
      layerDefinition.mapProperties = 'test';
      layerDefinition.urls = ['test'];

      layerDefinition.invalidate();

      expect(layerDefinition.mapProperties).toEqual(null);
      expect(layerDefinition.urls).toEqual(null);
    });

    it('should invoke onLayerDefinitionUpdated', function() {
      spyOn(layerDefinition, 'onLayerDefinitionUpdated');

      layerDefinition.invalidate();

      expect(layerDefinition.onLayerDefinitionUpdated).toHaveBeenCalled();
    })
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

  describe('.toJSON', function() {

    it('should return an empty object if no layers are present', function() {
      var config = {
        name: 'testing'
      };
      var namedMap = new NamedMap(config, {});

      expect(namedMap.toJSON()).toEqual({});

      config = {
        name: 'testing',
        layers: []
      };
      namedMap = new NamedMap(config, {});

      expect(namedMap.toJSON()).toEqual({});
    })

    it('should include the given params', function() {
      var config = {
        name: 'testing',
        params: {
          key: 'value'
        }
      };
      var namedMap = new NamedMap(config, {});

      expect(namedMap.toJSON()).toEqual({ key: 'value' });
    })

    it('should include layers and with the right visibility', function() {
      var config = {
        name: 'testing',
        layers: [
          {
          },
          {
            "visible": false
          },
          {
            "visible": true
          }
        ]
      };
      var namedMap = new NamedMap(config, {});

      // Layers 0 and 1 are visible, but layer 2 is hidden
      expect(namedMap.toJSON()).toEqual({
        layer0: 1,
        layer1: 0,
        layer2: 1
      });
    })
  })

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

      namedMap.createMap = function (callback) {
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

      namedMap.createMap = function (callback) {
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

      namedMap.createMap = function (callback) {
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

      namedMap.createMap = function (callback) {
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

  describe('.setParams', function() {
    var namedMap;

    beforeEach(function() {
      var named_map = {
        params: {
          key1: 'value1'
        }
      };
      namedMap = new NamedMap(named_map, {
        tiler_domain:   "cartodb.com",
        tiler_port:     "8081",
        tiler_protocol: "https",
        user_name: 'rambo',
        no_cdn: true,
        subdomains: [null]
      });
    })

    it('should initialize params object if no params are present in the definition', function() {
      delete namedMap.named_map.params;

      namedMap.setParams('key2', 'value2');
      expect(namedMap.named_map.params).toEqual({
        key2: 'value2'
      })
    })

    it('should handle strings as arguments', function() {
      namedMap.setParams('key2', 'value2');
      expect(namedMap.named_map.params).toEqual({
        key1: 'value1',
        key2: 'value2'
      })
    })

    it('should handle objects as arguments', function() {
      namedMap.setParams({ key2: 'value2' });
      expect(namedMap.named_map.params).toEqual({
        key1: 'value1',
        key2: 'value2'
      })
    })

    it('should unset arguments', function() {
      namedMap.setParams({ key2: 'value2' });
      expect(namedMap.named_map.params).toEqual({
        key1: 'value1',
        key2: 'value2'
      })

      namedMap.setParams({ key1: null, key2: undefined });
      expect(namedMap.named_map.params).toEqual({})
    })

    it('should invalidate the map', function() {
      spyOn(namedMap, 'invalidate');

      namedMap.setParams();

      expect(namedMap.invalidate).toHaveBeenCalled();
    })
  });

  it("shoud have infowindow", function() {
    expect(namedMap.containInfowindow()).toEqual(true);
  });

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

    namedMap._createMap();
    namedMap.getTiles(function(t) {
      tiles = t;
    });

    setTimeout(function() {
      expect(params.url.indexOf('auth_token=auth_token_test')).not.toEqual(-1);
      expect(tiles.tiles[0].indexOf('auth_token=auth_token_test')).not.toEqual(-1);
      expect(tiles.grids[0][0].indexOf('auth_token=auth_token_test')).not.toEqual(-1);

      namedMap.setAuthToken('test2');
      namedMap._createMap();

      setTimeout(function() {
        expect(params.url.indexOf('auth_token=test2')).not.toEqual(-1);

        setTimeout(function() {
          namedMap.setAuthToken(['token1', 'token2']);
          namedMap._createMap();
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
});

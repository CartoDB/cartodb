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

    it("should include extra params", function() {
      layerDefinition.options.extra_params = {
        'map_key': 'testapikey',
        'should_not': 'included'
      }
      layerDefinition.mapProperties = {
        layergroupid: 'test',
        metadata: { layers: [ {type: 'mapnik'} ] }
      }
      layerDefinition.getTiles(function(tiles) {
        debugger;
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
      expect(layerDefinition.mapProperties).toEqual(mapProperties);

      // Reset calls to layerDefinition.getLayerToken
      layerDefinition.getLayerToken.calls.reset();

      // Request tiles again
      layerDefinition.getTiles();

      // We already have mapProperties so we don't need to request them again
      expect(layerDefinition.getLayerToken).not.toHaveBeenCalled();
      expect(layerDefinition.mapProperties).toEqual(mapProperties);
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
      layerDefinition.options.refreshTime = 10;
      layerDefinition.options.ajax = function(p) { 
        params = p;
        p.success({ layergroupid: 'test', metadata: { layers: [] } });
      };

      layerDefinition.getTiles(function(tiles) {});

      spyOn(layerDefinition,'invalidate');

      setTimeout(function() {
        expect(layerDefinition.invalidate).toHaveBeenCalled();
        done();
      }, 200);
    });
  });

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

    beforeEach(function() {
      layerDefinition.mapProperties = {
        layergroupid: 'test_layer',
        metadata: {
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
      }
    });

    it("should generate url for grids", function() {
      var tiles = layerDefinition._layerGroupTiles();
      expect(tiles.grids.length).toEqual(2);
      expect(tiles.grids[0].length).toEqual(1);
      expect(tiles.grids[0][0]).toEqual('http://rambo.cartodb.com:8081/api/v1/map/test_layer/0/{z}/{x}/{y}.grid.json');
      expect(tiles.grids[1][0]).toEqual('http://rambo.cartodb.com:8081/api/v1/map/test_layer/1/{z}/{x}/{y}.grid.json');
    });

    it('should generate url for tiles and only include non-torque layers', function() {
      var tiles = layerDefinition._layerGroupTiles();
      // Layers in the metadata are: 0 (mapnik), 1 (torque), 2 (http) -> Only 0 and 2 are part of the URL
      expect(tiles.tiles).toEqual([ 'http://rambo.cartodb.com:8081/api/v1/map/test_layer/0,2/{z}/{x}/{y}.png' ]);
    })

    it('should filter layers if a filter has been specified', function() {
      layerDefinition.options.filter = undefined;

      var tiles = layerDefinition._layerGroupTiles();
      expect(tiles.tiles).toEqual([ 'http://rambo.cartodb.com:8081/api/v1/map/test_layer/0,2/{z}/{x}/{y}.png' ]);

      layerDefinition.options.filter = "http";
      tiles = layerDefinition._layerGroupTiles();
      expect(tiles.tiles).toEqual([ 'http://rambo.cartodb.com:8081/api/v1/map/test_layer/2/{z}/{x}/{y}.png' ]);

      layerDefinition.options.filter = "mapnik";
      tiles = layerDefinition._layerGroupTiles();
      expect(tiles.tiles).toEqual([ 'http://rambo.cartodb.com:8081/api/v1/map/test_layer/0/{z}/{x}/{y}.png' ]);

      layerDefinition.options.filter = ["http", "mapnik"];
      tiles = layerDefinition._layerGroupTiles();
      expect(tiles.tiles).toEqual([ 'http://rambo.cartodb.com:8081/api/v1/map/test_layer/0,2/{z}/{x}/{y}.png' ]);

      // Filter doesn't mach any valid type -> Render empty gifs
      layerDefinition.options.filter = "wadus";

      var tiles = layerDefinition._layerGroupTiles();
      expect(tiles.tiles).toEqual([ MapBase.EMPTY_GIF ]);
      expect(tiles.grids).toEqual([]);
    })

    it("should generate url for tiles with params", function() {
      layerDefinition.options.extra_params = {
        api_key: 'api_key_test',
        updated_at: '1234'
      };
      var tiles = layerDefinition._layerGroupTiles();
      expect(tiles.tiles[0]).toEqual('http://rambo.cartodb.com:8081/api/v1/map/test_layer/0,2/{z}/{x}/{y}.png?api_key=api_key_test&updated_at=1234');
      expect(tiles.grids[0][0]).toEqual('http://rambo.cartodb.com:8081/api/v1/map/test_layer/0/{z}/{x}/{y}.grid.json?api_key=api_key_test&updated_at=1234');
    });

    it("should generate url for tiles using a cdn", function() {
      layerDefinition.options.no_cdn = false;
      layerDefinition.options.cdn_url = { http: "api.cartocdn.com" }
      layerDefinition.options.subdomains = ['a', 'b', 'c', 'd'];
      var tiles = layerDefinition._layerGroupTiles();
      expect(tiles.tiles[0]).toEqual('http://a.api.cartocdn.com/rambo/api/v1/map/test_layer/0,2/{z}/{x}/{y}.png');
      expect(tiles.tiles[1]).toEqual('http://b.api.cartocdn.com/rambo/api/v1/map/test_layer/0,2/{z}/{x}/{y}.png');
      expect(tiles.grids[0][0]).toEqual('http://a.api.cartocdn.com/rambo/api/v1/map/test_layer/0/{z}/{x}/{y}.grid.json');
      expect(tiles.grids[0][1]).toEqual('http://b.api.cartocdn.com/rambo/api/v1/map/test_layer/0/{z}/{x}/{y}.grid.json');
    });

    it("should generate url for tiles without a cdn when cdn_url is empty", function() {
      layerDefinition.options.no_cdn = false;
      layerDefinition.options.subdomains = ['a', 'b', 'c', 'd'];
      var tiles = layerDefinition._layerGroupTiles();
      expect(tiles.tiles[0]).toEqual('http://rambo.cartodb.com:8081/api/v1/map/test_layer/0,2/{z}/{x}/{y}.png');
      expect(tiles.tiles[1]).toEqual('http://rambo.cartodb.com:8081/api/v1/map/test_layer/0,2/{z}/{x}/{y}.png');
      expect(tiles.grids[0][0]).toEqual('http://rambo.cartodb.com:8081/api/v1/map/test_layer/0/{z}/{x}/{y}.grid.json');
      expect(tiles.grids[0][1]).toEqual('http://rambo.cartodb.com:8081/api/v1/map/test_layer/0/{z}/{x}/{y}.grid.json');
    });
  });

  describe('.invalidate', function() {

    it('should clear the token and urls', function() {
      layerDefinition.mapProperties = 'test';
      layerDefinition.urls = ['test'];

      layerDefinition.invalidate();

      expect(layerDefinition.mapProperties).toEqual(null);
      expect(layerDefinition.urls).toEqual(null);
    });
  });

  describe('._attributesUrl', function() {

    it("should generate the right attributes url", function() {
       layerDefinition.mapProperties = { layergroupid: 'testing' };
       expect(layerDefinition._attributesUrl(0, 1)).toEqual(
        'http://rambo.cartodb.com:8081/api/v1/map/testing/0/attributes/1'
       );
       layerDefinition.getSubLayer(0).hide();
       layerDefinition.mapProperties = { layergroupid: 'testing' };
       expect(layerDefinition._attributesUrl(1, 1)).toEqual(
        'http://rambo.cartodb.com:8081/api/v1/map/testing/0/attributes/1'
       );
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

  it("should fetch attributes", function() {
    namedMap.mapProperties = {
      layergroupid: 'test',
      metadata: {
        layers: []
      }
    }
    namedMap.options.ajax = function(p) { 
      params = p;
      p.success({ test: 1 });
    };
    namedMap.fetchAttributes(1, 12345, null, function(data) {
      expect(data).toEqual({test: 1});
      expect(params.url).toEqual('http://rambo.cartodb.com:8081/api/v1/map/test/1/attributes/12345')
      expect(params.dataType).toEqual('jsonp')
      expect(params.cache).toEqual(true);
      expect(params.jsonpCallback.indexOf('_cdbi_layer_attributes') !== -1).toEqual(true);
    });
  })

  it("should fetch attributes using https and auth_token", function() {
    namedMap.options.tiler_protocol = 'https';
    namedMap._buildMapsApiTemplate(namedMap.options)
    namedMap.setAuthToken('test');
    namedMap.mapProperties = {
      layergroupid: 'test',
      metadata: {
        layers: []
      }
    }
    namedMap.options.ajax = function(p) { 
      params = p;
      p.success({ test: 1 });
    };

    namedMap.fetchAttributes(1, 12345, null, function(data) {
      expect(data).toEqual({test: 1});
      expect(params.url).toEqual('https://rambo.cartodb.com:8081/api/v1/map/test/1/attributes/12345?auth_token=test')
      expect(params.dataType).toEqual('jsonp');
      expect(params.cache).toEqual(true);
      expect(params.jsonpCallback.indexOf('_cdbi_layer_attributes') !== -1).toEqual(true);
    });
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
    namedMap.options.ajax = function(p) { 
      params = p;
      p.success({ layergroupid: 'test', metadata: { layers: [ { type: 'mapnik' }] } });
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

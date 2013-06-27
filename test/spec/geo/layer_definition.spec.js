describe("LayerDefinition", function() {
  var layerDefinition;
  beforeEach(function(){
    var  layer_definition = {
      version: '1.0.0',
      stat_tag: 'vis_id',
      layers: [{
         type: 'cartodb', 
         options: {
           sql: 'select * from ne_10m_populated_places_simple',
           cartocss: '#layer { marker-fill: red; }',
           interactivity: ['test', 'cartodb_id']
         }
       }, {
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
      tiler_domain:   "cartodb.com",
      tiler_port:     "8081",
      tiler_protocol: "http",
      user_name: 'rambo',
      no_cdn: true,
      subdomains: [null]
    });

  });

  it("should return layer count", function() {
    expect(layerDefinition.getLayerCount()).toEqual(2);
  });

  it("should invalidate", function() {
    layerDefinition.layerToken = 'test';
    layerDefinition.urls = ['test'];
    layerDefinition.invalidate();
    expect(layerDefinition.layerToken).toEqual(null);
    expect(layerDefinition.urls).toEqual(null);
    
  });

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

  it("should add a layer", function() {
    layerDefinition.addLayer({ sql : 'b', cartocss: 'b'});
    expect(layerDefinition.getLayerCount()).toEqual(3);
    expect(layerDefinition.getLayer(2)).toEqual({
       type: 'cartodb', 
       options: {
         sql: 'b',
         cartocss: 'b'
       }
    });
    layerDefinition.addLayer({ sql : 'a', cartocss: 'a'}, 0);
    expect(layerDefinition.getLayer(0)).toEqual({
       type: 'cartodb', 
       options: {
         sql: "a",
         cartocss: 'a'
       }
    });
  });

  it("should return json spec of layers", function() {
    expect(layerDefinition.toJSON()).toEqual({
      version: '1.0.0',
      stat_tag: 'vis_id',
      layers: [{
         type: 'cartodb', 
         options: {
           sql: 'select * from ne_10m_populated_places_simple',
           cartocss: '#layer { marker-fill: red; }',
           cartocss_version: '2.1.0',
           interactivity: ['test', 'cartodb_id']
         }
       }, {
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

  it("should generate url for tiles", function() {
    var tiles = layerDefinition._layerGroupTiles('test_layer');
    expect(tiles.tiles.length).toEqual(1);
    expect(tiles.grids.length).toEqual(2);
    expect(tiles.grids[0].length).toEqual(1);
    expect(tiles.tiles[0]).toEqual('http://rambo.cartodb.com:8081/tiles/layergroup/test_layer/{z}/{x}/{y}.png?');
    expect(tiles.grids[0][0]).toEqual('http://rambo.cartodb.com:8081/tiles/layergroup/test_layer/0/{z}/{x}/{y}.grid.json?');
    expect(tiles.grids[1][0]).toEqual('http://rambo.cartodb.com:8081/tiles/layergroup/test_layer/1/{z}/{x}/{y}.grid.json?');

  });

  it("should generate url for tiles with params", function() {
    var tiles = layerDefinition._layerGroupTiles('test_layer', {
      api_key: 'api_key_test',
      updated_at: '1234'
    });
    expect(tiles.tiles[0]).toEqual('http://rambo.cartodb.com:8081/tiles/layergroup/test_layer/{z}/{x}/{y}.png?api_key=api_key_test&updated_at=1234');
    expect(tiles.grids[0][0]).toEqual('http://rambo.cartodb.com:8081/tiles/layergroup/test_layer/0/{z}/{x}/{y}.grid.json?api_key=api_key_test&updated_at=1234');
  });

  it("should generate url for with cdn", function() {
    layerDefinition.options.no_cdn = false;
    layerDefinition.options.subdomains = ['a', 'b', 'c', 'd'];
    var tiles = layerDefinition._layerGroupTiles('test_layer');
    expect(tiles.tiles[0]).toEqual('http://a.tiles.cartocdn.com/rambo/tiles/layergroup/test_layer/{z}/{x}/{y}.png?');
    expect(tiles.tiles[1]).toEqual('http://b.tiles.cartocdn.com/rambo/tiles/layergroup/test_layer/{z}/{x}/{y}.png?');
    expect(tiles.grids[0][0]).toEqual('http://a.tiles.cartocdn.com/rambo/tiles/layergroup/test_layer/0/{z}/{x}/{y}.grid.json?');
    expect(tiles.grids[0][1]).toEqual('http://b.tiles.cartocdn.com/rambo/tiles/layergroup/test_layer/0/{z}/{x}/{y}.grid.json?');
  });

  it("grid url should not include interactivity", function() {
    layerDefinition.setInteractivity(0, ['cartodb_id', 'rambo']);
    var tiles = layerDefinition._layerGroupTiles('test_layer');
    expect(tiles.grids[0][0]).toEqual('http://rambo.cartodb.com:8081/tiles/layergroup/test_layer/0/{z}/{x}/{y}.grid.json?');
    expect(tiles.grids[1][0]).toEqual('http://rambo.cartodb.com:8081/tiles/layergroup/test_layer/1/{z}/{x}/{y}.grid.json?');
  });

  it("should set interactivity", function() {
    layerDefinition.setInteractivity(1, ['cartodb_id', 'rambo   ']);
    expect(layerDefinition.getLayer(1).options.interactivity).toEqual(['cartodb_id','rambo']);
    layerDefinition.setInteractivity(['cartodb_id', 'john']);
    expect(layerDefinition.getLayer(0).options.interactivity).toEqual(['cartodb_id', 'john']);
    expect(layerDefinition.toJSON().layers[0].options.interactivity).toEqual(['cartodb_id', 'john']);
  });

  it("should use cdn_url as default", function() {
    delete layerDefinition.options.no_cdn;
    expect(layerDefinition._host()).toEqual('http://tiles.cartocdn.com/rambo');
    expect(layerDefinition._host('0')).toEqual('http://0.tiles.cartocdn.com/rambo');
    layerDefinition.options.tiler_protocol = "https";
    expect(layerDefinition._host()).toEqual('https://d3pu9mtm6f0hk5.cloudfront.net/rambo');
    expect(layerDefinition._host('a')).toEqual('https://a.d3pu9mtm6f0hk5.cloudfront.net/rambo');
  });

  it("it should use jsonp when cors is not available", function() {
    var params, lzma;
    layerDefinition.options.cors = false;
    layerDefinition.options.api_key = 'test';
    layerDefinition.options.ajax = function(p) { 
      params = p;
      p.success({ layergroupid: 'test' });
    };

    runs(function() {
      var json = layerDefinition.toJSON();
      json = '{ "config": "' + 
        JSON.stringify(json).replace(/"/g, '\\"') + 
      '"}';
      LZMA.compress(json, 3, function(encoded) {
        lzma = layerDefinition._array2hex(encoded);
        layerDefinition.getLayerToken(function() {
        });
      });
    });
    waits(100);
    runs(function() {
      expect(params.url).toEqual(layerDefinition._tilerHost() + '/tiles/layergroup?map_key=test&lzma=' + encodeURIComponent(lzma));
    });
  });

  it("should add api_key", function() {
    var url = null;
    layerDefinition.options.cors = true;
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


  it("getTiles should include extra params", function() {
    layerDefinition.options.extra_params = {
      'map_key': 'testapikey',
      'should_not': 'included'
    }
    layerDefinition.layerToken = 'test';
    layerDefinition.getTiles(function(tiles) {
      expect(tiles.tiles[0].indexOf('map_key=testapikey')).not.toEqual(-1)
      expect(tiles.tiles[0].indexOf('should_not')).toEqual(-1)
    });
  });

  it("should set refresh timer after being updated", function() {
    layerDefinition.options.refreshTime = 10;
    layerDefinition.options.ajax = function(p) { 
      params = p;
      p.success({ layergroupid: 'test' });
    };
    runs(function() {
      layerDefinition.getTiles(function(tiles) {});
    });
    spyOn(layerDefinition,'invalidate');
    waits(200);
    runs(function() {
      expect(layerDefinition.invalidate).toHaveBeenCalled();
    });
  });

  describe("sublayers", function() {

    it("should create sublayer", function() {
      var subLayer = layerDefinition.createSubLayer({
        sql: 'select * from table',
        cartocss: 'test',
        interactivity: 'test'
      });
      expect(!!subLayer).toEqual(true);
    });

    it("should get cartocss and sql", function() {
      var layer = layerDefinition.getSubLayer(0);
      expect(layer.getSQL()).toEqual('select * from ne_10m_populated_places_simple');
      expect(layer.getCartoCSS()).toEqual('#layer { marker-fill: red; }');
    });

    it("should set sql and cartocss by name", function() {
      var q;
      var layer = layerDefinition.getSubLayer(0);
      layer.setSQL(q='select * from rambisimo');
      expect(layerDefinition.toJSON().layers[0].options.sql).toEqual(q);
      layer.setCartoCSS(q='cartocss');
      expect(layerDefinition.toJSON().layers[0].options.cartocss).toEqual(q);
    });

    it("should get sublayer count", function() {
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

    it("should show/hide", function() {
      layerDefinition.getSubLayer(0).hide();
      expect(layerDefinition.toJSON().layers.length).toEqual(1);
      expect(layerDefinition.getSubLayerCount()).toEqual(2);
      layerDefinition.getSubLayer(0).show();
      expect(layerDefinition.toJSON().layers.length).toEqual(2);
      expect(layerDefinition.getSubLayerCount()).toEqual(2);
    });

    it("should be the same object for the same sublayer", function() {
      expect(layerDefinition.getSubLayer(0)).toBe(layerDefinition.getSubLayer(0));
    });



    it("should raise an exception when change something after remove", function() {
      var sub = layerDefinition.getSubLayer(0);
      sub.remove();
      var a = false;
      try {
        sub.setSQL('test');
      } catch(e) {
        a = true;
      }
      expect(a).toEqual(true);

    });
  });

  describe('layerDefFromSubLayers', function() {
    it("should generate layerdef", function() {
      var layerDef = LayerDefinition.layerDefFromSubLayers([{
        sql: 'test',
        cartocss:'test'
      }]);

      expect(layerDef).toEqual({
          version: '1.0.0',
          stat_tag: 'API',
          layers: [{
            type: 'cartodb',
            options: {
              sql: 'test',
              cartocss:'test'
            }
          }]
      });

    });
  });

});


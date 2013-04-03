describe("LayerDefinition", function() {
  var layerDefinition;
  beforeEach(function(){
    var  layer_definition = {
      version: '1.0.0',
      layers: [{
         type: 'cartodb', 
         options: {
           sql: 'select * from ne_10m_populated_places_simple',
           cartocss: '#layer { marker-fill: red; }'
         }
       }, {
         type: 'cartodb', 
         options: {
           sql: "select * from european_countries_export",
           cartocss: '#layer { polygon-fill: #000; polygon-opacity: 0.8;}',
           cartocss_version : '2.0.0'
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

  it("should remove a layer", function() {
    layerDefinition.removeLayer(0);
    expect(layerDefinition.getLayerCount()).toEqual(1);
    expect(layerDefinition.getLayer(0)).toEqual({
       type: 'cartodb', 
       options: {
         sql: "select * from european_countries_export",
         cartocss: '#layer { polygon-fill: #000; polygon-opacity: 0.8;}',
         cartocss_version: '2.0.0'
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
      layers: [{
         type: 'cartodb', 
         options: {
           sql: 'select * from ne_10m_populated_places_simple',
           cartocss: '#layer { marker-fill: red; }',
           cartocss_version: '2.1.0'
         }
       }, {
         type: 'cartodb', 
         options: {
           sql: "select * from european_countries_export",
           cartocss: '#layer { polygon-fill: #000; polygon-opacity: 0.8;}',
           cartocss_version: '2.0.0'
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
    expect(tiles.grids[0][0]).toEqual('http://rambo.cartodb.com:8081/tiles/layergroup/test_layer/layer0/{z}/{x}/{y}.grid.json?');
    expect(tiles.grids[1][0]).toEqual('http://rambo.cartodb.com:8081/tiles/layergroup/test_layer/layer1/{z}/{x}/{y}.grid.json?');

  });

  it("should generate url for tiles with params", function() {
    var tiles = layerDefinition._layerGroupTiles('test_layer', {
      api_key: 'api_key_test',
      updated_at: '1234'
    });
    expect(tiles.tiles[0]).toEqual('http://rambo.cartodb.com:8081/tiles/layergroup/test_layer/{z}/{x}/{y}.png?api_key=api_key_test&updated_at=1234');
    expect(tiles.grids[0][0]).toEqual('http://rambo.cartodb.com:8081/tiles/layergroup/test_layer/layer0/{z}/{x}/{y}.grid.json?api_key=api_key_test&updated_at=1234');
  });

  it("should generate url for with cdn", function() {
    layerDefinition.options.no_cdn = false;
    layerDefinition.options.subdomains = ['a', 'b', 'c', 'd'];
    var tiles = layerDefinition._layerGroupTiles('test_layer');
    expect(tiles.tiles[0]).toEqual('http://a.tiles.cartocdn.com/rambo/tiles/layergroup/test_layer/{z}/{x}/{y}.png?');
    expect(tiles.tiles[1]).toEqual('http://b.tiles.cartocdn.com/rambo/tiles/layergroup/test_layer/{z}/{x}/{y}.png?');
    expect(tiles.grids[0][0]).toEqual('http://a.tiles.cartocdn.com/rambo/tiles/layergroup/test_layer/layer0/{z}/{x}/{y}.grid.json?');
    expect(tiles.grids[0][1]).toEqual('http://b.tiles.cartocdn.com/rambo/tiles/layergroup/test_layer/layer0/{z}/{x}/{y}.grid.json?');
  });

  it("grid url should include interactivity", function() {
    layerDefinition.setInteractivity(0, ['cartodb_id', 'rambo']);
    var tiles = layerDefinition._layerGroupTiles('test_layer');
    expect(tiles.grids[0][0]).toEqual('http://rambo.cartodb.com:8081/tiles/layergroup/test_layer/layer0/{z}/{x}/{y}.grid.json?interactivity=' + encodeURIComponent('cartodb_id,rambo'));
    expect(tiles.grids[1][0]).toEqual('http://rambo.cartodb.com:8081/tiles/layergroup/test_layer/layer1/{z}/{x}/{y}.grid.json?');
  });

  it("should set interaction", function() {
    layerDefinition.setInteractivity(1, ['cartodb_id', 'rambo']);
    expect(layerDefinition.getLayer(1).options.interactivity).toEqual('cartodb_id,rambo');
    layerDefinition.setInteractivity(['cartodb_id', 'john']);
    expect(layerDefinition.getLayer(0).options.interactivity).toEqual('cartodb_id,john');
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
    layerDefinition.options.ajax = function(p) { 
      params = p;
      p.success({ layergroupid: 'test' });
    };

    runs(function() {
      var json = JSON.stringify(layerDefinition.toJSON());
      LZMA.compress(json, 3, function(encoded) {
        lzma = layerDefinition._array2hex(encoded);
        layerDefinition.getLayerToken(function() {
        });
      });
    });
    waits(100);
    runs(function() {
      expect(params.url).toEqual(layerDefinition._tilerHost() + '/tiles/layergroup?lzma=' + lzma);
    });


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

});


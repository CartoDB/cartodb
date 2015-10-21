var $ = require('jquery');
var Backbone = require('backbone');
var setupSubLayerBase = require('../../../../../src-browserify/geo/sub-layer/sub-layer-base');
var setupCartoDBSubLayer = require('../../../../../src-browserify/geo/sub-layer/cartodb-sub-layer');
var setupSubLayerFactory = require('../../../../../src-browserify/geo/sub-layer/sub-layer-factory');
var setupMapBase = require('../../../../../src-browserify/geo/layer-definition/map-base');
var setupNamedMap = require('../../../../../src-browserify/geo/layer-definition/named-map');

describe("geo/layer-definition/named-map", function() {
  var NamedMap;
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

    var SubLayerBase = setupSubLayerBase(Backbone.Events);
    var CartoDBSubLayer = setupCartoDBSubLayer(SubLayerBase, Backbone.Model);
    var SubLayerFactory = setupSubLayerFactory(CartoDBSubLayer, {}); // HttpSubLayer = {} since not used
    var MapBase = setupMapBase(SubLayerFactory, { jQueryAjax: $.ajax });
    NamedMap = setupNamedMap(MapBase, SubLayerFactory);
    namedMap = new NamedMap(named_map, {
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

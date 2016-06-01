var _ = require('underscore');
var PlainLayer = require('../../../src/geo/map/plain-layer');
var CartoDBLayer = require('../../../src/geo/map/cartodb-layer');
var TorqueLayer = require('../../../src/geo/map/torque-layer');
var TileLayer = require('../../../src/geo/map/tile-layer');
var WMSLayer = require('../../../src/geo/map/wms-layer');
var GMapsBaseLayer = require('../../../src/geo/map/gmaps-base-layer');

var Map = require('../../../src/geo/map');

describe('core/geo/map', function() {
  var map;

  beforeEach(function() {
    map = new Map();
    map.instantiateMap();
  });

  describe('.initialize', function () {
    it('should parse bounds and set attributes', function () {
      var map = new Map({
        bounds: [[0, 1], [2, 3]]
      });

      expect(map.get('view_bounds_sw')).toEqual([0, 1]);
      expect(map.get('view_bounds_ne')).toEqual([2, 3]);
      expect(map.get('original_view_bounds_sw')).toEqual([0, 1]);
      expect(map.get('original_view_bounds_ne')).toEqual([2, 3]);
      expect(map.get('bounds')).toBeUndefined();
    });

    it('should set the center and zoom if no bounds are given', function () {
      var map = new Map({
        center: [41.40282319070747, 2.3435211181640625],
        zoom: 10
      });

      expect(map.get('center')).toEqual([41.40282319070747, 2.3435211181640625]);
      expect(map.get('original_center')).toEqual([41.40282319070747, 2.3435211181640625]);
      expect(map.get('zoom')).toEqual(10);
    });

    it('should set the default center and zoom if no center and bounds are given', function () {
      var map = new Map({});

      expect(map.get('center')).toEqual(map.defaults.center);
      expect(map.get('original_center')).toEqual(map.defaults.center);
      expect(map.get('zoom')).toEqual(map.defaults.zoom);
    });

    it('should parse the center when given a string', function () {
      var map = new Map({
        center: '[41.40282319070747, 2.3435211181640625]'
      });

      expect(map.get('center')).toEqual([41.40282319070747, 2.3435211181640625]);
    });
  });

  it("should raise only one change event on setBounds", function() {
    var c = 0;
    map.bind('change:view_bounds_ne', function() {
      c++;
    });
    map.setBounds([[1,2],[1,2]]);
    expect(c).toEqual(1);
  });

  it("should not change center or zoom when the bounds are not ok", function() {
    var c = 0;
    map.bind('change:center', function() {
      c++;
    });
    map.setBounds([[1,2],[1,2]]);
    expect(c).toEqual(0);
  });

  it("should not change bounds when map size is 0", function() {
    map.set('zoom', 10);
    var bounds = [[43.100982876188546, 35.419921875], [60.23981116999893, 69.345703125]]
    map.fitBounds(bounds, {x: 0, y: 0});
    expect(map.get('zoom')).toEqual(10);
  });

  it("should adjust zoom to layer", function() {
    expect(map.get('maxZoom')).toEqual(map.defaults.maxZoom);
    expect(map.get('minZoom')).toEqual(map.defaults.minZoom);

    var layer = new PlainLayer({ minZoom: 5, maxZoom: 25 });
    map.layers.reset(layer);

    expect(map.get('maxZoom')).toEqual(25);
    expect(map.get('minZoom')).toEqual(5);

    var layer = new PlainLayer({ minZoom: "7", maxZoom: "31" });
    map.layers.reset(layer);

    expect(map.get('maxZoom')).toEqual(31);
    expect(map.get('minZoom')).toEqual(7);
  });

  it("shouldn't set a NaN zoom", function() {
    var layer = new PlainLayer({ minZoom: NaN, maxZoom: NaN });
    map.layers.reset(layer);

    expect(map.get('maxZoom')).toEqual(map.defaults.maxZoom);
    expect(map.get('minZoom')).toEqual(map.defaults.minZoom);
  });

  it('should update the attributions of the map when layers are reset/added/removed', function() {
    map = new Map();
    map.instantiateMap();

    // Map has the default CartoDB attribution
    expect(map.get('attribution')).toEqual([
      "CartoDB <a href=\"http://cartodb.com/attributions\" target=\"_blank\">attribution</a>"
    ]);

    var layer1 = new CartoDBLayer({ attribution: 'attribution1' });
    var layer2 = new CartoDBLayer({ attribution: 'attribution1' });
    var layer3 = new CartoDBLayer({ attribution: 'wadus' });
    var layer4 = new CartoDBLayer({ attribution: '' });

    map.layers.reset([ layer1, layer2, layer3, layer4 ]);

    // Attributions have been updated removing duplicated and empty attributions
    expect(map.get('attribution')).toEqual([
      "attribution1",
      "wadus",
      "CartoDB <a href=\"http://cartodb.com/attributions\" target=\"_blank\">attribution</a>",
    ]);

    var layer = new CartoDBLayer({ attribution: 'attribution2' });

    map.layers.add(layer);

    // The attribution of the new layer has been appended before the default CartoDB attribution
    expect(map.get('attribution')).toEqual([
      "attribution1",
      "wadus",
      "attribution2",
      "CartoDB <a href=\"http://cartodb.com/attributions\" target=\"_blank\">attribution</a>",
    ]);

    layer.set('attribution', 'new attribution');

    // The attribution of the layer has been updated in the map
    expect(map.get('attribution')).toEqual([
      "attribution1",
      "wadus",
      "new attribution",
      "CartoDB <a href=\"http://cartodb.com/attributions\" target=\"_blank\">attribution</a>",
    ]);

    map.layers.remove(layer);

    expect(map.get('attribution')).toEqual([
      "attribution1",
      "wadus",
      "CartoDB <a href=\"http://cartodb.com/attributions\" target=\"_blank\">attribution</a>",
    ]);

    // Addind a layer with the default attribution
    var layer = new CartoDBLayer();

    map.layers.add(layer, { at: 0 });

    // Default CartoDB only appears once and it's the last one
    expect(map.get('attribution')).toEqual([
      "attribution1",
      "wadus",
      "CartoDB <a href=\"http://cartodb.com/attributions\" target=\"_blank\">attribution</a>",
    ]);
  });

  describe('bindings to collection of layers', function () {
    it('should reload the map when layers are resetted', function () {
      spyOn(map, 'reload');

      map.layers.reset([{ id: 'layer1' }]);

      expect(map.reload).toHaveBeenCalled();
    });

    it('should reload the map when a new layer is added', function () {
      spyOn(map, 'reload');

      map.layers.add({ id: 'layer1' });

      expect(map.reload).toHaveBeenCalledWith({
        sourceLayerId: 'layer1'
      });
    });

    it('should reload the map when a layer is removed', function () {
      var layer = map.layers.add({ id: 'layer1' });

      spyOn(map, 'reload');

      map.layers.remove(layer);

      expect(map.reload).toHaveBeenCalledWith({
        sourceLayerId: 'layer1'
      });
    });
  });

  describe('reload', function () {
    it('should be debounced', function (done) {
      var windshaftMap = jasmine.createSpyObj('windshaftMap', ['createInstance']);
      var map = new Map({}, {
        windshaftMap: windshaftMap
      });

      // Reload the map 1000 times in a row
      for (var i = 0; i < 1000; i++) {
        map.reload();
      }

      setTimeout(function () {
        expect(windshaftMap.createInstance).toHaveBeenCalled();

        // windshaftMap.createInstance is debounced and has only been called once
        expect(windshaftMap.createInstance.calls.count()).toEqual(1);
        done();
      }, 25);
    });

    it('should forward options', function (done) {
      var windshaftMap = jasmine.createSpyObj('windshaftMap', ['createInstance']);
      var map = new Map({}, {
        windshaftMap: windshaftMap
      });

      map.reload({
        a: 1,
        b: 2,
        sourceLayerId: 'sourceLayerId',
        forceFetch: 'forceFetch',
        success: 'success'
      });

      setTimeout(function () {
        expect(windshaftMap.createInstance).toHaveBeenCalledWith({
          sourceLayerId: 'sourceLayerId',
          forceFetch: 'forceFetch',
          success: 'success'
        });

        done();
      }, 25);
    });
  });

  describe('API methods', function () {
    beforeEach(function () {
      var windshaftMap = jasmine.createSpyObj('windshaftMap', ['createInstance']);
      this.map = new Map({}, {
        windshaftMap: windshaftMap
      });
    });

    var testCases = [
      {
        createMethod: 'createCartoDBLayer',
        expectedLayerModelClass: CartoDBLayer,
        testAttributes: {
          sql: 'something',
          cartocss: 'else'
        },
        expectedErrorMessage: 'The following attributes are missing: sql,cartocss'
      },
      {
        createMethod: 'createTorqueLayer',
        expectedLayerModelClass: TorqueLayer,
        testAttributes: {
          sql: 'something',
          cartocss: 'else'
        },
        expectedErrorMessage: 'The following attributes are missing: sql,cartocss'
      },
      {
        createMethod: 'createTileLayer',
        expectedLayerModelClass: TileLayer,
        testAttributes: {
          urlTemplate: 'http://example.com'
        },
        expectedErrorMessage: 'The following attributes are missing: urlTemplate'
      },
      {
        createMethod: 'createWMSLayer',
        expectedLayerModelClass: WMSLayer,
        testAttributes: {
          urlTemplate: 'http://example.com'
        },
        expectedErrorMessage: 'The following attributes are missing: urlTemplate'
      },
      {
        createMethod: 'createGMapsBaseLayer',
        expectedLayerModelClass: GMapsBaseLayer,
        testAttributes: {
          base_type: 'http://example.com'
        },
        expectedErrorMessage: 'The following attributes are missing: base_type'
      },
      {
        createMethod: 'createPlainLayer',
        expectedLayerModelClass: PlainLayer,
        testAttributes: {
          color: '#FABADA'
        },
        expectedErrorMessage: 'The following attributes are missing: image|color'
      },
      {
        createMethod: 'createPlainLayer',
        expectedLayerModelClass: PlainLayer,
        testAttributes: {
          image: 'http://example.com/image.png'
        },
        expectedErrorMessage: 'The following attributes are missing: image|color'
      }
    ];

    _.each(testCases, function (testCase) {
      describe('.' + testCase.createMethod, function () {
        it('should throw an error if no properties are given', function () {
          expect(function () {
            this.map[testCase.createMethod]({});
          }.bind(this)).toThrowError(testCase.expectedErrorMessage);
        });

        it('should return a layer of the corresponding type', function () {
          var layer = this.map[testCase.createMethod](testCase.testAttributes);
          expect(layer instanceof testCase.expectedLayerModelClass).toBeTruthy();
        });

        it('should add the layer model to the collection of layers', function () {
          var layer = this.map[testCase.createMethod](testCase.testAttributes);
          expect(this.map.layers.at(0)).toEqual(layer);
        });

        it('should add the layer model at the given position', function () {
          var layer1 = this.map[testCase.createMethod](testCase.testAttributes);

          var layer0 = this.map[testCase.createMethod](testCase.testAttributes, { at: 0 });
          var layer2 = this.map[testCase.createMethod](testCase.testAttributes, { at: 2 });

          expect(this.map.layers.at(0)).toEqual(layer0);
          expect(this.map.layers.at(1)).toEqual(layer1);
          expect(this.map.layers.at(2)).toEqual(layer2);
        });
      });
    }, this);

    describe('.reCenter', function () {
      it('should set the original bounds if present', function () {
        var map = new Map({
          bounds: [[1, 2], [3, 4]],
          center: '[41.40282319070747, 2.3435211181640625]'
        });

        // Change internal attributes
        map.set({
          view_bounds_sw: 'something',
          view_bounds_ne: 'else',
          center: 'different'
        });

        map.reCenter();

        expect(map.get('view_bounds_sw')).toEqual([1, 2]);
        expect(map.get('view_bounds_ne')).toEqual([3, 4]);
      });

      it('should set the original center if bounds are not present', function () {
        var map = new Map({
          center: [41.40282319070747, 2.3435211181640625]
        });

        map.set({
          center: 'different'
        });

        map.reCenter();

        expect(map.get('center')).toEqual([ 41.40282319070747, 2.3435211181640625 ]);
      });
    });
  });

  describe('.getLayerById', function () {
    beforeEach(function () {
      var layer1 = new CartoDBLayer({ id: 'xyz-123', attribution: 'attribution1' });

      map.layers.reset(layer1);
    });

    it('should return the corresponding model for given id', function () {
      expect(map.getLayerById('xyz-123')).toBeDefined();
      expect(map.getLayerById('meh')).toBeUndefined();
    });
  });
});

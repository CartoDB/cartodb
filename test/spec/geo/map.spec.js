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
    expect(map.get('maxZoom')).toEqual(40);
    expect(map.get('minZoom')).toEqual(0);

    var layer = new PlainLayer({ minZoom: 5, maxZoom: 20 });
    map.layers.reset(layer);
    expect(map.get('maxZoom')).toEqual(20);
    expect(map.get('minZoom')).toEqual(5);

    var layer = new PlainLayer({ minZoom: "7", maxZoom: "31" });
    map.layers.reset(layer);
    expect(map.get('maxZoom')).toEqual(31);
    expect(map.get('minZoom')).toEqual(7);
  });

  it("shouldn't set a NaN zoom", function() {
    var layer = new PlainLayer({ minZoom: NaN, maxZoom: NaN });
    map.layers.reset(layer);
    expect(map.get('maxZoom')).toEqual(40);
    expect(map.get('minZoom')).toEqual(0);
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
  })

  describe('reload', function () {
    it ('should be debounced', function (done) {
      var windshaftMap = jasmine.createSpyObj('windshaftMap', ['createInstance']);
      var map = new Map({}, {
        windshaftMap: windshaftMap
      });

      // Reload the map 1000 times in a row
      for (var i = 0; i < 1000; i++) {
        map.reload();
      }

      _.defer(function () {
        expect(windshaftMap.createInstance).toHaveBeenCalled();

        // windshaftMap.createInstance is debounced and has only been called once
        expect(windshaftMap.createInstance.calls.count()).toEqual(1);
        done();
      });
    });
  });

  describe('API methods', function () {
    beforeEach(function () {
      var windshaftMap = jasmine.createSpyObj('windshaftMap', ['createInstance']);
      this.map = new Map({}, {
        windshaftMap: windshaftMap
      });
    });

    describe('.createCartoDBLayer', function () {
      it('should throw an error if no properties are given', function () {
        expect(function () {
          this.map.createCartoDBLayer({});
        }.bind(this)).toThrowError('The following attributes are missing: sql,cartocss');
      });

      it('should return a layer of the corresponding type', function () {
        var layer = this.map.createCartoDBLayer({
          sql: 'something',
          cartocss: 'else'
        });
        expect(layer instanceof CartoDBLayer).toBeTruthy();
      });

      it('should add the layer model to the collection of layers', function () {
        var layer = this.map.createCartoDBLayer({
          sql: 'something',
          cartocss: 'else'
        });
        expect(this.map.layers.at(0)).toEqual(layer);
      });
    });

    describe('.createTorqueLayer', function () {
      it('should throw an error if no properties are given', function () {
        expect(function () {
          this.map.createTorqueLayer({});
        }.bind(this)).toThrowError('The following attributes are missing: sql,cartocss');
      });

      it('should return a layer of the corresponding type', function () {
        var layer = this.map.createTorqueLayer({
          sql: 'something',
          cartocss: 'else'
        });
        expect(layer instanceof TorqueLayer).toBeTruthy();
      });

      it('should add the layer model to the collection of layers', function () {
        var layer = this.map.createTorqueLayer({
          sql: 'something',
          cartocss: 'else'
        });
        expect(this.map.layers.at(0)).toEqual(layer);
      });
    });

    describe('.createTileLayer', function () {
      it('should throw an error if no properties are given', function () {
        expect(function () {
          this.map.createTileLayer({});
        }.bind(this)).toThrowError('The following attributes are missing: urlTemplate');
      });

      it('should return a layer of the corresponding type', function () {
        var layer = this.map.createTileLayer({
          urlTemplate: 'http://example.com'
        });
        expect(layer instanceof TileLayer).toBeTruthy();
      });

      it('should add the layer model to the collection of layers', function () {
        var layer = this.map.createTileLayer({
          urlTemplate: 'http://example.com'
        });
        expect(this.map.layers.at(0)).toEqual(layer);
      });
    });

    describe('.createWMSLayer', function () {
      it('should throw an error if no properties are given', function () {
        expect(function () {
          this.map.createWMSLayer({});
        }.bind(this)).toThrowError('The following attributes are missing: urlTemplate');
      });

      it('should return a layer of the corresponding type', function () {
        var layer = this.map.createWMSLayer({
          urlTemplate: 'http://example.com'
        });
        expect(layer instanceof WMSLayer).toBeTruthy();
      });

      it('should add the layer model to the collection of layers', function () {
        var layer = this.map.createWMSLayer({
          urlTemplate: 'http://example.com'
        });
        expect(this.map.layers.at(0)).toEqual(layer);
      });
    });

    describe('.createGMapsBaseLayer', function () {
      it('should throw an error if no properties are given', function () {
        expect(function () {
          this.map.createGMapsBaseLayer({});
        }.bind(this)).toThrowError('The following attributes are missing: base_type');
      });

      it('should return a layer of the corresponding type', function () {
        var layer = this.map.createGMapsBaseLayer({
          base_type: 'http://example.com'
        });
        expect(layer instanceof GMapsBaseLayer).toBeTruthy();
      });

      it('should add the layer model to the collection of layers', function () {
        var layer = this.map.createGMapsBaseLayer({
          base_type: 'http://example.com'
        });
        expect(this.map.layers.at(0)).toEqual(layer);
      });
    });

    describe('.createPlainLayer', function () {
      it('should throw an error if no properties are given', function () {
        expect(function () {
          this.map.createPlainLayer({});
        }.bind(this)).toThrowError('The following attributes are missing: color');
      });

      it('should return a layer of the corresponding type', function () {
        var layer = this.map.createPlainLayer({
          color: '#FABADA'
        });
        expect(layer instanceof PlainLayer).toBeTruthy();
      });

      it('should add the layer model to the collection of layers', function () {
        var layer = this.map.createPlainLayer({
          color: '#FABADA'
        });
        expect(this.map.layers.at(0)).toEqual(layer);
      });
    });

    describe('.createBackgroundLayer', function () {
      it('should throw an error if no properties are given', function () {
        expect(function () {
          this.map.createBackgroundLayer({});
        }.bind(this)).toThrowError('The following attributes are missing: image');
      });

      it('should return a layer of the corresponding type', function () {
        var layer = this.map.createBackgroundLayer({
          image: 'http://example.com/image.png'
        });
        expect(layer instanceof PlainLayer).toBeTruthy();
      });

      it('should add the layer model to the collection of layers', function () {
        var layer = this.map.createBackgroundLayer({
          image: 'http://example.com/image.png'
        });
        expect(this.map.layers.at(0)).toEqual(layer);
      });
    });
  });
});

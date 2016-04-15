var $ = require('jquery');
var Backbone = require('backbone');
var CartoDBLayer = require('../../../src/geo/map/cartodb-layer');
var CartoDBLayerGroupAnonymousMap = require('../../../src/geo/cartodb-layer-group-anonymous-map');

describe('geo/layer-group-anonymous-map', function () {
  beforeEach(function () {
    this.layersCollection = new Backbone.Collection();
  });

  // TODO: This test is a bit useless
  it('should be type layergroup', function () {
    var layerGroup = new CartoDBLayerGroupAnonymousMap(null, {
      layersCollection: this.layersCollection
    });
    expect(layerGroup.get('type')).toEqual('layergroup');
  });

  describe('fetchAttributes', function () {
    it('should calculate indexes correctly', function () {
      var cartoDBLayer1 = new CartoDBLayer();
      var cartoDBLayer2 = new CartoDBLayer();

      spyOn($, 'ajax').and.callFake(function (options) {
        options.success('attributes!');
      });

      var layerGroup = new CartoDBLayerGroupAnonymousMap({
        baseURL: 'http://wadus.com'
      }, {
        layersCollection: this.layersCollection
      });
      this.layersCollection.reset([cartoDBLayer1, cartoDBLayer2]);

      var callback = jasmine.createSpy('callback');

      layerGroup.fetchAttributes(0, 1000, callback);

      expect(callback).toHaveBeenCalledWith('attributes!');
      expect($.ajax.calls.mostRecent().args[0].url).toEqual('http://wadus.com/0/attributes/1000');

      layerGroup.fetchAttributes(1, 10, callback);

      expect(callback).toHaveBeenCalledWith('attributes!');
      expect($.ajax.calls.mostRecent().args[0].url).toEqual('http://wadus.com/1/attributes/10');

      // Hide the first layer
      cartoDBLayer1.set('visible', false, { silent: true });

      // We fetch the attributes of layer #1
      layerGroup.fetchAttributes(1, 100, callback);

      expect(callback).toHaveBeenCalledWith('attributes!');
      // There's only one visible layer now so layer #1 (in the context of the CartoDB.js) is layer #0 for
      // Windshaft (hidden layers are not sent to Windhsaft)
      expect($.ajax.calls.mostRecent().args[0].url).toEqual('http://wadus.com/0/attributes/100');
    });
  });

  describe('getTileJSONFromTiles', function () {
    it('should be undefined if urls are not present', function () {
      var layerGroup = new CartoDBLayerGroupAnonymousMap(null, {
        layersCollection: this.layersCollection
      });

      expect(layerGroup.getTileJSONFromTiles(0)).toBeUndefined();
    });

    it('should generate the TileJSON when all layers are visible', function () {
      var cartoDBLayer1 = new CartoDBLayer();
      var cartoDBLayer2 = new CartoDBLayer();

      var layerGroup = new CartoDBLayerGroupAnonymousMap({
        baseURL: 'http://wadus.com'
      }, {
        layersCollection: this.layersCollection
      });
      this.layersCollection.reset([cartoDBLayer1, cartoDBLayer2]);

      layerGroup.set('urls', {
        tiles: [
          'TILE URLS'
        ],
        grids: [
          [ 'GRID URLS FOR LAYER #0 (#O FOR WINDHSAFT)' ],
          [ 'GRID URLS FOR LAYER #1 (#1 FOR WINDHSAFT)' ]
        ]
      });

      expect(layerGroup.getTileJSONFromTiles(0)).toEqual({
        tilejson: '2.0.0',
        scheme: 'xyz',
        grids: [
          'GRID URLS FOR LAYER #0 (#O FOR WINDHSAFT)'
        ],
        tiles: [
          'TILE URLS'
        ],
        formatter: jasmine.any(Function)
      });

      expect(layerGroup.getTileJSONFromTiles(1)).toEqual({
        tilejson: '2.0.0',
        scheme: 'xyz',
        grids: [
          'GRID URLS FOR LAYER #1 (#1 FOR WINDHSAFT)'
        ],
        tiles: [
          'TILE URLS'
        ],
        formatter: jasmine.any(Function)
      });
    });

    it('should NOT include grid URLs for hidden layers', function () {
      var cartoDBLayer1 = new CartoDBLayer();
      var cartoDBLayer2 = new CartoDBLayer();

      var layerGroup = new CartoDBLayerGroupAnonymousMap({
        baseURL: 'http://wadus.com'
      }, {
        layersCollection: this.layersCollection
      });
      this.layersCollection.reset([cartoDBLayer1, cartoDBLayer2]);

      layerGroup.set('urls', {
        tiles: [
          'TILE URLS'
        ],
        grids: [
          [
            'GRID URLS FOR LAYER #1 (#O FOR WINDHSAFT)'
          ]
        ]
      });

      // Hide the bottom layer
      cartoDBLayer1.set('visible', false, { silent: true });

      // Layer #0 doesn't have URLs for grids (case it was hidden)
      expect(layerGroup.getTileJSONFromTiles(0)).toEqual({
        tilejson: '2.0.0',
        scheme: 'xyz',
        grids: undefined,
        tiles: [
          'TILE URLS'
        ],
        formatter: jasmine.any(Function)
      });

      // Layer #1 has the right URLs for grids
      expect(layerGroup.getTileJSONFromTiles(1)).toEqual({
        tilejson: '2.0.0',
        scheme: 'xyz',
        grids: [
          'GRID URLS FOR LAYER #1 (#O FOR WINDHSAFT)'
        ],
        tiles: [
          'TILE URLS'
        ],
        formatter: jasmine.any(Function)
      });
    });
  });
});

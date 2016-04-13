var $ = require('jquery');
var Backbone = require('backbone');
var CartoDBLayer = require('../../../src/geo/map/cartodb-layer');
var CartoDBLayerGroupBase = require('../../../src/geo/cartodb-layer-group-base');

var MyCartoDBLayerGroup = CartoDBLayerGroupBase.extend({
  _convertToWindshaftLayerIndex: function () {}
});

describe('geo/cartodb-layer-group-base', function () {
  beforeEach(function () {
    this.layersCollection = new Backbone.Collection();
  });

  describe('fetchAttributes', function () {
    it('should trigger a request to the right URL', function () {
      var callback = jasmine.createSpy('callback');
      var cartoDBLayer1 = new CartoDBLayer();

      var layer = new MyCartoDBLayerGroup({
        baseURL: 'http://wadus.com'
      }, {
        layersCollection: this.layersCollection
      });
      this.layersCollection.reset([ cartoDBLayer1 ]);

      spyOn(layer, '_convertToWindshaftLayerIndex').and.returnValue(0);
      spyOn($, 'ajax').and.callFake(function (options) {
        options.success('attributes!');
      });

      layer.fetchAttributes(0, 1000, callback);

      expect(callback).toHaveBeenCalledWith('attributes!');
      expect($.ajax.calls.mostRecent().args[0].url).toEqual('http://wadus.com/0/attributes/1000');
    });

    it('should not trigger a request when the layer index is invalid and callback should return null', function () {
      var callback = jasmine.createSpy('callback');
      var cartoDBLayer1 = new CartoDBLayer();

      var layer = new MyCartoDBLayerGroup({
        baseURL: 'http://wadus.com'
      }, {
        layersCollection: this.layersCollection
      });
      this.layersCollection.reset([ cartoDBLayer1 ]);

      spyOn(layer, '_convertToWindshaftLayerIndex').and.returnValue(-1);
      spyOn($, 'ajax').and.callFake(function (options) {
        options.success('attributes!');
      });

      layer.fetchAttributes(999, 1000, callback);

      expect(callback).toHaveBeenCalledWith(null);
      expect($.ajax).not.toHaveBeenCalled();
    });

    it('should invoke the callback with null when the ajax request fails', function () {
      var callback = jasmine.createSpy('callback');
      var cartoDBLayer1 = new CartoDBLayer();

      var layer = new MyCartoDBLayerGroup({
        baseURL: 'http://wadus.com'
      }, {
        layersCollection: this.layersCollection
      });
      this.layersCollection.reset([ cartoDBLayer1 ]);

      spyOn(layer, '_convertToWindshaftLayerIndex').and.returnValue(-1);
      spyOn($, 'ajax').and.callFake(function (options) {
        options.error('error!');
      });

      layer.fetchAttributes(999, 1000, callback);

      expect(callback).toHaveBeenCalledWith(null);
      expect($.ajax).not.toHaveBeenCalled();
    });

    it('should use an api_key if WindhsaftMap has one', function () {
      var callback = jasmine.createSpy('callback');
      var cartoDBLayer1 = new CartoDBLayer();

      var layer = new MyCartoDBLayerGroup({
        apiKey: 'THE_API_KEY',
        baseURL: 'http://wadus.com'
      }, {
        layersCollection: this.layersCollection
      });
      this.layersCollection.reset([ cartoDBLayer1 ]);

      spyOn(layer, '_convertToWindshaftLayerIndex').and.returnValue(0);
      spyOn($, 'ajax').and.callFake(function (options) {
        options.success('attributes!');
      });

      layer.fetchAttributes(0, 1000, callback);

      expect(callback).toHaveBeenCalledWith('attributes!');
      expect($.ajax.calls.mostRecent().args[0].url).toEqual('http://wadus.com/0/attributes/1000?api_key=THE_API_KEY');
    });
  });
});

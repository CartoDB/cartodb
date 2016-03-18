var $ = require('jquery');
var Backbone = require('backbone');
var CartoDBLayer = require('../../../src/geo/map/cartodb-layer');
var CartoDBLayerGroupBase = require('../../../src/geo/cartodb-layer-group-base');

var MyCartoDBLayerGroup = CartoDBLayerGroupBase.extend({
  _convertToWindshaftLayerIndex: function () {}
});

describe('geo/cartodb-layer-group-base', function () {
  beforeEach(function () {
    this.windshaftMap = new Backbone.Model();
  });

  it('should be bound to the WindshaftMap and respond to changes on the instance', function () {
    var layerGroup = new MyCartoDBLayerGroup(null, {
      windshaftMap: this.windshaftMap
    });

    expect(layerGroup.get('baseURL')).not.toBeDefined();
    expect(layerGroup.get('urls')).not.toBeDefined();

    this.windshaftMap.getBaseURL = function () {};
    this.windshaftMap.getTiles = function () {};

    spyOn(this.windshaftMap, 'getBaseURL').and.returnValue('baseURL');
    spyOn(this.windshaftMap, 'getTiles').and.returnValue('tileJSON');

    // A new instance is created
    this.windshaftMap.trigger('instanceCreated', this.windshaftMap, {});

    // Assert that layerGroup has been updated
    expect(layerGroup.get('baseURL')).toEqual('baseURL');
    expect(layerGroup.get('urls')).toEqual('tileJSON');
  });

  describe('fetchAttributes', function () {
    it('should trigger a request to the right URL', function () {
      var callback = jasmine.createSpy('callback');
      var cartoDBLayer1 = new CartoDBLayer();

      var layer = new MyCartoDBLayerGroup({
        baseURL: 'http://wadus.com'
      }, {
        windshaftMap: this.windshaftMap,
        layers: [ cartoDBLayer1 ]
      });

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
        windshaftMap: this.windshaftMap,
        layers: [ cartoDBLayer1 ]
      });

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
        windshaftMap: this.windshaftMap,
        layers: [ cartoDBLayer1 ]
      });

      spyOn(layer, '_convertToWindshaftLayerIndex').and.returnValue(-1);
      spyOn($, 'ajax').and.callFake(function (options) {
        options.error('error!');
      });

      layer.fetchAttributes(999, 1000, callback);

      expect(callback).toHaveBeenCalledWith(null);
      expect($.ajax).not.toHaveBeenCalled();
    });
  });
});

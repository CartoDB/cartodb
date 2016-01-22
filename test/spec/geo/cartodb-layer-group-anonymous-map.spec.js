var $ = require('jquery');
var Backbone = require('backbone');
var CartoDBLayer = require('../../../src/geo/map/cartodb-layer');
var CartoDBLayerGroupAnonymousMap = require('../../../../src/geo/cartodb-layer-group-anonymous-map');

describe('geo/layer-group-anonymous-map', function () {
  beforeEach(function () {
    this.windshaftMap = jasmine.createSpyObj('windshaftMap', ['isNamedMap', 'isAnonymousMap']);
    this.windshaftMap.isAnonymousMap.and.returnValue(true);
    this.windshaftMap.instance = new Backbone.Model();
  });

  // TODO: This test is a bit useless
  it('should be type layergroup', function () {
    var layer = new CartoDBLayerGroupAnonymousMap(null, {
      windshaftMap: this.windshaftMap
    });
    expect(layer.get('type')).toEqual('layergroup');
  });

  describe('fetchAttributes', function () {

    it ('should calculate indexes correctly', function () {
      var cartoDBLayer1 = new CartoDBLayer();
      var cartoDBLayer2 = new CartoDBLayer();

      spyOn($, 'ajax').and.callFake(function (options) {
        options.success('attributes!');
      });

      var layer = new CartoDBLayerGroupAnonymousMap({
        baseURL: 'http://wadus.com'
      }, {
        windshaftMap: this.windshaftMap,
        layers: [ cartoDBLayer1, cartoDBLayer2]
      });
      var callback = jasmine.createSpy('callback');

      layer.fetchAttributes(0, 1000, callback);

      expect(callback).toHaveBeenCalledWith('attributes!');
      expect($.ajax.calls.mostRecent().args[0].url).toEqual('http://wadus.com/0/attributes/1000');

      layer.fetchAttributes(1, 10, callback);

      expect(callback).toHaveBeenCalledWith('attributes!');
      expect($.ajax.calls.mostRecent().args[0].url).toEqual('http://wadus.com/1/attributes/10');

      // Hide the first layer
      cartoDBLayer1.set('visible', false);

      // We fetch the attributes of layer #1
      layer.fetchAttributes(1, 100, callback);

      expect(callback).toHaveBeenCalledWith('attributes!');
      // There's only one visible layer now so layer #1 (in the context of the CartoDB.js) is layer #0 for
      // Windshaft (hidden layers are not sent to Windhsaft)
      expect($.ajax.calls.mostRecent().args[0].url).toEqual('http://wadus.com/0/attributes/100');
    });
  });
});

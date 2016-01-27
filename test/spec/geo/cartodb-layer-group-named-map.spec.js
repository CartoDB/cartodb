var $ = require('jquery');
var Backbone = require('backbone');
var CartoDBLayer = require('../../../src/geo/map/cartodb-layer');
var CartoDBLayerGroupNamed = require('../../../src/geo/cartodb-layer-group-named-map');

describe('geo/cartodb-layer-group-named-map', function () {
  beforeEach(function () {
    this.windshaftMap = new Backbone.Model();
  });

  // TODO: This test is a bit useless
  it('should be type namedmap', function () {
    var layer = new CartoDBLayerGroupNamed(null, {
      windshaftMap: this.windshaftMap
    });
    expect(layer.get('type')).toEqual('namedmap');
  });

  describe('fetchAttributes', function () {
    it('should calculate indexes correctly', function () {
      var cartoDBLayer1 = new CartoDBLayer();
      var cartoDBLayer2 = new CartoDBLayer();

      spyOn($, 'ajax').and.callFake(function (options) {
        options.success('attributes!');
      });

      var layer = new CartoDBLayerGroupNamed({
        baseURL: 'http://wadus.com'
      }, {
        windshaftMap: this.windshaftMap,
        layers: [cartoDBLayer1, cartoDBLayer2]
      });
      var callback = jasmine.createSpy('callback');

      layer.fetchAttributes(0, 1000, callback);

      expect(callback).toHaveBeenCalledWith('attributes!');
      // Named maps have a base layer in Windshaft and that's why layer #0 is #1 for Windshaft
      expect($.ajax.calls.mostRecent().args[0].url).toEqual('http://wadus.com/1/attributes/1000');

      layer.fetchAttributes(1, 10, callback);

      expect(callback).toHaveBeenCalledWith('attributes!');
      expect($.ajax.calls.mostRecent().args[0].url).toEqual('http://wadus.com/2/attributes/10');

      // Hide the first layer
      cartoDBLayer1.set('visible', false, { silent: true });

      // We fetch the attributes of layer #1
      layer.fetchAttributes(1, 100, callback);

      expect(callback).toHaveBeenCalledWith('attributes!');

      // Namedmaps have all layers in the template so the indexes don't change when layers bellow
      // are hidden
      expect($.ajax.calls.mostRecent().args[0].url).toEqual('http://wadus.com/2/attributes/100');
    });
  });
});

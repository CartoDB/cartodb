var $ = require('jquery');
var Layers = require('../../../src/geo/map/layers');
var CartoDBLayer = require('../../../src/geo/map/cartodb-layer');
var CartoDBLayerGroupAnonymousMap = require('../../../src/geo/cartodb-layer-group-anonymous-map');

describe('geo/layer-group-anonymous-map', function () {
  beforeEach(function () {
    this.layersCollection = new Layers();
    this.vis = jasmine.createSpyObj('vis', ['reload']);
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
      var cartoDBLayer1 = new CartoDBLayer({}, { vis: this.vis });
      var cartoDBLayer2 = new CartoDBLayer({}, { vis: this.vis });

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
});

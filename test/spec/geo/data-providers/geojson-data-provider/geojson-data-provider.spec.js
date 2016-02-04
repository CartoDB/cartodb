var _ = require('underscore');
var GeoJSONDataProvider = require('../../../../../src/geo/data-providers/geojson/geojson-data-provider');

fdescribe('src/geo/data-providers/geojson/geojson-data-provider.js', function () {

  it('should trigger a FeaturesChanged event when the features on the layerView have changed', function () {
    var vectorLayerView = jasmine.createSpyObj('vectorLayerView', ['_on', 'getFeatures']);

    var callbackForLayer0 = jasmine.createSpy('callback');
    var providerForLayer0 = new GeoJSONDataProvider(vectorLayerView, 0);
    providerForLayer0.bind('featuresChanged', callbackForLayer0);

    var callbackForLayer1 = jasmine.createSpy('callback');
    var providerForLayer1 = new GeoJSONDataProvider(vectorLayerView, 1);
    providerForLayer1.bind('featuresChanged', callbackForLayer1);

    // Event is fired
    var featuresChangedCallbacks = _.map(vectorLayerView._on.calls.all(), function (call) {
      return call.args[1];
    });
    _.each(featuresChangedCallbacks, function (callback) {
      callback([
        [
          { a: 'b' }
        ],
        [
          { b: 'c' }
        ]
      ]);
    });

    expect(callbackForLayer0).toHaveBeenCalledWith([
      { a: 'b' }
    ]);

    expect(callbackForLayer1).toHaveBeenCalledWith([
      { b: 'c' }
    ]);
  });
});

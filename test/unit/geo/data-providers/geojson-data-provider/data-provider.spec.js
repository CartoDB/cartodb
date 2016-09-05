var _ = require('underscore');
var GeoJSONDataProvider = require('../../../../../src/geo/data-providers/geojson/data-provider');

describe('src/geo/data-providers/geojson/data-provider.js', function () {
  it('should trigger a dataChanged event when new features are available', function () {
    var vectorLayerView = jasmine.createSpyObj('vectorLayerView', ['_on']);

    var callbackForLayer0 = jasmine.createSpy('callback');
    var providerForLayer0 = new GeoJSONDataProvider(vectorLayerView, 0);
    providerForLayer0.bind('dataChanged', callbackForLayer0);

    var callbackForLayer1 = jasmine.createSpy('callback');
    var providerForLayer1 = new GeoJSONDataProvider(vectorLayerView, 1);
    providerForLayer1.bind('dataChanged', callbackForLayer1);

    // Event is fired
    _.each(vectorLayerView._on.calls.all(), function (call) {
      call.args[1]();
    });

    expect(callbackForLayer0).toHaveBeenCalledWith();

    expect(callbackForLayer1).toHaveBeenCalledWith();
  });
});

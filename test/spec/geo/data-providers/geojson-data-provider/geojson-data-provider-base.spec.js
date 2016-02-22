var _ = require('underscore');
var GeoJSONDataProviderBase = require('../../../../../src/geo/data-providers/geojson/geojson-data-provider-base');

var MyProvider = function () {
  GeoJSONDataProviderBase.apply(this, arguments);
};
_.extend(MyProvider.prototype, GeoJSONDataProviderBase.prototype);
MyProvider.prototype.getData = function () {
  if (this._layerIndex === 0) {
    return [
      { a: 'b' }
    ];
  }
  return [
    { b: 'c' }
  ];
};

describe('src/geo/data-providers/geojson/geojson-data-provider-base.js', function () {
  it('should trigger a dataChanged event when new features are available', function () {
    var vectorLayerView = jasmine.createSpyObj('vectorLayerView', ['_on']);

    var callbackForLayer0 = jasmine.createSpy('callback');
    var providerForLayer0 = new MyProvider({
      dataview: jasmine.createSpyObj('dataview', ['wathever']),
      vectorLayerView: vectorLayerView,
      layerIndex: 0
    });
    providerForLayer0.bind('dataChanged', callbackForLayer0);

    var callbackForLayer1 = jasmine.createSpy('callback');
    var providerForLayer1 = new MyProvider({
      dataview: jasmine.createSpyObj('dataview', ['wathever']),
      vectorLayerView: vectorLayerView,
      layerIndex: 1
    });
    providerForLayer1.bind('dataChanged', callbackForLayer1);

    // Event is fired
    _.each(vectorLayerView._on.calls.all(), function (call) {
      call.args[1]();
    });

    expect(callbackForLayer0).toHaveBeenCalledWith([
      { a: 'b' }
    ]);

    expect(callbackForLayer1).toHaveBeenCalledWith([
      { b: 'c' }
    ]);
  });
});

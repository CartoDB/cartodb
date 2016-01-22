var Backbone = require('backbone');
var CartoDBLayerGroupBase = require('../../../../src/geo/map/cartodb-layer-group-base');

var MyCartoDBLayerGroup = CartoDBLayerGroupBase;

describe('geo/map/cartodb-layer-group-base', function () {
  beforeEach(function () {
    this.windshaftMap = jasmine.createSpyObj('windshaftMap', ['isNamedMap', 'isAnonymousMap']);
    this.windshaftMap.isAnonymousMap.and.returnValue(true);
    this.windshaftMap.instance = new Backbone.Model();
  });

  it('should be bound to the WindshaftMap and respond to changes on the instance', function () {
    var layerGroup = new MyCartoDBLayerGroup(null, {
      windshaftMap: this.windshaftMap
    });

    expect(layerGroup.get('baseURL')).not.toBeDefined();
    expect(layerGroup.get('urls')).not.toBeDefined();

    this.windshaftMap.instance.getBaseURL = function () { return 'baseURL'; };
    this.windshaftMap.instance.getTiles = function () { return 'urls'; };

    // Change something on the windshaftMap instance
    this.windshaftMap.instance.set('layergroupid', 10000);

    // Assert that layerGroup has been updated
    expect(layerGroup.get('baseURL')).toEqual('baseURL');
    expect(layerGroup.get('urls')).toEqual('urls');
  });
});

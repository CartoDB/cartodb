var Backbone = require('backbone');
var CartoDBLayerGroupNamed = require('../../../../src/geo/map/cartodb-layer-group-named');

describe('geo/map/cartodb-layer-group-named', function () {
  beforeEach(function () {
    this.windshaftMap = jasmine.createSpyObj('windshaftMap', ['isNamedMap', 'isAnonymousMap']);
    this.windshaftMap.isAnonymousMap.and.returnValue(true);
    this.windshaftMap.instance = new Backbone.Model();
  });

  // TODO: This test is a bit useless
  it('should be type namedmap', function () {
    var layer = new CartoDBLayerGroupNamed(null, {
      windshaftMap: this.windshaftMap
    });
    expect(layer.get('type')).toEqual('namedmap');
  });
});

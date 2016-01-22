var Backbone = require('backbone');
var CartoDBLayerGroupAnonymous = require('../../../../src/geo/map/cartodb-layer-group-anonymous');

describe('geo/map/cartodb-layer-group-anonymous', function () {
  beforeEach(function () {
    this.windshaftMap = jasmine.createSpyObj('windshaftMap', ['isNamedMap', 'isAnonymousMap']);
    this.windshaftMap.isAnonymousMap.and.returnValue(true);
    this.windshaftMap.instance = new Backbone.Model();
  });

  // TODO: This test is a bit useless
  it('should be type layergroup', function () {
    var layer = new CartoDBLayerGroupAnonymous(null, {
      windshaftMap: this.windshaftMap
    });
    expect(layer.get('type')).toEqual('layergroup');
  });
});

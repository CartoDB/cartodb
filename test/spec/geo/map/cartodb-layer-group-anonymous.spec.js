var CartoDBLayerGroupAnonymous = require('../../../../src/geo/map/cartodb-layer-group-anonymous');

describe('geo/map/cartodb-layer-group-anonymous', function() {
  it("should be type layergroup", function() {
    var layer = new CartoDBLayerGroupAnonymous();
    expect(layer.get('type')).toEqual("layergroup");
  });
});

var CartoDBLayerGroupNamed = require('cdb/geo/map/cartodb-layer-group-named');

describe('geo/map/cartodb-layer-group-named', function() {
  it("should be type namedmap", function() {
    var layer = new CartoDBLayerGroupNamed();
    expect(layer.get('type')).toEqual("namedmap");
  });
});

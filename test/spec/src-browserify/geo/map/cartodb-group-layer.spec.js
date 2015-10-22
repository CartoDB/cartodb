var CartoDBGroupLayer = require('../../../../../src-browserify/geo/map/cartodb-group-layer');

describe('geo/map/cartodb-group-layer', function() {
  it("should be type layergroup", function() {
    var layer = new CartoDBGroupLayer();
    expect(layer.get('type')).toEqual("layergroup");
  });
});

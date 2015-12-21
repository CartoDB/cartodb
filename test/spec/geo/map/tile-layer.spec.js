var TileLayer = require('../../../../src/geo/map/tile-layer');

describe('TileLayer', function() {
  it("should be type tiled", function() {
    var layer = new TileLayer();
    expect(layer.get('type')).toEqual("Tiled");
  });
});

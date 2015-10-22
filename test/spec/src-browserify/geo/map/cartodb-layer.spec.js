var Config = require('../../../../../src-browserify/core/config');
require('config-proxy').set(new Config())
var CartoDBLayer = require('../../../../../src-browserify/geo/map/cartodb-layer');

describe('geo/map/cartodb-layer', function() {
  it("should be type CartoDB", function() {
    var layer = new CartoDBLayer();
    expect(layer.get('type')).toEqual("CartoDB");
  });
});

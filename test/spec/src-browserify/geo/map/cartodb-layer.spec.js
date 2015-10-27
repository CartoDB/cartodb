var config = require('../../../../../src-browserify/cdb.config');
var configProxy = require('config-proxy');

var CartoDBLayer = require('../../../../../src-browserify/geo/map/cartodb-layer');

describe('geo/map/cartodb-layer', function() {
  beforeEach(function() {
    configProxy.set(config);
  });

  it("should be type CartoDB", function() {
    var layer = new CartoDBLayer();
    expect(layer.get('type')).toEqual("CartoDB");
  });
});

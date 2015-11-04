var config = require('cdb.config');
var CartoDBLayer = require('cdb/geo/map/cartodb-layer');

describe('geo/map/cartodb-layer', function() {
  it("should be type CartoDB", function() {
    var layer = new CartoDBLayer();
    expect(layer.get('type')).toEqual("CartoDB");
  });
});

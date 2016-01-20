var Backbone = require('backbone');
var CartoDBLayerGroupNamed = require('../../../../src/geo/map/cartodb-layer-group-named');

describe('geo/map/cartodb-layer-group-named', function() {

  // TODO: This test is a bit useless
  it("should be type namedmap", function() {
    var windshaftMap = {
      instance: new Backbone.Model()
    };

    var layer = new CartoDBLayerGroupNamed(null, {
      windshaftMap: windshaftMap
    });
    expect(layer.get('type')).toEqual("namedmap");
  });
});

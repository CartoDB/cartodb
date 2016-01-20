var Backbone = require('backbone');
var CartoDBLayerGroupAnonymous = require('../../../../src/geo/map/cartodb-layer-group-anonymous');

describe('geo/map/cartodb-layer-group-anonymous', function() {
  
  // TODO: This test is a bit useless
  it("should be type layergroup", function () {
    var windshaftMap = {
      instance: new Backbone.Model()
    }
    var layer = new CartoDBLayerGroupAnonymous(null, {
      windshaftMap: windshaftMap
    });
    expect(layer.get('type')).toEqual("layergroup");
  });

  it("should be bound to the WindshaftMap and respond to changes on the instance", function () {
    var windshaftMap = {
      instance: new Backbone.Model()
    };
    var layer = new CartoDBLayerGroupAnonymous(null, {
      windshaftMap: windshaftMap
    });

    expect(layer.get('baseURL')).not.toBeDefined();
    expect(layer.get('urls')).not.toBeDefined();

    // TODO: Use a real thing here?
    windshaftMap.instance.getBaseURL = function () {
      return 'baseURL';
    };
    windshaftMap.instance.getTiles = function () {
      return 'urls';
    };

    // Change something on the windshaftMap instance
    windshaftMap.instance.set('layergroupid', 10000);

    // Assert that layerGroup has been updated
    expect(layer.get('baseURL')).toEqual("baseURL");
    expect(layer.get('urls')).toEqual("urls");
  });
});

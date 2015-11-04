var GMapsBaseLayer = require('cdb/geo/map/gmaps-base-layer');

describe('GMapsBaseLayer', function() {
  it("should be type GMapsBase", function() {
    var layer = new GMapsBaseLayer();
    expect(layer.get('type')).toEqual("GMapsBase");
  });
});

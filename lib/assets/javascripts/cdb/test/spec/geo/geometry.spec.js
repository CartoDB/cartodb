describe("Geometry", function() {
  it("isPoint should return true when is a point", function() {
    var geojsonFeature = {
        "type": "Point",
        "coordinates": [-104.99404, 39.75621]
    };
    var g = new cdb.geo.Geometry({
      geojson: geojsonFeature
    });
    expect(g.isPoint()).toEqual(true);
    g.set('geojson', {type: 'Polygon'});
    expect(g.isPoint()).toEqual(false);
  });
});


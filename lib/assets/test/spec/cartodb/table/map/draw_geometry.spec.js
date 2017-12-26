
describe("drawer", function() {

  var mapview;
  beforeEach(function() {
    var mapViewClass = cdb.geo.LeafletMapView;
    mapView = new mapViewClass({
      el: $('<div>'),
      map: new cdb.geo.Map()
    });
  });
  it("should create a polygon", function() {
    var p = new PolygonDrawTool({
      mapview: mapView
    });

    p.start();

    mapView.trigger('click', null, [0, 0]);
    mapView.trigger('click', null, [0, 1]);
    mapView.trigger('click', null, [1, 1]);
    mapView.trigger('click', null, [2, 3]);

    expect(p.getGeoJSON()).toEqual({
      type: "MultiPolygon",
      coordinates: [
        [[
          [0, 0], [1, 0], [1, 1], [3, 2], [0, 0]
        ]]
      ]
    });

  });

  it("should create a line", function() {
    var p = new PolylineDrawTool({
      mapview: mapView
    });

    p.start();

    mapView.trigger('click', null, [0, 0]);
    mapView.trigger('click', null, [0, 1]);
    mapView.trigger('click', null, [1, 1]);
    mapView.trigger('click', null, [2, 3]);

    expect(p.getGeoJSON()).toEqual({
      type: "MultiLineString",
      coordinates: [
        [
          [0, 0], [1, 0], [1, 1], [3, 2]
        ]
      ]
    });

  });

  it("should create a point", function() {
    var p = new PointDrawTool({
      mapview: mapView
    });

    p.start();

    mapView.trigger('click', null, [0, 1]);

    expect(p.getGeoJSON()).toEqual({
      type: "Point",
      coordinates: [1, 0]
    });

  });
});

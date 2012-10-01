
describe("GeomEditor", function() {

  var view, table;
  beforeEach(function() {
    table = TestUtil.createTable();
    view = new cdb.admin.GeometryEditor({
      model: table
    });
    var mapViewClass = cdb.geo.LeafletMapView;
    var mapView = new mapViewClass({
      el: $('<div>'),
      map: new cdb.geo.Map()
    });
    view.mapView = mapView;
  });

  it("user clicks on a geometry should finish editing the current one", function() {
    spyOn(view, 'finishEditing');
    view._editGeom(new cdb.geo.Geometry({
      the_geom:'{"type":"Point","coordinates":[-0.13163,51.512354]}'
    }));
    expect(view.finishEditing).toHaveBeenCalled();

  });
});

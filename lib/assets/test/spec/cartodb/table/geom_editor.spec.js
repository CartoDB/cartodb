
describe("GeomEditor", function() {

  var view, table;
  beforeEach(function() {
    table = TestUtil.createTable();
    view = new cdb.admin.GeometryEditor({
      el: $('<div>'),
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
    view.render();
    var row = new cdb.geo.Geometry({
      the_geom:'{"type":"Point","coordinates":[-0.13163,51.512354]}'
    });
    spyOn(row, 'save');
    view.editGeom(row);
    view.$('.done').trigger('click');
    expect(row.save).toHaveBeenCalled();

  });

  it("user clicks on discard the row should be the same", function() {
    view.render();
    var tg = '{"type":"Point","coordinates":[-0.13163,51.512354]}';
    var row = new cdb.geo.Geometry({
      the_geom: tg
    });
    view.editGeom(row);
    spyOn(row, 'save');
    row.set('the_geom', '{"type":"Point","coordinates":[1, 2]}');
    view.$('.discard').trigger('click');
    expect(row.save).not.toHaveBeenCalled();
    expect(row.get('the_geom')).toEqual(tg);

  });
});

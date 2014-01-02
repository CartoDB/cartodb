
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
    row.fetch = function(o) {
      o.success();
    }
    view.editGeom(row);
    view.$('.done').trigger('click');
    expect(row.save).toHaveBeenCalled();
  });

  it("if the geometry is tooooo big, you cannot edit it", function() {
    view.render();

    var the_geom = [];
    for (i=0; i < 2001; i++) {
      the_geom.push([[0,0]])
    }

    var row = new cdb.geo.Geometry({
      the_geom: JSON.stringify({type: "Point", coordinates: the_geom})
    });

    spyOn(view, '_showStopEdit');
    row.fetch = function(o) {
      o.success();
    }
    view.editGeom(row);
    expect(view._showStopEdit).toHaveBeenCalled();
  });

  it("user clicks on discard the row should be the same", function() {
    view.render();
    var tg = '{"type":"Point","coordinates":[-0.13163,51.512354]}';
    var row = new cdb.geo.Geometry({
      the_geom: tg
    });
    row.fetch = function(o) {
      o.success();
    }
    view.editGeom(row);
    spyOn(row, 'save');
    row.set('the_geom', '{"type":"Point","coordinates":[1, 2]}');
    view.$('.discard').trigger('click');
    expect(row.save).not.toHaveBeenCalled();
    expect(row.get('the_geom')).toEqual(tg);
  });

  var _new_geom = function(t) {
    view.render();
    var row = table.data().newRow();
    view.createGeom(row, t);
    spyOn(row, 'save');
    row.set('the_geom', '{"type":"Point", "geometry": {"coordinates":[1, 2]}}');
    view._mapClick(null, [4, 5]);
    view.$('.done').trigger('click');
    expect(row.save).toHaveBeenCalled();
    return row;
  };

  /*it("should create a new point geometry", function() {
    var row = _new_geom('point');
    expect(JSON.parse(row.get('the_geom')).coordinates).toEqual([5, 4]);
  });

  it("should create a new polygon geometry", function() {
    var row = _new_geom('polygon');
    expect(JSON.parse(row.get('the_geom')).coordinates[0][0][0]).toEqual([5, 4]);
  });*/
});

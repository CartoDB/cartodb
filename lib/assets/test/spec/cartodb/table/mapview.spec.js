
describe("mapview", function() {

  var view;
  beforeEach(function() {
    var table = TestUtil.createTable('test');
    var infowindow = new cdb.geo.ui.InfowindowModel({ });
    var map = new cdb.admin.Map();
    view = new cdb.admin.MapTab({
      model: map,
      table: table,
      infowindow: infowindow
    });
  });

  it("should render", function() {
    view.render();
    expect(view.$('#map').length).toEqual(1);
    expect(view.$('.base_maps').length).toEqual(1);
    expect(view.$('.share').length).toEqual(1);
  });

});

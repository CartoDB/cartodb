
describe("mapview public", function() {

  var view;
  beforeEach(function() {
    this.table = TestUtil.createTable('test');
    var infowindow = new cdb.geo.ui.InfowindowModel({ });
    var map = new cdb.open.PublicMap();
    view = new cdb.open.PublicMapTab({
      model: map,
      table: this.table,
      infowindow: infowindow
    });
  });

  it("should render", function() {
    view.render();
    expect(view.$('.cartodb-map').length).toEqual(1);
  });

  it("should not render the private components", function() {
    view.render();
    expect(view.$('.base_maps').length).toEqual(0);
    expect(view.$('.share').length).toEqual(0);
  })

});

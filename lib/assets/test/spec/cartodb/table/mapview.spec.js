
describe("mapview", function() {

  var view;
  beforeEach(function() {
    var table = TestUtil.createTable('test');
    var infowindow = new cdb.geo.ui.InfowindowModel({ });
    var map = new cdb.admin.Map();
    map.layers.add(new cdb.geo.MapLayer());
    map.layers.add(new cdb.geo.MapLayer());

    view = new cdb.admin.MapTab({
      model: map,
      table: table,
      infowindow: infowindow,
      menu: new cdb.admin.RightMenu({})
    });
    // view.baseLayerChooser = {
    //   render: function() {
    //     return {
    //       "el": "dummy"
    //     }
    //   }
    // }
    // view._bindDataLayer(map.get('dataLayer').cid);

  });

  it("should render", function() {
    view.render();
    expect(view.$('#map').length).toEqual(1);
    expect(view.$('.base_maps').length).toEqual(1);
    expect(view.$('.share').length).toEqual(1);
  });

  xit("should refresh the layer when a change is made on the table", function() {
    var called = false;
    view.render();
    view.layerDataView.reload = function() {
      called = true;
    }

    table._data.trigger('change');

    expect(called).toBeTruthy();
  })

});

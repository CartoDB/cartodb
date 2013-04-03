
describe("mapview", function() {

  var view;
  beforeEach(function() {
    var table = TestUtil.createTable('test');
    var infowindow = new cdb.geo.ui.InfowindowModel({ });
    var map = new cdb.admin.Map();
    var layer = new cdb.admin.CartoDBLayer({
      table_name: 'test'
    });
    map.layers.add(layer);
    map.layers.add(new cdb.admin.CartoDBLayer({
      table_name: 'test2',
      tile_style: 'style',
      user_name: 'test'
    }));
    var element = $('<div><div class="cartodb-map"></div></div>');
    element.appendTo($('body'))
    view = new cdb.admin.MapTab({
      model: map,
      menu: new cdb.admin.RightMenu({}),
      el: element,
      baseLayers: new cdb.admin.Layers([ new cdb.admin.TileLayer({ urlTemplate: 'rabos'}) ])
    });
    view.enableMap();
    view.setActiveLayer(layer);
  });

  afterEach(function() {
    localStorage.clear();
    view.$el.html('').remove();
    $('.dropdown').remove();
  })

  it("should render the map container", function() {
    view.render();
    expect(view.$('.cartodb-map').length).toEqual(1);
  });

  it("should render the basemap_dropdown", function() {
    view.render();
    expect(view.$('.basemap_dropdown').length).toEqual(1);
  });

  it("should render the share button", function() {
    view.render();
    expect(view.$('.share').length).toEqual(1);
  });

  it("should trigger the georef warning when there's no geom in the table", function() {
    view.bindGeoRefCheck();
    view.render();
    view.table.trigger("dataLoaded");
    expect(view.noGeoRefDialog).toBeTruthy()
  });

  it("should trigger the georef warning when there's no data in the table", function() {
    view.table = TestUtil.createTable('test', [['the_geom', 'geometry']]);
    view.bindGeoRefCheck();
    view.render();
    view.table.trigger("dataLoaded");
    expect(view.noGeoRefDialog).toBeTruthy()
  });

  it("should NOT trigger the georef warning when there the_geom and data in the table", function() {
    view.table = TestUtil.createTable('test', [['the_geom', 'geometry']]);
    view.table._data.reset([{'the_geom':'{"type":"Point","coordinates":["1","1"]}'}])
    view.bindGeoRefCheck();
    view.render();
    view.table.trigger("dataLoaded");
    expect(view.noGeoRefDialog).toBeFalsy()
  });

  it("should trigger the georef warning only once when there's no geom in the table", function() {
    view.bindGeoRefCheck();
    view.render();
    view.table.trigger("dataLoaded");
    view.noGeoRefDialog = undefined;
    view.table.trigger("dataLoaded");
    expect(view.noGeoRefDialog).toBeFalsy()
  })

  it("should trigger the georef only once warning when there's no data in the table", function() {
    view.table = TestUtil.createTable('test', [['the_geom', 'geometry']]);
    view.bindGeoRefCheck();
    view.render();
    view.table.trigger("dataLoaded");
    view.noGeoRefDialog = undefined;
    view.table.trigger("dataLoaded");
    expect(view.noGeoRefDialog).toBeFalsy()
  });

  it("should trigger the georef again when formerly there were any data and now there are data but not georeferenced", function() {
    view.table = TestUtil.createTable('test', [['the_geom', 'geometry'], ['name','string']]);
    view.bindGeoRefCheck();
    view.render();
    view.table.trigger("dataLoaded");
    view.noGeoRefDialog = undefined;
    view.table._data.reset([{'name':'tralará'}])
    view.table.trigger("dataLoaded");
    expect(view.noGeoRefDialog).toBeTruthy()
  });

});


describe("mapview", function() {

  var view, layerView;
  beforeEach(function() {
    var table = TestUtil.createTable('test');
    var infowindow = new cdb.geo.ui.InfowindowModel({ });
    var vis = TestUtil.createVis("jam");
    var map = new cdb.admin.Map();
    var layer = new cdb.admin.CartoDBLayer({
      table_name: 'test',
      tile_style: 'test',
      user_name: 'test'
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
      vis: vis,
      menu: new cdb.admin.RightMenu({}),
      geocoder: new cdb.admin.Geocoding('', table),
      el: element,
      baseLayers: new cdb.admin.Layers([ new cdb.admin.TileLayer({ urlTemplate: 'rabos'}) ])
    });
    view.enableMap();

    layerView = new cdb.admin.LayerPanelView({
      model: layer,
      vis: TestUtil.createVis(),
      user: TestUtil.createUser('jamon'),
      globalError: new cdb.admin.GlobalError({ el: $('<div>') })
    });
    view.setActiveLayer(layerView);
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

  it("should trigger the georef warning when there's no geom in the table", function() {
    view.bindGeoRefCheck();
    view.render();
    view.table.trigger("dataLoaded");
    expect(view.noGeoRefDialog).toBeTruthy()
  });

  it("should trigger the georef warning when there's no data in the table", function() {
    view.table = TestUtil.createTable('test', [['the_geom', 'geometry']], []);
    view.bindGeoRefCheck();
    view.render();
    view.table.trigger("dataLoaded");
    expect(view.noGeoRefDialog).toBeTruthy()
  });

  it("should NOT trigger the georef warning when there the_geom and data in the table", function() {
    view.table = TestUtil.createTable('test', [['the_geom', 'geometry']], []);
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
    view.table = TestUtil.createTable('test', [['the_geom', 'geometry']], []);
    view.bindGeoRefCheck();
    view.render();
    view.table.trigger("dataLoaded");
    view.noGeoRefDialog = undefined;
    view.table.trigger("dataLoaded");
    expect(view.noGeoRefDialog).toBeFalsy()
  });

  it("should trigger the georef again when formerly there were any data and now there are data but not georeferenced", function() {
    view.table = TestUtil.createTable('test', [['the_geom', 'geometry'], ['name','string']], []);
    view.bindGeoRefCheck();
    view.render();
    view.table.trigger("dataLoaded");
    view.noGeoRefDialog = undefined;
    view.table._data.reset([{'name':'tralará'}])
    view.table.trigger("dataLoaded");
    expect(view.noGeoRefDialog).toBeTruthy()
  });


  it("should have a geocoding binding each time map view is rendered", function() {
    view.render();
    spyOn(view.layerModel.table, 'fetch');
    view.options.geocoder.trigger('geocodingComplete');
    expect(view.layerModel.table.fetch).toHaveBeenCalled();
    view.clearMap();
    view.render();
    view.options.geocoder.trigger('geocodingComplete');
    expect(view.layerModel.table.fetch).toHaveBeenCalled();
    // It has to be 2, because layerModel doesn't change,
    // just the map view. So it means the callback has been
    // requested twice.
    expect(view.layerModel.table.fetch.calls.count()).toBe(2);
  });

  it("should bind new geometry event in the current layer view", function() {
    spyOn(view.geometryEditor, 'createGeom');
    layerView.model.trigger('startEdition','point');
    expect(view.geometryEditor.createGeom).toHaveBeenCalled();
  });

});

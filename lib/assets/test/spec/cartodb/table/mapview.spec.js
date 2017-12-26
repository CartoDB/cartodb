describe('mapview', function () {

  var view, layerView, master_vis;

  beforeEach(function () {
    var table = TestUtil.createTable('test');
    var vis = TestUtil.createVis('jam');
    master_vis = TestUtil.createVis('jam');
    var map = new cdb.admin.Map();
    var layer = new cdb.admin.CartoDBLayer({
      table_name: 'test',
      tile_style: 'test',
      user_name: 'test',
      attribution: 'attribution1'
    });
    map.layers.add(layer);
    map.layers.add(new cdb.admin.CartoDBLayer({
      table_name: 'test2',
      tile_style: 'style',
      user_name: 'test',
      attribution: 'attribution2'
    }));
    var element = $('<div><div class="cartodb-map"></div></div>');
    element.appendTo($('body'));

    view = new cdb.admin.MapTab({
      user: TestUtil.createUser('jamon'),
      model: map,
      vis: vis,
      master_vis: master_vis,
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

  afterEach(function () {
    if (view.options.geocoder.dlg) view.options.geocoder.dlg.hide();
    if (view.noGeoRefDialog) view.noGeoRefDialog.clean();
    if (view.pecanDialog) view.pecanDialog.clean();
    localStorage.clear();
    view.remove();
    $('.dropdown').remove();
  });

  it('should render the map container', function () {
    view.render();
    expect(view.$('.cartodb-map').length).toEqual(1);
  });

  it('should render the basemap_dropdown', function () {
    view.render();
    expect(view.$('.basemap_dropdown').length).toEqual(1);
  });

  xit('should trigger the georef warning when none of the rows contain geom info', function () {
    view.table = TestUtil.createTable('test', [['the_geom', 'geometry'], ['name', 'string']], []);
    view.table._data.reset([
      {'the_geom': '', 'name': 'Benidorm'},
      {'the_geom': '', 'name': 'San Juan'}
    ]);
    view.bindGeoRefCheck();
    view.render();
    view.table.trigger('dataLoaded');
    expect(view.noGeoRefDialog).toBeTruthy();
  });

  xit('should trigger the georef warning only once when there is no geom in the table', function () {
    view.table = TestUtil.createTable('test', [['the_geom', 'geometry'], ['name', 'string']], []);
    view.table._data.reset([
      {'the_geom': '', 'name': 'Benidorm'}
    ]);
    view.bindGeoRefCheck();
    view.render();
    view.table.trigger('dataLoaded');
    view.noGeoRefDialog.clean();
    view.noGeoRefDialog = undefined;
    view.table.trigger('dataLoaded');
    expect(view.noGeoRefDialog === undefined).toEqual(true);
  });

  xit('should trigger the georef warning when there is no geom in the table and there was a table with the same name in the past', function () {
    view.table = TestUtil.createTable('test', [['the_geom', 'geometry'], ['name', 'string']], [], '12345');
    view.table._data.reset([
      {'the_geom': '', 'name': 'Benidorm'}
    ]);
    view.bindGeoRefCheck();
    view.render();
    view.table.trigger('dataLoaded');
    expect(view.noGeoRefDialog === undefined).toEqual(false);

    // Clean that view to reuse it
    view.noGeoRefDialog.clean();
    view.noGeoRefDialog = undefined;

    // New table with the same name (test)
    view.table = TestUtil.createTable('test', [['the_geom', 'geometry']], [], '45678');
    view.table._data.reset([
      {'the_geom': ''}
    ]);
    view.bindGeoRefCheck();
    view.table.trigger('dataLoaded');
    expect(view.noGeoRefDialog === undefined).toEqual(false);
  });

  it('should NOT trigger the georef warning when there is no data in the table', function () {
    view.table = TestUtil.createTable('test', [['the_geom', 'geometry']], []);
    view.bindGeoRefCheck();
    view.render();
    view.table.trigger('dataLoaded');
    expect(view.noGeoRefDialog === undefined).toEqual(true);
  });

  it('should NOT trigger the georef warning when there is some data with geom info', function () {
    view.table = TestUtil.createTable('test', [['the_geom', 'geometry'], ['name', 'string']], []);
    view.table._data.reset([
      {'the_geom': '{"type":"Point","coordinates":["1","1"]}', 'name': 'Benidorm'},
      {'the_geom': '', 'name': 'San Juan'}
    ]);
    view.bindGeoRefCheck();
    view.render();
    view.table.trigger('dataLoaded');
    // toBeFalsy failes due a infinite loop in jasmine formatter
    expect(view.noGeoRefDialog === undefined).toEqual(true);
  });

  it('should trigger the no-geo warning when there is data without geom info and it is in read-only mode', function () {
    view.table = TestUtil.createTable('test', [['the_geom', 'geometry'], ['name', 'string']], [], '12345');
    spyOn(view.table, 'isSync').and.returnValue(true);
    spyOn(view.table, 'data').and.returnValue(['hello']);
    view.bindGeoRefCheck();
    view.render();
    view.table.trigger('dataLoaded');
    expect(view.noGeoRefDialog === undefined).toEqual(true);
    expect(view.noGeoWarningDialog === undefined).toEqual(false);
  });

  it('should have a geocoding binding each time map view is rendered', function () {
    view.render();
    spyOn(view.layerModel.table, 'fetch');
    view.options.geocoder.trigger('geocodingComplete');
    expect(view.layerModel.table.fetch).not.toHaveBeenCalled();
    view.clearMap();
    view.render();
    view.options.geocoder.trigger('geocodingComplete');
    expect(view.layerModel.table.fetch).not.toHaveBeenCalled();
    // It has to be 0, no more calls for table fetch, tableTab does it now
    expect(view.layerModel.table.fetch.calls.count()).toBe(0);
  });

  it('should bind new geometry event in the current layer view', function () {
    spyOn(view.geometryEditor, 'createGeom');
    layerView.model.trigger('startEdition', 'point');
    expect(view.geometryEditor.createGeom).toHaveBeenCalled();
  });

  it('should bind new geometry event in the current layer view', function () {
    spyOn(view.geometryEditor, 'createGeom');
    layerView.model.trigger('startEdition', 'point');
    expect(view.geometryEditor.createGeom).toHaveBeenCalled();
  });

  it('should switch map type when master vis change type', function () {
    master_vis.set('type', 'table');
    spyOn(view, 'switchMapType');
    master_vis.set('type', 'derived');
    expect(view.switchMapType).toHaveBeenCalled();
  });

  it('should render attributions of each layer and default CARTO attribution', function () {
    var attributions = view.$el.find('.leaflet-control-attribution').html();
    expect(attributions).toEqual('attribution1, attribution2, © <a href="https://carto.com/attributions" target="_blank">CARTO</a>');
  });

  describe('cdb.admin.MapTab.updateDataLayerView', function () {
    describe('given MapTab view has a cdb.CartoDB.Layer as data layer view', function () {
      beforeEach(function () {
        spyOn(view.layerDataView, 'invalidate');
        view.updateDataLayerView();
      });

      it('should invalidate the data layer view (e.g. to reload tiles)', function () {
        expect(view.layerDataView.invalidate).toHaveBeenCalled();
      });
    });
  });
});

describe("Actions menu", function() {

  var view, vis, sqlView, user, server;

  beforeEach(function() {
    vis = TestUtil.createVis();
    master_vis = TestUtil.createVis();
    sqlView = new cdb.admin.SQLViewData(null, { sql: 'select * from a' });
    table = new cdb.admin.CartoDBTableMetadata({ name: 'test1' });
    user = new cdb.admin.User({
      base_url: 'http://test.carto.com',
      id: 1,
      name: 'test',
      limits: { concurrent_imports: 1 },
      remaining_byte_quota: 1000,
      salesforce: { enabled: false },
      twitter: { enabled: true },
      mailchimp: { enabled: false }
    });

    window.table_router = {};

    cdb.config.set({
      upgrade_url: 'whatever',
      cartodb_com_hosted: false
    });

    view = new cdb.admin.LayersPanel({
      vis: vis,
      master_vis: master_vis,
      user: user,
      globalError: new cdb.admin.GlobalError({ el: $('<div>') })
    });

    vis.map.layers.reset([
      new cdb.geo.MapLayer(),
      new cdb.admin.CartoDBLayer({
        type: 'CartoDB',
        table_name: 'test_table_1'
      }),
      new cdb.admin.CartoDBLayer({
        type: 'CartoDB',
        table_name: 'test_table_2'
      })
    ]);

    server = sinon.fakeServer.create();
  });

  it("should render a layer panel for each layer in the map", function() {
    expect(_.keys(view.tabs).length).toEqual(2);
  });

  it("should add a layer panel when layers is added to the map", function() {
    spyOn(view, '_bindLayerTooltip');
    vis.map.layers.add(new cdb.admin.CartoDBLayer({ table_name: 'test_table_3' }));
    expect(_.keys(view.tabs).length).toEqual(3);
    expect(view._bindLayerTooltip).toHaveBeenCalled();
  });

  it("should set current layer when added a new layer", function() {
    var layer = new cdb.admin.CartoDBLayer({ table_name: 'test_table_3' });
    spyOn(view, '_switchTo');
    vis.map.layers.add(layer);
    expect(view.map.layers.getLayersByType('CartoDB').length).toBe(3);
    expect(view._switchTo).toHaveBeenCalled();
  });

  it("should set active layer when active-menu initilizes or layers change", function() {
    spyOn(view, '_setDefaultLayer');
    vis.map.layers.reset([
      new cdb.geo.MapLayer(),
      new cdb.admin.CartoDBLayer({ table_name: 'test_table_1'}),
      new cdb.admin.CartoDBLayer({ table_name: 'test_table_2'})
    ]);
    expect(view._setDefaultLayer).toHaveBeenCalled();
  });

  it("should add a layers panels when on reset layers", function() {
    vis.map.layers.reset([
      new cdb.admin.CartoDBLayer({ table_name: 'test_table_4' }),
      new cdb.admin.CartoDBLayer({ table_name: 'test_table_5' })
    ]);
    expect(_.keys(view.tabs).length).toEqual(2);
  });

  it("should show", function() {
    spyOn(view.$el, 'animate');
    view.show('table');
    expect(view.$el.animate).toHaveBeenCalled();
    expect(view.model.get('open')).toEqual(true);
    expect(view.model.get('activeWorkView')).toEqual('table');
  });

  it("should hide", function() {
    spyOn(view.$el, 'animate');
    view.render().hide();
    expect(view.$el.animate).toHaveBeenCalled();
    expect(view.model.get('open')).toEqual(false);
  });

  it("should open delete layer modal on delete event on a layer", function() {
    spyOn(cdb.editor.DeleteLayerView.prototype, 'initialize').and.callThrough();
    var last_layer = view.layer_panels[1];
    last_layer.trigger('delete', last_layer);
    expect(cdb.editor.DeleteLayerView.prototype.initialize).toHaveBeenCalled();
  });

  it("should show tools", function() {
    var p = view.getActivePane()
    spyOn(p, 'setActiveWorkView')
    view.setActiveWorkView('table');
    expect(p.setActiveWorkView).toHaveBeenCalledWith('table');
  });

  it("should ask create vis first when vis of type", function() {
    // can't add more layers to a table
    var masterVisId = view.master_vis.cid;
    var visId = view.vis.cid;
    spyOn(cdb.editor.CreateVisFirstView.prototype, 'initialize').and.callThrough();
    view.$('.add_layer').click();
    expect(cdb.editor.CreateVisFirstView.prototype.initialize).toHaveBeenCalled();
    expect(view.createVisDlg).toBeDefined();
    expect(view.createVisDlg.model.cid).toBe(masterVisId);
    expect(view.createVisDlg.model.cid).not.toBe(visId);
  });

  it("should open new layer modal when vis if of type derived (i.e. map)", function() {
    vis.set('type', 'derived');
    spyOn(cdb.editor.AddLayerModel.prototype, 'initialize').and.callThrough();
    view.$('.add_layer').click();
    expect(cdb.editor.AddLayerModel.prototype.initialize).toHaveBeenCalled();
  });

  it("should order layers when removes a layer", function() {
    spyOn(view, '_manageLayers');
    var last_layer = view.layer_panels[1];
    last_layer.model.destroy();
    expect(view._manageLayers).toHaveBeenCalled();
  });

  it("should order layers when adds a layer", function() {
    var layer = new cdb.admin.CartoDBLayer({ table_name: 'test_table_3' });
    spyOn(view, '_manageLayers');
    vis.map.layers.add(layer);
    expect(view._manageLayers).toHaveBeenCalled();
  });

  it("should manage layers when active layer changes", function() {
    var first_layer = view.layer_panels[0];
    spyOn(view, '_manageLayers');
    first_layer.trigger('switchTo', first_layer);
    expect(view._manageLayers).toHaveBeenCalled();
  });

  it("should set other current layer if the previous saved one doesn't exist", function() {
    spyOn(view, '_switchTo');

    vis.map.layers.reset([
      new cdb.geo.MapLayer(),
      new cdb.admin.CartoDBLayer({ table_name: 'test_table_1' })
    ]);

    expect(view._switchTo).toHaveBeenCalled();
  });

  it("should not save visualization if the active layer does not change", function() {
    vis.set('active_layer_id', 2);
    var layers = [
      new cdb.admin.CartoDBLayer({ id: 1, table_name: 'test_table_1' }),
      new cdb.admin.CartoDBLayer({ id: 2, table_name: 'test_table_2' })
    ];
    vis.map.layers.reset(layers);
    view._switchTo(view.layer_panels[1]);
    expect(view.vis.get('active_layer_id')).toEqual(2);
    spyOn(view.vis, 'save')
    view._switchTo(view.layer_panels[1]);
    expect(view.vis.save).not.toHaveBeenCalled();
  });

  describe('limits dialog', function() {

    beforeEach(function() {
      spyOn(user, 'canAddLayerTo').and.returnValue(false);
      spyOn(view, '_createAddLayerDialog').and.callThrough();
      spyOn(cdb.editor.CreateVisFirstView.prototype, 'initialize').and.callThrough();
      spyOn(cdb.editor.LimitsReachView.prototype, 'initialize').and.callThrough();
      vis.map.layers.reset([
        new cdb.admin.CartoDBLayer({ type: 'CartoDB', id: 1, table_name: 'test_table_1' }),
        new cdb.admin.CartoDBLayer({ type: 'CartoDB', id: 2, table_name: 'test_table_2' })
      ]);
      vis.set('type', 'derived');
    });

    it('should show reached limits dialog when user has all the allowed layers for a map', function() {
      view.$('.add_layer a.info').click();
      expect(view._createAddLayerDialog).not.toHaveBeenCalled();
      expect(cdb.editor.CreateVisFirstView.prototype.initialize).not.toHaveBeenCalled();
      expect(cdb.editor.LimitsReachView.prototype.initialize).toHaveBeenCalled();
    });

    it('should show reached limits dialog when user has more than the allowed layers for a map', function() {
      var limits = user.get('limits');
      limits.max_layers = 1;
      user.set('limits', limits);
      view.$('.add_layer a.info').click();
      expect(view._createAddLayerDialog).not.toHaveBeenCalled();
      expect(cdb.editor.CreateVisFirstView.prototype.initialize).not.toHaveBeenCalled();
      expect(cdb.editor.LimitsReachView.prototype.initialize).toHaveBeenCalled();
    });

  });

  it("should not have leaks", function() {
    expect(view).toHaveNoLeaks();
  });

  afterEach(function() {
    cdb.config.unset('upgrade_url');
    cdb.config.unset('cartodb_com_hosted');
    window.table_router = undefined;
    delete window.table_router;
  });
});

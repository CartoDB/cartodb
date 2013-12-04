describe("cdb.admin.LayerPanelView", function() {

  var view;
  var map, table, sqlView, user, layer, vis;
  beforeEach(function() {
    map = new cdb.admin.Map();

    user = new cdb.admin.User({
      username: 'testusername',
      api_key: 'rabos'
    });

    vis = new cdb.admin.Visualization({
      id: 'abcde',
      map_id:  96,
      name:    "test_table",
      privacy: "PUBLIC",
      type:    "table"
    });

    var globalError = new cdb.admin.GlobalError({
      el: $('<div>')
    });

    layer = new cdb.admin.CartoDBLayer({
      table_name: 'test',
      id: 10,
      visible: 'true'
    });

    table = layer.table;
    map.layers.add(layer);


    view = new cdb.admin.LayerPanelView({
      model: layer,
      vis: vis,
      map: map,
      user: user,
      globalError: globalError
    });
  });

  it("should add stat_tag to the layer", function() {
    expect(layer.get('stat_tag')).toEqual(vis.get('id'));
  });

  it("should use no_cdn", function() {
    expect(layer.get('no_cdn')).toEqual(true);
  });

  it("should the layer", function() {
    expect(layer.get('force_cors')).toEqual(true);
  });

  it("should add map_key in layer", function() {
    expect(layer.get('extra_params').map_key).toEqual('rabos');
  });

  it("should add layer-type", function() {
    expect(view.$el.attr('layer-type')).toEqual('cartodb');
    layer.set('type', 'ToRquE');
    expect(view.$el.attr('layer-type')).toEqual('torque');
  });

  it("should hide/show the layer", function() {
    view.hide();
    expect(view.$('.sidebar').css('display')).toEqual('none');
    expect(view.$('.views').css('display')).toEqual('none');

    view.show();
    expect(view.$('.sidebar').css('display')).toEqual('block');
    expect(view.$('.views').css('display')).toEqual('block');
  });


  describe("layer initialization", function() {

    beforeEach(function() {
      //view.vis.set('type', 'derived');
    });

    it("should have 6 modules + 4 action buttons", function() {
      expect(view.buttons.length).toBe(10);
    });
  });


  describe("buttons behavior", function() {

    it("should show all the buttons when no sql is applied", function() {
      view.setActiveWorkView('table');
      var e = _(view.enabledButtonsForSection('table')).filter(function(b) {
        return b.$el.css('display') != 'none'
      });
      expect(e.length).toEqual(5);

      view.setActiveWorkView('map');
      var e = _(view.enabledButtonsForSection('map')).filter(function(b) {
        return b.$el.css('display') != 'none'
      });
      expect(e.length).toEqual(7);
    });

    it("should show readonly buttons when sql is applied", function() {
      table.useSQLView(view.sqlView);
      view.setActiveWorkView('table');
      var e = _(view.enabledButtonsForSection('table')).filter(function(b) {
        return b.$el.css('display') != 'none'
      });
      expect(e.length).toEqual(2);

      view.setActiveWorkView('map');
      var e = _(view.enabledButtonsForSection('map')).filter(function(b) {
        return b.$el.css('display') != 'none'
      });
      expect(e.length).toEqual(6);
    });

    it("should change to readonly buttons when sql is applied", function() {
      table.useSQLView(view.sqlView);
      view.setActiveWorkView('table');
      view.sqlView.modify_rows = false;
      view.sqlView.trigger('reset');
      var e = _(view.enabledButtonsForSection('table')).filter(function(b) {
        return b.$el.css('display') != 'none'
      });

      expect(e.length).toEqual(2);
    });
  });

  describe("layer info", function() {

    it("should set layer name, order and options", function() {
      expect(view.$('.layer_info a.info .name').text()).toBe('test');
      expect(view.$('.layer_info a.info .order').text()).toBe('1');
      expect(view.$('.layer_info div.right').css("display")).toBe('none');
    });

    it("should show layer option buttons if the visualization is the type derived", function() {
      view.vis.set('type', 'derived');
      expect(view.$('.layer_info div.right').css("display")).toBe('block');
    });

    it("should change the layer name if it changes", function() {
      view.dataLayer.set('table_name', 'jam');
      expect(view.$('.layer_info a.info .name').text()).toBe('jam');
    });

    it("shouldn't change the layer order if it changes, due to the visualization is the type table", function() {
      view.dataLayer.set('order', '4');
      expect(view.$('.layer_info a.info .order').text()).toBe('1');
    });

    it("should change the layer order if it changes", function() {
      var ll= new cdb.admin.CartoDBLayer({
        table_name: 'test',
        id: 11,
        visible: 'true'
      });
      map.layers.add(ll, {at : 0});
      view.vis.set('type', 'derived');
      view.setLayerOrder(view.dataLayer);
      expect(view.$('.layer_info a.info .order').text()).toBe('1');
    });

    it("should add alias if the layer is in a visualization", function() {
      view.vis.set('type', 'derived');
      view.setLayerName(view.dataLayer);
      expect(view.$('.layer_info a.info .name').text()).toBe('test');
      expect(view.$('.layer_info a.info .order').text()).toBe('1');
      expect(view.$('.layer_info a.info .name_info').text()).toBe('view of test');
    });

    it("should add alias if the layer is in a visualization", function() {
      view.vis.set('type', 'derived');
      view.model.set('table_name', 'test_jamon');
      view.setLayerName(view.dataLayer);

      expect(view.$('.layer_info a.info .name').text()).toBe('test jamon');
      expect(view.$('.layer_info a.info .order').text()).toBe('1');
      expect(view.$('.layer_info a.info .name_info').text()).toBe('view of test_jamon');
    });

    it("should be able to change alias if layer is in a visualization", function() {
      view.vis.set('type', 'derived');
      view.$('.layer_info a.info .name').dblclick();
      expect(view.$('.layer_info input.alias').css('display')).not.toBe('none');
    });

    it("should add sync-table icon if table is synced and layer is in a visualization", function() {
      view.vis.set('type', 'derived');
      view.table.synchronization.set("id","test");
      view.setLayerName(view.dataLayer);
      expect(view.$('.layer_info a.info .name i.synced').length).toBe(1);
    });

    it("shouldn't add sync-table icon if table is synced but layer is not in a visualization", function() {
      view.table.synchronization.set("id","test");
      view.vis.set('type', 'table');
      expect(view.$('.layer_info a.info .name i.synced').length).toBe(0);
    });

    it("shouldn't be able to change alias if layer is NOT in a visualization", function() {
      view.$('.layer_info a.info .name').dblclick();
      expect(view.$('.layer_info input.alias').is(':visible')).toBe(false);
    });

  });

  describe("layer actions", function() {

    beforeEach(function() {
      view.vis.set('type', 'derived');
    });

    it("should remove the layer", function() {
      view.$('a.remove').trigger('click');
      var removed = false;
      view.bind('delete', function() {
        removed = true;
      })
      view.trigger('delete', this);
      expect(removed).toBeTruthy();
    });

    it("should toggle the layer", function() {
      view.$('a.visibility').trigger('click');
      expect(view.model.get('visible')).toBeFalsy();
    });

    it("should hide infowindow if hides the layer", function() {
      view.model.infowindow.set('visibility', true);
      view.$('a.visibility').trigger('click');
      expect(view.model.infowindow.get('visibility')).toBeFalsy();
    });

    it("should active the layer", function() {
      var called = false;
      view.bind('switchTo', function() {
        called = true;
      })
      view.$('a.info').trigger('click');
      expect(called).toBeTruthy();
    });

    it("shouldn't remove a layer if visualization is a table type", function() {
      view.vis.set('type', 'table');
      view.$('a.remove').trigger('click');
      expect(view.remove_dlg).toBe(undefined);
    });

    it("shouldn't change layer visibility if visualization is a table type", function() {
      view.vis.set('type', 'table');
      view.$('a.visibility').trigger('click');
      expect(view.model.get('visible')).toBeTruthy();
    });

    it("should open a dropdown to choose a geometry", function() {
      view.$('.add_feature').click();
      expect(view.newGeomDropdown).toBeDefined();
      spyOn(view, '_addGeometry');
      view.newGeomDropdown.$('li:eq(0) a').click();
      expect(view._addGeometry).toHaveBeenCalled();
      view.newGeomDropdown.clean();
    });
  });
});

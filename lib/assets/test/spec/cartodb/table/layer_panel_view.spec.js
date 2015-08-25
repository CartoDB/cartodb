describe("cdb.admin.LayerPanelView", function() {

  var view;
  var map, table, sqlView, user, layer, vis;
  beforeEach(function() {
    //map = new cdb.admin.Map();

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
    map = vis.map

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
    expect(layer.get('no_cdn')).toEqual(false);
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
    expect(view.$('.layer-sidebar').css('display')).toEqual('none');
    expect(view.$('.layer-views').css('display')).toEqual('none');

    view.show();
    expect(view.$('.layer-sidebar').css('display')).toEqual('block');
    expect(view.$('.layer-views').css('display')).toEqual('block');
  });

  it("visiblity switch should be hidden if there is only a layer", function() {
    expect(view.$('.switch').css('display')).toEqual('none');
    map.layers.reset();
    layer = new cdb.admin.CartoDBLayer({
      table_name: 'test',
      id: 12,
      visible: 'true'
    });
    layer2 = new cdb.admin.CartoDBLayer({
      table_name: 'test2',
      id: 13,
      visible: 'true'
    });

    map.layers.add(layer);
    map.layers.add(layer2);
    expect(view.$('.switch').css('display')).not.toEqual('none');
    map.layers.remove(layer);
    expect(view.$('.switch').css('display')).toEqual('none');
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

    it("should show/hide buttons on sync table", function() {
      view.setActiveWorkView('table');
      var e = _(view.enabledButtonsForSection('table')).filter(function(b) {
        return b.$el.css('display') != 'none'
      });
      expect(e.length).toEqual(5);
      table.synchronization.set('id', 1)

      var e = _(view.enabledButtonsForSection('table')).filter(function(b) {
        return b.$el.css('display') != 'none'
      });
      expect(e.length).toEqual(2);

      table.synchronization.unset('id')
      var e = _(view.enabledButtonsForSection('table')).filter(function(b) {
        return b.$el.css('display') != 'none'
      });
      expect(e.length).toEqual(5);

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

    it("should change to readonly buttons when table is read only", function() {
      table.setReadOnly(true);
      view._checkButtons();
      var e = _(view.enabledButtonsForSection('table')).filter(function(b) {
        return b.$el.css('display') != 'none'
      });

      expect(e.length).toEqual(2);

      view.setActiveWorkView('map');

      e = _(view.enabledButtonsForSection('map')).filter(function(b) {
        return b.$el.css('display') != 'none'
      });

      expect(e.length).toEqual(6);
    });

  });

  describe("layer info", function() {

    it("should set layer name, order and options", function() {
      expect(view.$('.layer-info .info .name').text()).toBe('test');
      expect(view.$('.layer-info .info .order').text()).toBe('1');
      expect(view.$('.layer-info div.right').css("display")).toBe('none');
    });

    it("should show layer option buttons if the visualization is the type derived", function() {
      view.vis.set('type', 'derived');
      expect(view.$('.layer-info div.right').css("display")).toBe('block');
    });

    it("should set layer tooltip if the visualization is the type derived", function() {
      view.vis.set('type', 'derived');
      expect(view.$('.layer-info .info .name').data('tipsy').enabled).toBeTruthy();
    });

    it("shouldn't set layer tooltip if the visualization is the type table", function() {
      expect(view.$('.layer-info .info .name').data('tipsy')).toBeFalsy();
    });

    it("should change the layer name if it changes", function() {
      view.dataLayer.set('table_name', 'jam');
      expect(view.$('.layer-info .info .name').text()).toBe('jam');
    });

    it("shouldn't change the layer order if it changes, due to the visualization is the type table", function() {
      view.dataLayer.set('order', '4');
      expect(view.$('.layer-info .info .order').text()).toBe('1');
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
      expect(view.$('.layer-info .info .order').text()).toBe('1');
    });

    it("should add alias if the layer is in a visualization", function() {
      view.vis.set('type', 'derived');
      view.setLayerName(view.dataLayer);
      expect(view.$('.layer-info .info .name').text()).toBe('test');
      expect(view.$('.layer-info .info .order').text()).toBe('1');
      expect(view.$('.layer-info .info .name_info').text()).toBe('view of test');
    });

    it("should add alias if the layer is in a visualization", function() {
      view.vis.set('type', 'derived');
      view.model.set('table_name', 'test_jamon');
      view.setLayerName(view.dataLayer);

      expect(view.$('.layer-info .info .name').text()).toBe('test jamon');
      expect(view.$('.layer-info .info .order').text()).toBe('1');
      expect(view.$('.layer-info .info .name_info').text()).toBe('view of test_jamon');
    });

    it("should be able to change alias if layer is in a visualization", function() {
      view.vis.set('type', 'derived');
      view.$('.layer-info .info .name').dblclick();
      expect(view.$('.layer-info input.alias').css('display')).not.toBe('none');
    });

    it("should add sync-table icon if table is synced and layer is in a visualization", function() {
      view.vis.set('type', 'derived');
      view.table.synchronization.set("id","test");
      expect(view.$('.layer-info .info .name i.synced').length).toBe(1);
    });

    it("shouldn't add sync-table icon if table is synced but layer is not in a visualization", function() {
      view.table.synchronization.set("id","test");
      view.vis.set('type', 'table');
      expect(view.$('.layer-info .info .name i.synced').length).toBe(0);
    });

    it("shouldn't be able to change alias if layer is NOT in a visualization", function() {
      view.$('.layer-info .info .name').dblclick();
      expect(view.$('.layer-info input.alias').is(':visible')).toBe(false);
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

    it("should appear visibility message if toggles the layer", function() {
      view.$('a.visibility').trigger('click');
      expect(view.model.get('visible')).toBeFalsy();
      expect(view.$('.info.warning').length).toBe(1);
      view.$('a.visibility').trigger('click');
      expect(view.model.get('visible')).toBeTruthy();
      expect(view.$('.info.warning').length).toBe(0);
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
      view.$('.info').trigger('click');
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

    it("should open scratch view", function() {
      spyOn(cdb.editor.ScratchView.prototype, 'initialize').and.callThrough();

      view.$('.add_feature').click();
      expect(cdb.editor.ScratchView.prototype.initialize).toHaveBeenCalled();
    });

    describe('when a model is added/removed', function() {
      beforeEach(function() {
        view.model.set('visible', false);
        view.model.collection.add(
          new cdb.admin.CartoDBLayer({
            table_name: 'test',
            id: 11,
            visible: 'true'
          })
        );
        view.model.collection.add(
          new cdb.admin.CartoDBLayer({
            table_name: 'test',
            id: 12,
            visible: 'true'
          })
        );
      });

      it('should keep layer visibility of existing layer', function() {
        expect(view.$('.visibility.switch').hasClass('disabled')).toBe(true);
        expect(view.$('.visibility.switch').hasClass('enabled')).toBe(false);

        // also verify that removal don't change visibility state
        view.model.collection.remove(view.model.collection.last());
        expect(view.$('.visibility.switch').hasClass('disabled')).toBe(true);
        expect(view.$('.visibility.switch').hasClass('enabled')).toBe(false);
      });

      it('should only show switch if there is only one data layer', function() {
        expect(view.$('.visibility.switch').attr('style')).not.toContain('none');

        // remove 2 of 3 layers from your map
        map.layers.pop();
        map.layers.pop();
        expect(view.$('.visibility.switch').attr('style')).toContain('display: none');
      });
    });
  });

  describe('when model is destroyed', function() {
    beforeEach(function() {
      this.destroySpy = jasmine.createSpy('destroy');
      view.bind('destroy', this.destroySpy);
      view.model.destroy();
    });

    it('should trigger a destroy event with the view cid its dataLayer as param', function() {
      expect(this.destroySpy).toHaveBeenCalled();
      expect(this.destroySpy).toHaveBeenCalledWith(view.dataLayer.cid);
    });
  });

  it("should not have leaks", function() {
    expect(view).toHaveNoLeaks();
  });
});

describe('cdb.admin.Tooltip', function() {
  var mapView, model, tooltip, layer;
  beforeEach(function() {
    mapView = new cdb.geo.LeafletMapView({
      el: $('<div>'),
      map: new cdb.geo.Map()
    });

    model = new cdb.geo.ui.InfowindowModel({
      fields:   [{ name:'name1', title:true, position:0 }],
      template_name: 'tooltip_light'
    });
    layer = new Backbone.Model();
    tooltip = new cdb.admin.Tooltip({
      model: model,
      layer: layer,
      mapView: mapView,
    });
  });

  it("should render if the model change", function() {
    tooltip.template = null;
    model.set('template_name', 'tooltip_dark');
    expect(tooltip.template).not.toEqual(null);
  });

  it("should not render when no fields", function() {
    tooltip.template = null;
    model.set('fields', []);
    tooltip.render();
    expect(tooltip.el.innerHTML).toEqual('');
  });

  it("should use template if available", function() {
    model = new cdb.geo.ui.InfowindowModel({
      fields:   [{ name:'name1', title:true, position:0 }],
      template_name: 'tooltip_light',
      template: 'test'
    });
    tooltip = new cdb.admin.Tooltip({
      model: model,
      mapView: mapView
    });
    tooltip.render();
    expect(tooltip.$el.html()).toEqual('test');
  });

  it("should render empty fields", function() {
    model.addField('test2');
    layer.trigger('mouseover', null, null, { x:0, y: 0}, {
      test: 'test'
    });
    expect(tooltip.$el.html().indexOf('test2') === -1).toEqual(false)
    tooltip.options.empty_fields = false;
    layer.trigger('mouseover', null, null, { x:0, y: 0}, {
      test: 'test'
    });
    expect(tooltip.$el.html().indexOf('test2') === -1).toEqual(true)

  });

});

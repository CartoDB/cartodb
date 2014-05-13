describe('cdb.admin.Tooltip', function() {
  var model, tooltip;
  beforeEach(function() {
    model = new cdb.geo.ui.InfowindowModel({
      fields:   [{ name:'name1', title:true, position:0 }],
      template_name: 'tooltip_light'
    });
    tooltip = new cdb.admin.Tooltip({
      model: model
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
      model: model
    });
    tooltip.render();
    expect(tooltip.$el.html()).toEqual('test');
  });


});

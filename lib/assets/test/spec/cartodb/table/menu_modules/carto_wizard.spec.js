
describe('CartoWizard', function() {
  var view, model, table;
  beforeEach(function() {
    model = new Backbone.Model();
    table = TestUtil.createTable('test');
    view = new cdb.admin.mod.CartoWizard({
      el: $('<div>'),
      model: model,
      table: table
    });
  });

  it('should add panels', function() {
    view.render();
    expect(_.keys(view.panels._subviews).length).toEqual(1);
  });

  it("should switch when click on tabs", function() {
    view.render();
    $(view.$el.find('.vis_options a')[0]).trigger('click');
    expect(view.panels.activeTab).toEqual('simple');
  });

  it('when new style is generated should set tile_style in the model', function() {
    var s = sinon.spy();
    model.bind('change:tile_style', s);
    view.cartoStylesGeneration.set({
      properties: {
        'marker-fill': '#FFF'
      }
    });
    expect(s.called).toEqual(true);

  });

  it('when table change the style should be generated', function() {
    var s = sinon.spy();
    model.bind('change:tile_style', s);
    table.set({name: 'test2'});
    expect(s.called).toEqual(true);
  });

});


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
    expect(_.keys(view.panels._subviews).length).toEqual(3);
  });

  it("should switch when click on tabs", function() {
    view.render();
    $(view.$el.find('.vis_options a')[0]).trigger('click');
    expect(view.panels.activeTab).toEqual('simple');
  });

  it('when new style is generated and tab is active should set tile_style in the model', function() {
    var s = sinon.spy();
    model.bind('change:tile_style', s);
    view.activated();
    view.cartoStylesGeneration.set({
      properties: {
        'marker-fill': '#FFF'
      }
    });
    expect(s.called).toEqual(true);
    view.deactivated();
    var sdeactivated = sinon.spy();
    model.bind('change:tile_style', sdeactivated);
    view.cartoStylesGeneration.set({
      properties: {
        'marker-fill': '#FFF'
      }
    });
    expect(sdeactivated.called).toEqual(false);

  });


  describe("BubbleWizard", function() {
    var view, model, table;
    beforeEach(function() {
      table = TestUtil.createTable('test');
      model = new cdb.admin.CartoStyles({
        table: table
      });
      view = new cdb._BubbleWizard({
        table: table,
        model: model
      });
    });

    it("should re-render when table schema changes", function() {
      view.render();
      expect(view.$('option').length).toEqual(table.columnNames().length);
      table.set({ schema: [['jaja', 'number']] });
      expect(view.$('option').length).toEqual(table.columnNames().length);
    });

  });

});

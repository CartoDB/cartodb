/*
describe('cdb.admin.mod.LegendEditor', function() {

  describe('Legends', function() {
    var view, model, table;

    beforeEach(function() {
      model = new Backbone.Model();
      table = TestUtil.createTable('test');

      view = new cdb.admin.mod.LegendEditor({
        el: $('<div>'),
        model: model,
        dataLayer: model,
        legends: [
          { name: "none",      enabled: true  },
          { name: "custom",    enabled: true  },
          { name: "color",     enabled: false },
          { name: "bubble",    enabled: false },
          { name: "intensity", enabled: false },
          { name: "density",   enabled: false },
        ],
      });

    });

    xit('should add panels', function() {
      view.render();
      expect(_.keys(view.panels._subviews).length).toEqual(3);
    });

    xit('should have a combo for the templates', function() {
      view.render();
      expect(view.templates).toBeDefined();
      expect(view.$el.find(".form_combo")).toBeDefined();
    });

    xit("should switch panels when the user changes the select box", function() {
      view.render();
      view.$('.template_name').val("bubble").change();
      expect(view.model.get('template_name')).toEqual('bubble');
      expect(view.panels.activeTab).toEqual('bubble');
    });

    xit("should have a collection of items", function() {
      view.render();
      expect(view.items).toBeDefined();
    });

  });

  describe('Items', function() {
    var view, model, table;

    beforeEach(function() {
      model = new Backbone.Model();
      table = TestUtil.createTable('test');
      view = new cdb.admin.mod.LegendItem({
        el: $('<div>'),
        model: model,
        table: table,
        legends: [ "bubble", "choropleth", "custom"]
      });
    });

  });

});


*/

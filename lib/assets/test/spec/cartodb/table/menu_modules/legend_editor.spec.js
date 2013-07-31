describe('cdb.admin.mod.LegendEditor', function() {

  describe('Legends', function() {
    var view, model, table;

    beforeEach(function() {
      model = new Backbone.Model();
      table = TestUtil.createTable('test');
      view = new cdb.admin.mod.LegendEditor({
        el: $('<div>'),
        model: model,
        table: table,
        legends: [ "bubble", "choropleth", "custom"]
      });
    });


    it('should add panels', function() {
      view.render();
      expect(_.keys(view.panels._subviews).length).toEqual(3);
    });

    it('should have a combo for the templates', function() {
      view.render();
      expect(view.templates).toBeDefined();
      expect(view.$el.find(".form_combo")).toBeDefined();
    });

    it("should switch panels when the user changes the select box", function() {
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



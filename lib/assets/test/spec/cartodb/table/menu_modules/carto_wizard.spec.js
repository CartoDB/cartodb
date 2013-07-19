
describe('CartoWizard', function() {
  var view, model, table;
  beforeEach(function() {
    model = new Backbone.Model();
    table = TestUtil.createTable('test');
    view = new cdb.admin.mod.CartoCSSWizard({
      el: $('<div>'),
      model: model,
      table: table,
      wizards: {
        polygon:    "SimpleWizard",
        bubble:     "BubbleWizard",
        choropleth: "ChoroplethWizard",
        density:    "DensityWizard"
      }
    });
  });


  it('should add panels', function() {
    view.render();
    expect(_.keys(view.panels._subviews).length).toEqual(4);
  });

  it("should switch when click on tabs", function() {
    view.render();
    $(view.$el.find('.vis_options a')[0]).trigger('click');
    expect(view.panels.activeTab).toEqual('polygon');
  });

  it('when new style is generated and tab is active should set tile_style in the model', function() {
    // the table should not be empty
    table.data().create();
    spyOn(model, 'save');
    runs(function() {
      view.activated();
      view.cartoStylesGeneration.set({
        properties: {
          'marker-fill': '#FFF'
        }
      });
    });

    waits(700);

    runs(function() {
      expect(model.save).toHaveBeenCalled();
    });

  });

  it("when panel switch the tab should be selected", function() {
    view.render();
    view.panels.active('bubble');
    expect(view.$("a[href=#bubble]").hasClass('selected')).toEqual(true);
  });



  it("when style is updated the forms should be updated", function() {
    view.render();
    view.panels.active('choropleth');
    view.activated();
    // generate some carto to test
    var gen = new cdb.admin.CartoStyles({ table: table});
    gen.attr('polygon-fill', '#FFEE00');
    var custom_style = gen.get('style') + "\n #table::wadus { }";
    model.set({
      tile_style: custom_style,
      wizard_properties: gen.toJSON()
    });
    // test
    var color = view.panels.getPane('polygon').form.$('.color')[0];
    expect($(color).css('background-color')).toEqual('rgb(255, 238, 0)');

    //should never ever change the current style
    expect(model.get('tile_style')).toEqual(custom_style);

    //should active the generated tab
    expect(view.panels.activeTab).toEqual('polygon');
  });

  describe("ChoroplethWizard", function() {
    var view, model, table;

    beforeEach(function() {

      model = new Backbone.Model();

      table = new cdb.admin.CartoDBTableMetadata({ name: 'test_table', geometry_types: ['st_point'] });

      view = new cdb.admin.mod.CartoCSSWizard({
        el: $('<div>'),
        model: model,
        table: table,
        wizards: {
          polygon:    "SimpleWizard",
          bubble:     "BubbleWizard",
          choropleth: "ChoroplethWizard",
          density:    "DensityWizard"
        }
      });

    });

    it("shouldn't activate choropleth due to the fact that table is made of points", function() {
      view.render();
      expect(view.tabs.$el.find('a.choropleth').length).toBeFalsy();
    });

    it("should show the form if there is any number column", function() {
      model = new cdb.admin.CartoStyles({
        table: table
      });

      table = new cdb.admin.CartoDBTableMetadata({ name: 'test_table', geometry_types: ['st_polygon'], schema: [['test', 'number']] });
      view = new cdb.admin.mod.ChoroplethWizard({
        table: table,
        model: model
      });

      view.render();
      expect(view.$el.find('div.content').length).toEqual(1);
      expect(view.$el.find('div.no_content').length).toEqual(0);
    });

    it("should not show the form if there isn't any number column", function() {
      model = new cdb.admin.CartoStyles({
        table: table
      });
      table = new cdb.admin.CartoDBTableMetadata({ name: 'test_table', geometry_types: ['st_polygon'], schema: [['cartodb_id', 'number']] });
      view = new cdb.admin.mod.ChoroplethWizard({
        table: table,
        model: model
      });

      view.render();
      expect(view.$el.find('div.content').length).toEqual(0);
      expect(view.$el.find('div.no_content').length).toEqual(1);
    });

  });

  describe("SimpleWizard", function() {
    var view, model, table;
    beforeEach(function() {
      table = TestUtil.createTable('test');
      model = new cdb.admin.CartoStyles({
        table: table
      });
      view = new cdb.admin.mod.SimpleWizard({
        table: table,
        model: model
      });
    });

    xit("should re-render when table geo types changes", function() {
      view.render();
      spyOn(view, 'render');
      table.set('geometry_types', ['st_point']);
      expect(view.render).toHaveBeenCalled();
    });

  });


  describe("BubbleWizard", function() {
    var view, model, table;
    beforeEach(function() {
      table = TestUtil.createTable('test');
      model = new cdb.admin.CartoStyles({
        table: table
      });
      view = new cdb.admin.mod.BubbleWizard({
        table: table,
        model: model
      });
    });

    it("should re-render when table schema changes", function() {
      view.render();
      expect(view.$('.property option').length).toEqual(table.columnNamesByType('number').length);
      table.set({ schema: [['jaja', 'number']] });
      expect(view.$('.property option').length).toEqual(table.columnNamesByType('number').length);
    });

    it("should render sql when it is applied", function() {
      view.cartoProperties.trigger('change');
      expect(view.model.get('sql')).toEqual(null);
    });



  });

  describe("DensityWizard", function() {
    var view, model, table;
    beforeEach(function() {
      table = TestUtil.createTable('test');
      model = new cdb.admin.CartoStyles({
        table: table
      });
      view = new cdb.admin.mod.DensityWizard({
        table: table,
        model: model,
        map: new cdb.admin.Map()
      });
    });

    it("should include __wrapped query", function() {
      view.render();
      view.cartoProperties.trigger('change');
      expect(model.get('sql').indexOf('__wrapped')).not.toEqual(-1);
    });

  });


  describe("ColorWizard", function() {
    var view, model, table;
    beforeEach(function() {
      table = TestUtil.createTable('test');
      model = new cdb.admin.CartoStyles({
        table: table
      });
      view = new cdb.admin.mod.ColorMapWizard({
        table: table,
        model: model,
        map: new cdb.admin.Map()
      });
    });

    it("should create the custom_colors collection from the beginning", function() {
      view.render();
      expect(view.cartoProperties.colors).toBeDefined();
    });

    it("should append new custom views", function() {
      view.render();
      expect(view.$('.colors_error').size()).toBe(1);
      expect(view.$('ul.custom_colors').size()).toBe(1);
      expect(view.$('.colors_loader').size()).toBe(1);
    });

    it("should generate custom colors list", function() {
      view.render();
      view.setCarpropertiesSilent({ property: 'test', colors: [['rojo', '#F11810', 'string']] });
      expect(view.cartoProperties.colors.size()).toBe(1);
      expect(view.$('ul.custom_colors > li').size()).toBe(1);
      expect(view.$('ul.custom_colors > li span.color').css('background-color')).toBe('rgb(241, 24, 16)');
    });

    it("should reset wizard when applied column is removed", function() {
      view.render();
      view.setCarpropertiesSilent({ property: 'jam', colors: [['rojo', '#F11810', 'string']] });
      table.set({ schema: [['test', 'number']] });
      expect(view.cartoProperties.get('colors').length).toBe(1);
      expect(view.cartoProperties.colors.size()).toBe(0);
    });

    it("should get values when property has changed", function() {
      view.render();
      spyOn(view, '_getValues');
      view.cartoProperties.set({ property: 'test' });
      expect(view._getValues).toHaveBeenCalled();
    });

    it("should render new values after changing property adding the default one", function() {
      var server = sinon.fakeServer.create();
      view.render();
      view.cartoProperties.set({ property: 'latitude_0' });

      server.respondWith(table.data().sqlApiUrl(),
        [200, { "Content-Type": "application/json" },
       '{"time":0.005407094955444336,"total_rows":10,"rows":[{"latitude_0":-30.03415,"count":3},{"latitude_0":-15.7785,"count":3},{"latitude_0":-14.7185,"count":2},{"latitude_0":-19.76234,"count":2},{"latitude_0":-10.1693,"count":2},{"latitude_0":-8.17957,"count":2},{"latitude_0":-4.53866,"count":2},{"latitude_0":-7.54512,"count":2},{"latitude_0":-19.6983,"count":2},{"latitude_0":-16.0719,"count":2}],"results":true,"modified":false,"affected_rows":10}']);
      server.respond();

      expect(view.cartoProperties.colors.size()).toBe(11);
      expect(view.$('ul.custom_colors > li').size()).toBe(11);
    });

  });

});

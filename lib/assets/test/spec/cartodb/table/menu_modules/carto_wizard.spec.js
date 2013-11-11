
describe('CartoWizard', function() {
  var view, model, table;
  beforeEach(function() {
    model = new Backbone.Model();
    table = TestUtil.createTable('test');
    view = new cdb.admin.mod.CartoCSSWizard({
      el: $('<div>'),
      model: model,
      table: table,
      map: new cdb.admin.Map(),
      wizards: {
        polygon:    "SimpleWizard",
        bubble:     "BubbleWizard",
        color:      "ColorMapWizard",
        category:   "CategoryWizard",
        choropleth: "ChoroplethWizard",
        density:    "DensityWizard"
      }
    });
  });


  it('should add panels', function() {
    view.render();
    expect(_.keys(view.panels._subviews).length).toEqual(6);
  });

  it("should switch when click on tabs", function() {
    view.render();
    $(view.$el.find('.vis_options a')[0]).trigger('click');
    expect(view.panels.activeTab).toEqual('polygon');
  });

  it("shouldn't switch to color tab", function() {
    view.render();
    $(view.$el.find('.vis_options a')[2]).trigger('click');
    expect(view.panels.activeTab).toEqual('category');
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
      expect(model.save.calls[0].args[0].tile_style).toEqual("/** simple visualization */\n\n#test{\n  marker-fill: #FFF;\n}");

    });

  });

  it('when a wizard is deactivated the style should be changed on query change', function() {
    // the table should not be empty
    table.data().create();
    model.set('tile_style_custom', true);
    spyOn(model, 'save');
    runs(function() {
      view.deactivated();
      view.cartoStylesGeneration.set({
        properties: {
          'marker-fill': '#FFF'
        }
      });
    });

    waits(700);

    runs(function() {
      expect(model.save).not.toHaveBeenCalled();
    });
  });

  it('when a wizard is deactivated the style is customized it should not be updated', function() {
    // the table should not be empty
    table.data().create();
    model.set('tile_style_custom', true);
    spyOn(model, 'save');
    runs(function() {
      view.deactivated();
      view.cartoStylesGeneration.set({
        properties: {
          'marker-fill': '#FFF'
        }
      });
    });

    waits(700);

    runs(function() {
      expect(model.save).not.toHaveBeenCalled();
    });
  });

  it('when a wizard is generated and the style is customized it should not be updated', function() {
    // the table should not be empty
    table.data().create();
    model.set('tile_style_custom', true);
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
      expect(model.save).not.toHaveBeenCalled();
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

    it("should activate choropleth, no matter if table is made of points", function() {
      view.render();
      expect(view.tabs.$el.find('a.choropleth').length).toBeTruthy();
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
        model: model,
        map: new cdb.admin.Map()
      });
    });

    xit("should re-render when table geo types changes", function() {
      view.render();
      spyOn(view, 'render');
      table.set('geometry_types', ['st_point']);
      expect(view.render).toHaveBeenCalled();
    });

    describe('propertiesFromStyle', function() {

      it("should return new properties based on cartocss", function() {
        view.render();
        view.cartoProperties.trigger('change');
        expect(view.cartoProperties.get('polygon-fill')).toEqual('#FF6600');
        var modified = view.propertiesFromStyle('#layer { polygon-fill: #FFF; line-width: 0.1; marker-fill: red;}');
        expect(modified).toEqual({
          'polygon-fill': '#ffffff',
          'line-width': 0.1
        });
      });

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
        model: model,
        map: new cdb.admin.Map()
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

    it("should select the first column by default if there isn't one previously selected", function() {
      view.render();
      var first = _.first(view.options.table.get('schema'))[0];
      expect(view.cartoProperties.get('property')).toBe(first);
    });

    it("should render error message when there is no column available to select", function() {
      var new_table = new cdb.admin.CartoDBTableMetadata({
        name: 'test_jamon',
        schema: [],
        description: 'test description',
        geometry_types: ['ST_Point'],
        tags: "",
        privacy: "private"
      });

      var new_model = new cdb.admin.CartoStyles({
        table: new_table
      });
      var new_view = new cdb.admin.mod.ColorMapWizard({
        table: new_table,
        model: new_model,
        map: new cdb.admin.Map()
      });

      new_view.render();
      new_view.cartoProperties.trigger('change');
      expect(new_view.isValid()).toBeFalsy();
      expect(new_view.$el.find('div.no_content').length).toBe(1);
    });

    it("should render new values after changing property adding the default one", function() {
      var server = sinon.fakeServer.create();
      view.render();
      spyOn(view, '_showLoader');

      view.cartoProperties.set({ property: 'latitude_0' });

      expect(view._showLoader).toHaveBeenCalled();
      server.respondWith(table.data().sqlApiUrl(),
        [200, { "Content-Type": "application/json" },
       '{"time":0.01,"total_rows":10,"fields":{"latitude_0":"string"},"rows":[{"latitude_0":-30.03415,"count":3},{"latitude_0":-15.7785,"count":3},{"latitude_0":-14.7185,"count":2},{"latitude_0":-19.76234,"count":2},{"latitude_0":-10.1693,"count":2},{"latitude_0":-8.17957,"count":2},{"latitude_0":-4.53866,"count":2},{"latitude_0":-7.54512,"count":2},{"latitude_0":-19.6983,"count":2},{"latitude_0":-16.0719,"count":2},{"latitude_0":-11.0719,"count":1}],"results":true,"modified":false,"affected_rows":10}']);
      server.respond();

      expect(view.cartoProperties.get('colors').length).toBe(11);
    });

  });

  
  describe("CategoryWizard", function() {
    var view, model, table;
    beforeEach(function() {
      table = TestUtil.createTable('test');
      model = new cdb.admin.CartoStyles({
        table: table
      });
      view = new cdb.admin.mod.CategoryWizard({
        table: table,
        model: model,
        map: new cdb.admin.Map()
      });
    });

    it("should create the custom_categories collection from the beginning", function() {
      view.render();
      expect(view.cartoProperties.colors).not.toBeDefined();
      expect(view.cartoProperties.categories).toBeDefined();
    });

    it("should append new custom views", function() {
      view.render();
      expect(view.$('.colors_error').size()).toBe(1);
      expect(view.$('ul.custom_categories').size()).toBe(1);
      expect(view.$('.colors_loader').size()).toBe(1);
    });

    it("should generate custom categories list", function() {
      view.render();
      view.setCarpropertiesSilent({ property: 'test', categories: [{ title: 'rojo', title_type: 'string', value_type: 'color', color: '#F11810' }]});
      expect(view.cartoProperties.categories.size()).toBe(1);
      expect(view.$('ul.custom_categories > li').size()).toBe(1);
      expect(view.$('ul.custom_categories > li span.color').css('background-color')).toBe('rgb(241, 24, 16)');
    });

    // Yes, welcome to trick world (nananananan)
    it("should generate custom categories list from a colors property", function() {
      view.model.set('properties', { colors: [['rojo', '#F11810', 'string']] }, { silent: true });
      view.render();
      view.applyWizard();
      
      expect(view.cartoProperties.get('colors')).toBeDefined();
      expect(view.cartoProperties.get('categories')).toBeDefined();
      expect(view.cartoProperties.get('categories')[0].title).toBe('rojo');
      expect(view.cartoProperties.get('categories')[0].title_type).toBe('string');
      expect(view.cartoProperties.get('categories')[0].color).toBe('#F11810');
      expect(view.cartoProperties.get('categories')[0].value_type).toBe('color');
      expect(view.cartoProperties.get('categories').length).toBe(1);
    });

    it("should generate custom categories list from a colors property and adding other properties if they are defined", function() {
      view.model.set('properties', { colors: [['red', 'red', 'string']], property: 'widget', 'marker-width':'20' }, { silent: true });
      view.render();
      view.applyWizard();
      
      expect(view.cartoProperties.get('colors')).toBeDefined();
      expect(view.cartoProperties.get('categories')).toBeDefined();
      expect(view.cartoProperties.get('categories')[0].title).toBe('red');
      expect(view.cartoProperties.get('categories')[0].title_type).toBe('string');
      expect(view.cartoProperties.get('categories')[0].color).toBe('red');
      expect(view.cartoProperties.get('categories')[0].value_type).toBe('color');
      expect(view.cartoProperties.get('marker-width')).toBe('20');
      expect(view.cartoProperties.get('property')).toBe('widget');
      expect(view.cartoProperties.get('categories').length).toBe(1);
    });

    it("shouldn't generate the categories list from a colors property if categories was already defined", function() {
      view.render();
      var list = [{ title:'azul', title_type:'string', color:'#4D4DFF', value_type:'color' }];
      view.cartoProperties.set({ categories: list}, { silent: true })
      view.model.set('properties', { colors: [['rojo', '#F11810', 'string']], categories: list }, { silent: true });
      view.applyWizard();
      
      expect(view.cartoProperties.get('colors')).not.toBeDefined();
      expect(view.cartoProperties.get('categories')).toBeDefined();
      expect(view.cartoProperties.get('categories')[0].title).toBe('azul');
      expect(view.cartoProperties.get('categories')[0].title_type).toBe('string');
      expect(view.cartoProperties.get('categories')[0].color).toBe('#4D4DFF');
      expect(view.cartoProperties.get('categories')[0].value_type).toBe('color');
      expect(view.cartoProperties.get('categories').length).toBe(1);
    });

    it("should be able to render a url background", function() {
      view.render();
      view.setCarpropertiesSilent({ property: 'test', categories: [{ title: 'rojo', title_type: 'string', value_type: 'file', file: 'http://cartodb.com' }]});
      expect(view.cartoProperties.categories.size()).toBe(1);
      expect(view.cartoProperties.get('colors')).not.toBeDefined();
      expect(view.$('ul.custom_categories > li').size()).toBe(1);
      expect(view.$('ul.custom_categories > li span.color').hasClass('image-color')).toBeTruthy();
    });

  });

});

describe('CartoWizard', function() {
  var view, model, table, wizard_properties, layer;
  beforeEach(function() {
    table = TestUtil.createTable('test');
    layer = new cdb.admin.CartoDBLayer();
    layer.sync = function() {};
    model = layer;
    layer.wizard_properties.set('type', 'polygon');
    layer.table.set({
      'name': 'test',
      'geometry_types': ['st_point']
    });

    view = new cdb.admin.mod.CartoCSSWizard({
      el: $('<div>'),
      model: model,
      table: layer.table,
      map: new cdb.admin.Map(),
      wizards: {
        polygon:    "SimpleWizard",
        cluster:    "ClusterWizard",
        bubble:     "BubbleWizard",
        color:      "ColorMapWizard",
        category:   "CategoryWizard",
        choropleth: "ChoroplethWizard",
        density:    "DensityWizard"
      }
    });
  });


  afterEach(function() {
    view.clean();
  });

  it("should not have leaks", function() {
    //TestUtil.assertNotLeaks(view);
    expect(view).toHaveNoLeaks();
  });

  it('should add a panel', function() {
    view.render();
    expect(view.$('.forms').children().length).toEqual(1);
  });

  it("should switch when click on tabs", function() {
    view.render();
    $(view.$el.find('.vis_options a')[0]).trigger('click');
    expect(layer.wizard_properties.get('type')).toEqual('polygon');
  });

  it("shouldn't switch to color tab", function() {
    view.render();
    $(view.$el.find('.vis_options a')[3]).trigger('click');
    expect(layer.wizard_properties.get('type')).toEqual('category');
  });

  it("should switch when click on tabs", function() {
    view.render();
    $(view.$el.find('.vis_options a')[0]).trigger('click');
    expect(layer.wizard_properties.get('type')).toEqual('polygon');
  });

  it('when new style is generated and tab is active should set tile_style in the model', function(done) {
    // the table should not be empty
    view.render();
    model.set('id', 1)
    table.data().create();
    spyOn(model, 'set');
    $(view.$el.find('.vis_options a')[2]).trigger('click');
    $(view.$el.find('.vis_options a')[0]).trigger('click');

    setTimeout(function() {
      expect(model.set).toHaveBeenCalled();
      var style = [
      '/** simple visualization */\n',
      '#test{',
      '  marker-fill-opacity: 0.9;',
      '  marker-line-color: #FFF;',
      '  marker-line-width: 1;',
      '  marker-line-opacity: 1;',
      '  marker-placement: point;',
      '  marker-type: ellipse;',
      '  marker-width: 10;',
      '  marker-fill: #FF6600;',
      '  marker-allow-overlap: true;',
      '}'].join('\n');

      expect(model.set.calls.argsFor(2)[0].tile_style).toEqual(style);
      done();

    }, 700);

  });


  it('when a wizard is deactivated the style is customized it should not be updated', function(done) {
    // the table should not be empty
    view.render()
    table.data().create();
    model.set('tile_style_custom', true);
    spyOn(model, 'save');

    $(view.$el.find('.vis_options a')[2]).trigger('click');

    setTimeout(function() {
      expect(model.save).not.toHaveBeenCalled();
      done();
    }, 700);
  });


  describe("ChoroplethWizard", function() {
    var view;

    beforeEach(function() {
      layer.table.set({ name: 'test_table', geometry_types: ['st_point'] });
      view = new cdb.admin.mod.CartoCSSWizard({
        el: $('<div>'),
        model: layer,
        table: layer.table,
        wizards: {
          polygon:    "SimpleWizard",
          bubble:     "BubbleWizard",
          choropleth: "ChoroplethWizard",
          density:    "DensityWizard"
        }
      });

    });

    afterEach(function() {
      view.clean();
    });

    it("should not have leaks", function() {
      expect(view).toHaveNoLeaks();
    });

    it("should activate choropleth, no matter if table is made of points", function() {
      view.render();
      expect(view.tabs.$el.find('a.choropleth').length).toBeTruthy();
    });

    it("should show the form if there is any number column", function() {
      layer.table.set({ name: 'test_table', geometry_types: ['st_polygon'], schema: [['test', 'number']] });
      view = new cdb.admin.mod.ChoroplethWizard({
        table: layer.table,
        layer: layer,
        wizard_properties: layer.wizard_properties
      });

      view.render();
      expect(view.$el.find('div.content').length).toEqual(1);
      expect(view.$el.find('div.no_content').length).toEqual(0);
    });

    it("should not show the form if there isn't any number column", function() {
      layer.table.set({ name: 'test_table', geometry_types: ['st_polygon'], schema: [['cartodb_id', 'number']] });
      view = new cdb.admin.mod.ChoroplethWizard({
        table: layer.table,
        layer: layer,
        wizard_properties: layer.wizard_properties
      });

      view.render();
      expect(view.$el.find('div.content').length).toEqual(0);
      expect(view.$el.find('div.no_content').length).toEqual(1);
    });

  });

  describe("SimpleWizard", function() {
    var view;
    beforeEach(function() {
      view = new cdb.admin.mod.SimpleWizard({
        table: layer.table,
        layer: layer,
        wizard_properties: layer.wizard_properties
      });
    });

    xit("should re-render when table geo types changes", function() {
      spyOn(view, 'render');
      layer.table.set('geometry_types', ['st_linestring']);
      expect(view.render).toHaveBeenCalled();
    });

    it("should not have leaks", function() {
      expect(view).toHaveNoLeaks();
    });



    // When a property changes, it provokes other related changes
    describe('properties change from edition', function() {

      it("should set text-dy when marker-width changes", function() {
        view.render();
        view.cartoProperties.active('polygon');
        expect(view.cartoProperties.get('text-dy')).toBe(-10);
        view.cartoProperties.set('marker-width', 20);
        expect(view.cartoProperties.get('text-dy')).toBe(-20);
      });

      it("should set several properties when text-allow-overlap changes", function() {
        view.render();
        view.cartoProperties.active('polygon');
        view.cartoProperties.set('text-allow-overlap', 'false');
        expect(view.cartoProperties.get('text-placement-type')).toBe('simple');
        expect(view.cartoProperties.get('text-label-position-tolerance')).toBe(10);

        view.cartoProperties.set('text-allow-overlap', 'true');
        expect(view.cartoProperties.get('text-placement-type')).toBe('dummy');
        expect(view.cartoProperties.get('text-label-position-tolerance')).toBe(0);
      })

    });

    describe('marker color is changed from icon', function(){
      it("should revert to the default marker", function(){
        view.render();
        var markerUrl = "url(http://com.cartodb.users-assets.production.s3.amazonaws.com/simpleicon/heart206.svg)"
        view.cartoProperties.set('marker-file', markerUrl);
        expect(view.cartoProperties.get('marker-file')).toBe(markerUrl);
        view.cartoProperties.set('marker-fill', "#a0f0f1");
        expect(view.cartoProperties.get('marker-file')).toBe(undefined);
      })
    });

  });


  describe("BubbleWizard", function() {
    var view;
    beforeEach(function() {
      layer.wizard_properties.active('bubble');
      layer.table.set({ schema: [['aaa', 'string']]});
      view = new cdb.admin.mod.BubbleWizard({
        table: layer.table,
        layer: layer,
        wizard_properties: layer.wizard_properties
      });
    });

    it("should not have leaks", function() {
      expect(view).toHaveNoLeaks();
    });

    it("should re-render when table schema changes", function() {
      view.render();
      layer.table.set({ schema: [['jaja', 'number'], ['jaja2', 'number']] });
      expect(view.$('.property option').length).toEqual(layer.table.columnNamesByType('number').length);
      layer.table.set({ schema: [['jaja', 'number']] });
      expect(view.$('.property option').length).toEqual(layer.table.columnNamesByType('number').length);
    });

  });

  describe("DensityWizard", function() {
    var view;
    beforeEach(function() {
      layer.wizard_properties.active('density');
      view = new cdb.admin.mod.DensityWizard({
        table: layer.table,
        layer: layer,
        wizard_properties: layer.wizard_properties,
        map: new cdb.admin.Map()
      });
    });

  });

  it("should not have leaks", function() {
    expect(view).toHaveNoLeaks();
  });


  /*describe("ColorWizard", function() {
    var view, model, table;
    beforeEach(function() {
      layer.wizard_properties.active('category');
      view = new cdb.admin.mod.ColorMapWizard({
        table: layer.table,
        layer: layer,
        wizard_properties: layer.wizard_properties,
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

  });*/


  describe("CategoryWizard", function() {
    var view;
    beforeEach(function() {
      layer = new cdb.admin.CartoDBLayer();
      layer.sync = function() {};
      layer.wizard_properties.set('type', 'polygon');
      layer.table.set({
        'name': 'test',
        schema: [ ['test','number'], ['test2', 'string'] ]
      });
      layer.wizard_properties.active('category');
      layer.wizard_properties.set({ property: 'test', categories: [{ title: 'rojo', title_type: 'string', value_type: 'color', color: '#F11810' }]});
      view = new cdb.admin.mod.CategoryWizard({
        table: layer.table,
        layer: layer,
        wizard_properties: layer.wizard_properties,
        map: new cdb.admin.Map()
      });
    });

    afterEach(function() {
      view.clean();
    });

    it("should not have leaks", function() {
      expect(view).toHaveNoLeaks();
    });

    it("should create the custom_categories collection from the beginning", function() {
      expect(view.colors).not.toBeDefined();
      expect(view.categories).toBeDefined();
    });

    it("should append new custom views", function() {
      view.render();
      expect(view.$('.colors_error').size()).toBe(1);
      expect(view.$('ul.custom_categories').size()).toBe(1);
      expect(view.$('.colors_loader').size()).toBe(1);
    });

    it("should generate custom categories list", function() {
      view.render();
      expect(view.$('ul.custom_categories > li').size()).toBe(1);
      expect(view.$('ul.custom_categories > li .color-picker').css('background-color')).toBe('rgb(241, 24, 16)');

      // metadata is only updated from generator so avoid generate it
      layer.wizard_properties.unbindGenerator();
      layer.wizard_properties.set({ property: 'test', metadata: [{ title: 'rojo', title_type: 'string', value_type: 'color', color: '#F118FF' }]});
      layer.wizard_properties.bindGenerator();
      expect(view.categories.size()).toBe(1);
      expect(view.$('ul.custom_categories > li').size()).toBe(1);
      expect(view.$('ul.custom_categories > li .color-picker').css('background-color')).toBe('rgb(241, 24, 255)');
    });

    // Yes, welcome to trick world (nananananan)
    it("should generate custom categories list from a colors property", function() {
      layer.wizard_properties.set({ colors: [['rojo', '#F11810', 'string']] });
      view.clean();

      view = new cdb.admin.mod.CategoryWizard({
        table: layer.table,
        layer: layer,
        wizard_properties: layer.wizard_properties,
        map: new cdb.admin.Map()
      });

      expect(view.cartoProperties.get('colors')).toBeDefined();
      expect(view.cartoProperties.get('categories')).toBeDefined();
      expect(view.cartoProperties.get('categories')[0].title).toBe('rojo');
      expect(view.cartoProperties.get('categories')[0].title_type).toBe('string');
      expect(view.cartoProperties.get('categories')[0].color).toBe('#F11810');
      expect(view.cartoProperties.get('categories')[0].value_type).toBe('color');
      expect(view.cartoProperties.get('categories').length).toBe(1);

    });


    it("should be able to render a url background", function() {
      view.render();
      layer.wizard_properties.unbindGenerator();
      layer.wizard_properties.set({ property: 'test', metadata: [{ title: 'rojo', title_type: 'string', value_type: 'file', file: 'https://cartodb.com' }]});
      layer.wizard_properties.bindGenerator();
      expect(view.categories.size()).toBe(1);
      expect(view.$('ul.custom_categories > li').size()).toBe(1);
      expect(view.$('ul.custom_categories > li .color-picker').css('background')).toBe('');
    });

    it("should change categories when they are edited", function() {
      view.render();
      view.categories.models[0].set('title', 'verde');
      expect(layer.wizard_properties.get('categories')[0].title).toEqual('verde');
    });

  });

});

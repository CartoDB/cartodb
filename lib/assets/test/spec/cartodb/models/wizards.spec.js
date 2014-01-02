
describe('cdb.admin.FormSchema', function() {

  var model, table;

  beforeEach(function() {
    table = TestUtil.createTable('test');
  });

  it("should use default values", function() {
    model = new cdb.admin.FormSchema({
      table: table,
      type: 'bubble'
    });

    expect(model.get('Bubble fill').form).toEqual({
     'marker-fill': { type: 'color', value: '#FF5C00' },
     'marker-opacity': { type: 'opacity', value: 0.9 }
    });
  });

  it("should change column fields when table schema changes", function() {
    model = new cdb.admin.FormSchema({
      table: table,
      type: 'bubble'
    });
    expect(model.get('Column').form.property.extra).toEqual(['test']);
    var changed;
    model.bind('change', function() {
      console.log(model.changed);
      changed = _.clone(model.changed);
    });
    table.set('schema', [
      ['test', 'number'],
      ['test3', 'number'],
      ['test2', 'string']
    ]);
    expect(model.get('Column').form.property.extra).toEqual(['test', 'test3']);
    expect(model.get('Column').form.property.value).toEqual('test');
    expect(changed.Column).not.toEqual(undefined);
    expect(_.keys(changed).length).toEqual(1);

  });

  it("should validate", function() {
    model = new cdb.admin.FormSchema({
      table: table,
      type: 'polygon'
    });
    expect(model.isValid('polygon')).toEqual(true);

    model = new cdb.admin.FormSchema({
      table: table,
      type: 'bubble'
    });
    table.set('schema', [
      ['test2', 'string']
    ]);
    expect(model.isValid('bubble')).toEqual(false);
    table.set('schema', [
      ['test', 'number'],
      ['test3', 'number'],
      ['test2', 'string']
    ]);
    expect(model.isValid('bubble')).toEqual(true);
  })

});

describe('cdb.admin.WizardProperties', function() {
  var model, table, layer;
  beforeEach(function() {
    table = TestUtil.createTable('test');
    layer = new cdb.admin.CartoDBLayer();
    model = new cdb.admin.WizardProperties({ table: table, layer: layer, 'type': 'polygon' });
    layer.sync = function() {};
  });

  it("should link to layer", function() {
    layer.set('wizard_properties', { type: 'polygon', properties: { u: 1 }});
    model.linkLayer(layer);
    expect(model.get('type')).toEqual('polygon');
    expect(model.get('u')).toEqual(1);
    layer.set('wizard_properties', { type: 'bubble', properties: { a: 1, b: 2 }});
    expect(model.get('type')).toEqual('bubble');
    expect(model.get('a')).toEqual(1);
    expect(model.get('b')).toEqual(2);

    model.set({
      c: 4,
      b: 1,
      type: 'category'
    });
    var wp = layer.get('wizard_properties');
    expect(wp.type).toEqual('category');
    expect(wp.properties.c).toEqual(4);
    expect(wp.properties.b).toEqual(1);
    expect(wp.properties.a).toEqual(1);
  });

  it("active", function() {
    model.set('marker-fill', 'test');
    model.active('polygon', { test: 'rambo' });
    expect(model.get('polygon-fill')).toEqual('#FF6600');
    expect(model.get('type')).toEqual('polygon');
    expect(model.get('test')).toEqual('rambo');
    expect(model.get('marker-fill')).toEqual(undefined);
  });

  it("getEnabledWizards", function() {
    expect(model.getEnabledWizards()).toEqual(['polygon', 'choropleth', 'category', 'bubble']);
  });

  it("formData should fill text-name", function() {
    var fd = model.formData('polygon');
    var tn = fd[3].form['text-name'];
    expect(tn.value).toEqual('None')
    expect(tn.extra).toEqual(['None'].concat(table.columnNamesByType('string'))
          .concat(table.columnNamesByType('number'))
    );
  });

  it("layer change query styles should be regenerated", function() {
    spyOn(model.cartoStylesGeneration, 'regenerate');
    layer.set('query', 'select * from asdasd');
    expect(model.cartoStylesGeneration.regenerate).toHaveBeenCalled();
  });

  it("when properties are changed styles should be regenerated", function() {
    layer.set('tile_style', 'test');
    var st = layer.get('tile_style');
    runs(function() {
      model.set('marker-fill', '#FFF');
    });
    waits(200);
    runs(function() {
      console.log(layer.get('tile_style'), st);
      expect(layer.get('tile_style')).not.toEqual(st);
    });
  });

  it("should regenate style on table schema changes", function() {
    spyOn(model.cartoStylesGeneration, 'regenerate');
    table.set({ schema: [['test', 'number']] });
    expect(model.cartoStylesGeneration.regenerate).toHaveBeenCalled();
  });

  it("should not regenerate when style is custom", function() {
    layer.set('tile_style_custom', true);
    spyOn(model.cartoStylesGeneration, 'regenerate');
    layer.set('query', 'select * from asdasd');
    expect(model.cartoStylesGeneration.regenerate).not.toHaveBeenCalled();
    table.set('schema', [
      ['test', 'number'],
      ['test3', 'number'],
      ['test2', 'string']
    ]);
    expect(model.cartoStylesGeneration.regenerate).not.toHaveBeenCalled();
  });

  it("should set tile_style_custom to true when on activate", function() {
    layer.set('tile_style_custom', true);
    runs(function() {
      model.active('polygon', { test: 'rambo' });
    });
    waits(100);
    runs(function() {
      expect(layer.get('tile_style_custom')).toBe(false);
    });
  });

  it("should trigger change:form when current form changes", function() {
    var raised = 0;
    model.bind('change:form', function() {
      ++raised;
    });
    table.set('schema', [
      ['rambo_is_the_best', 'number']
    ]);
    expect(raised).toEqual(1);
    model.active('bubble');
    table.set('schema', [
      ['test', 'number'],
      ['test3', 'number'],
      ['john', 'string']
    ]);
    expect(raised).toEqual(2);
    model.active('choropleth');
    table.set('schema', [
      ['test4', 'number'],
    ]);
    expect(raised).toEqual(3);

  });

  it("should reset styles when geometry type changes", function() {
    model.active('bubble');
    table.set('geometry_types', ["st_polygon"]);
    expect(model.get('type')).toEqual('bubble');
    table.set('geometry_types', ["st_point"]);
    expect(model.get('type')).toEqual('polygon');
    model.active('bubble');
    table.set('geometry_types', ["st_polygon"]);
    expect(model.get('type')).toEqual('polygon');
  });

  it("should not reset styles when table has no geo types", function() {
    model.active('bubble');
    table.set('geometry_types', []);
    expect(model.get('type')).toEqual('bubble');
  });

  it("should change layer type", function() {
    table.set('geometry_types', ["st_point"]);
    runs(function() {
      model.active('torque');
    });
    waits(100);
    runs(function() {
      expect(layer.get('type')).toEqual('torque');
    });
    runs(function() {
      model.active('polygon');
    });
    waits(100);
    runs(function() {
      expect(layer.get('type')).toEqual('CartoDB');
    });

  });

  it("should change sql", function() {
    runs(function() {
      model.cartoStylesGeneration.set({ sql: 'select * from __wrapped', style: 'test'});
    });
    waits(100);
    runs(function() {
      expect(layer.get('query_wrapper')).toEqual('select * from (<%= sql %>)');
      expect(layer.get('query_generated')).toEqual(true);
    });

  });

  it("should change medatata", function() {
    runs(function() {
      model.cartoStylesGeneration.set({ metadata: { test: 'test' }, sql: 'select * from __wrapped', style: 'test'});
    });
    waits(100);
    runs(function() {
      expect(model.get('metadata')).toEqual({ test: 'test' });
    });
  });

  it("should not regenerate on start", function() {
    table.unset('schema');
    spyOn(model.cartoStylesGeneration, 'regenerate');
    table.set('schema', [
      ['test4', 'number'],
    ]);
    expect(model.cartoStylesGeneration.regenerate).not.toHaveBeenCalled();

  })

  xit("should save previous state on change", function() {
    model.active('polygon', { test: 'rambo' });
    model.set('test2', 'test');
    model.active('bubble');
    expect(model.get('test2')).toEqual(undefined);
    model.active('polygon');
    expect(model.get('test2')).toEqual('test');
  });

  //
  // should change wizard type on geoemtry type change
  //
  //
  //
  

  describe('propertiesFromStyle', function() {

    it("should return new properties based on cartocss", function() {
      model.set('polygon-pattern-file', 'url(https://rambo)');
      expect(model.get('polygon-fill')).toEqual(undefined);
      var modified = model.propertiesFromStyle('#layer { polygon-fill: #FFF; line-width: 0.1; marker-fill: red; polygon-pattern-file: url(https://s3.amazonaws.com/com.cartodb.users-assets.production/production/matallo/assets/20130808152815bullet.png);\n}');
      expect(modified).toEqual({
        'polygon-fill': '#ffffff',
        'line-width': 0.1,
        'polygon-pattern-file': 'url(https://s3.amazonaws.com/com.cartodb.users-assets.production/production/matallo/assets/20130808152815bullet.png)'
      });
    });

    it("should return not change values when style is wrong", function() {
      var modified = model.propertiesFromStyle('#layer { polygon-fill: "rambo"; line-width: 0.1; marker-fill: red;}');
      expect(modified).toEqual({});
    })

  });

  it("should send stats", function() {
    var c = 0;
    var m = layer.wizard_properties;
    cdb.god.bind('mixpanel', function() { ++c; });
    m.set('marker-file', 'test');
    expect(c).toEqual(1);
    m.set('polygon-pattern-file', 'test');
    expect(c).toEqual(2);
    m.set('other', 'test');
    expect(c).toEqual(2);
  })


});

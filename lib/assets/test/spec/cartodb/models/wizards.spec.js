
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

  it("should not include cartodb_id columns", function() {
    table.set('schema', [
      ['cartodb_id', 'number'],
      ['test', 'number'],
      ['test3', 'number'],
      ['test2', 'string']
    ]);
    model = new cdb.admin.FormSchema({
      table: table,
      type: 'bubble'
    });
    expect(model.get('Column').form.property.extra).toEqual(['test', 'test3']);
  })

  describe('column_numeric_date_with_cartodb_id', function() {

    it("should include the 'cartodb_id' column and set it as value if no custom date column is present", function() {
      var schema = [
        [ "number", "number"],
        [ "created_at", "date" ],
        [ "updated_at", "date" ]
      ]
      table = TestUtil.createTable('test', schema, ['ST_Point'])
      model = new cdb.admin.FormSchema({
        table: table,
        type: 'torque'
      });

      expect(model.get("Time Column").form.property.extra).toEqual(["cartodb_id", "number", "created_at", "updated_at"]);
      expect(model.get("Time Column").form.property.value).toEqual("cartodb_id");
    });

    it("should use the first custom date column as value instead of 'cartodb_id'", function() {
      var schema = [
        [ "number", "number"],
        [ "date_column", "date" ],
        [ "created_at", "date" ],
        [ "updated_at", "date" ]
      ]
      table = TestUtil.createTable('test', schema, ['ST_Point'])
      model = new cdb.admin.FormSchema({
        table: table,
        type: 'torque'
      });

      expect(model.get("Time Column").form.property.extra).toEqual(["cartodb_id", "number", "date_column", "created_at", "updated_at"]);
      expect(model.get("Time Column").form.property.value).toEqual("date_column");
    });
  })

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

  it("active", function() {
    model.set('marker-fill', 'test');
    model.active('polygon', { test: 'rambo' });
    expect(model.get('polygon-fill')).toEqual('#FF6600');
    expect(model.get('type')).toEqual('polygon');
    expect(model.get('test')).toEqual('rambo');
    expect(model.get('marker-fill')).toEqual('test');
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
    spyOn(layer.wizard_properties.cartoStylesGeneration, 'regenerate');
    layer.set('query', 'select * from asdasd');
    expect(model.cartoStylesGeneration.regenerate).toHaveBeenCalled();
  });

  it("activate should force regeneration", function() {
    var called = 0;
    model.cartoStylesGeneration.bind('change:style', function() {
      ++called;
    });
    model.active('polygon');
    model.active('polygon');
    model.active('polygon');
    expect(called).toEqual(3);
  });


  it("when properties are changed styles should be regenerated", function(done) {
    layer.set('tile_style', 'test');
    var st = layer.get('tile_style');
    model.set('marker-fill', '#FFF');
    setTimeout(function() {
      expect(layer.get('tile_style')).not.toEqual(st);
      done();
    }, 200);
  });

  it("should not be activated when is not valid", function() {
    table.set({ schema: [['test', 'string']] });
    var called = false;
    model.cartoStylesGeneration.bind('change:properties', function() { called = true })
    model.active('bubble');
    expect(called).toEqual(false);
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

  it("should set tile_style_custom to true when on activate", function(done) {
    layer.set('tile_style_custom', true);
    model.active('polygon', { test: 'rambo' });
    setTimeout(function() {
      expect(layer.get('tile_style_custom')).toBe(false);
      done()
    }, 100);
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
    model.set('test', 1);
    table.set('geometry_types', ["st_point"]);
    expect(model.get('type')).toEqual('polygon');
    expect(model.get('test')).toEqual(undefined);
  });

  it("should reset to polygon on type changes if the previous does not exist", function() {
    table.set('geometry_types', ["st_point"]);
    model.active('intensity');
    table.set('geometry_types', ["st_linestring"]);
    expect(model.get('type')).toEqual('polygon');
  });

  it("should not reset styles when table has no geo types", function() {
    model.active('bubble');
    table.isInSQLView = function() { return true; }
    table.set('geometry_types', []);
    expect(model.get('type')).toEqual('bubble');
  });

  it("should change layer type", function(done) {
    table.set('geometry_types', ["st_point"]);
      model.active('torque');
    setTimeout(function() {
      expect(layer.get('type')).toEqual('torque');
      setTimeout(function() {
        model.active('polygon');
        setTimeout(function() {
          expect(layer.get('type')).toEqual('CartoDB');
          done();
        }, 100);
      }, 100);
    }, 100);

  });

  it("should change sql", function() {
    model.cartoStylesGeneration.change();
    model.cartoStylesGeneration.set({ sql: 'select * from __wrapped', style: 'test'});
    expect(layer.get('query_wrapper')).toEqual('select * from (<%= sql %>)');
    expect(layer.get('query_generated')).toEqual(true);

  });

  it("should change medatata", function(done) {
    model.cartoStylesGeneration.set({ metadata: { test: 'test' }, sql: 'select * from __wrapped', style: 'test'});
    setTimeout(function() {
      expect(model.get('metadata')).toEqual({ test: 'test' });
      done();
    }, 100);
  });

  it("should not regenerate on start", function() {
    table.unset('schema');
    spyOn(model.cartoStylesGeneration, 'regenerate');
    table.set('schema', [
      ['test4', 'number'],
    ]);
    expect(model.cartoStylesGeneration.regenerate).not.toHaveBeenCalled();

  })

  it("should save previous state on change", function() {
    model.active('polygon', { test: 'rambo' });
    model.set('test2', 'test');
    model.active('bubble');
    expect(model.get('test2')).toEqual(undefined);
    model.active('polygon');
    expect(model.get('test2')).toEqual('test');
  });

  it("should not save state when type is the same", function() {
    model.active('polygon', { test: 'rambo' });
    model.active('polygon');
    expect(model.get('test')).toEqual('rambo');
    model.active('polygon');
    expect(model.get('test')).toEqual('rambo');
  });

  it("should not serialize metadata", function() {
    model.set('medatata', 'test');
    expect('metadata' in layer.toJSON().options.wizard_properties.properties).toEqual(false);
  });


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

  describe('when column is removed', function() {
    var called = false;
    var type = 0;
    var form = 1;
    var orderedCallbacksCalled;

    beforeEach(function(done) {
      orderedCallbacksCalled = [];
      model.bind('change:type', function() {
        orderedCallbacksCalled.push(type);
      });
      model.bind('change:form', function() {
        orderedCallbacksCalled.push(form);
        done();
      });
      model.cartoStylesGeneration.bind('change:properties', function() { called = true });
      model.active('bubble');
      table.set({ schema: [['test2', 'string']] });
    });

    it('should active polygon ', function() {
      expect(model.get('type')).toEqual('polygon');
    });

    it('should have called change:properties', function() {
      expect(called).toBeTruthy();
    });

    it('should have called change:type and change:form in that order', function() {
      // TODO: change:type callback is called twice, does it matter?
      expect(orderedCallbacksCalled).toEqual([ type, type, form ]);
    });
  });

  it("should rename column", function() {
    table.set({ schema: [['test', 'number'], ['test2', 'string']] });
    var called = false;
    model.cartoStylesGeneration.bind('change:properties', function() { called = true })
    model.active('bubble');
    table.trigger('columnRename', 'test_abc', 'test');
    expect(model.get('property')).toEqual('test_abc');
    expect(called).toEqual(true);
    layer.set('tile_style_custom', true);
    table.trigger('columnRename', 'test3', 'test_abc');
    expect(model.get('property')).toEqual('test_abc');
  });

  it("should fill form values with correct values", function() {
    layer = new cdb.admin.CartoDBLayer();
    layer.sync = function() {}
    layer.table.set('geometry_types', ["st_polygon"]);
    expect(layer.wizard_properties.get('marker-width')).toEqual(undefined);
  });

  it("should save correct values", function() {
    layer.table.set('geometry_types', ["st_point"]);
    layer.table.set('geometry_types', ["st_polygon"]);
    layer.wizard_properties.active('polygon')
    var mf = layer.wizard_properties.get('marker-fill')
    expect(mf).toEqual(undefined);
  });

  it("should not active wizard when there is no geometry type", function() {
    layer.table.set('geometry_types', ["st_point"]);
    layer.wizard_properties.active('polygon');
    layer.table.isInSQLView = function() { return true; }
    layer.table.set('geometry_types', []);
    layer.wizard_properties.active('bubble');
    expect(layer.wizard_properties.get('type')).toEqual('polygon');
  });

  it("should apply a wizard with it becomes valid", function() {
    var called = 0;
    layer.table.set('geometry_types', ["st_point"]);
    layer.table.set({ schema: [['test', 'string']] });
    layer.wizard_properties.cartoStylesGeneration.bind('change', function() {
      ++called;
    });
    layer.wizard_properties.active('polygon');
    expect(called).toEqual(1);
    layer.wizard_properties.active('bubble');
    expect(called).toEqual(1);
    layer.table.set({ schema: [['test', 'number']] });
    expect(called).toEqual(2);
    expect(layer.wizard_properties.get('property')).toEqual('test');
    layer.table.set({ schema: [['test2', 'number'], ['test', 'number']] });
    expect(layer.wizard_properties.get('property')).toEqual('test');
  });

  it("should force parameter override when geometry does not match", function() {
    layer.table.set('geometry_types', ["st_point"]);
    layer.wizard_properties.active('polygon');
    layer.table.set('geometry_types', ["st_polygon"], {silent: true});
    layer.wizard_properties.active('polygon');
    expect(layer.wizard_properties.get('marker-width')).toEqual(undefined);
    expect(layer.wizard_properties.get('polygon-fill')).not.toEqual(undefined);
  });

  it("should raise a change:form when geometry_type changes", function() {
    var c = 0;
    layer.wizard_properties.bind('change:form', function() {
      ++c;
    });
    layer.table.set('geometry_types', []);
    expect(c).toEqual(1);
    layer.table.set('geometry_types', ["st_point"]);
    expect(c).toEqual(2);
  });


  // this test reproduces when the table is loaded after
  // the layer has been loaded
  it("should not override previos wizard style", function() {

    layer = new cdb.admin.CartoDBLayer();
    layer.sync = function() {}
    var called = 0;
    layer.wizard_properties.cartoStylesGeneration.bind('change', function() {
      ++called;
    });

    layer.set({
      tile_style_custom: false,
      tile_style: 'test',
    });

    layer.wizard_properties.properties({
        type: "choropleth",
        geometry_type:'st_point',
        properties: {
        property: "vel",
        method: "7 Buckets",
        qfunction: "Quantile",
        color_ramp: "red",
        'marker-opacity': 0.8,
        'marker-width': 12,
        'marker-allow-overlap': true,
        'marker-placement': "point",
        'marker-type': "ellipse",
        'marker-line-width': 2,
        'marker-line-color': "#FFF",
        'marker-line-opacity': 1,
        'marker-comp-op': "none",
        zoom: 18
        }
    });
    expect(called).toEqual(0);
    var schema = [ [ "cartodb_id", "number" ], [ "the_geom", "geometry", "geometry", "point" ], [ "ax", "string" ], [ "ay", "string" ], [ "az", "string" ], [ "dir", "string" ], [ "field_12", "string" ], [ "lat", "string" ], [ "lon", "string" ], [ "pitch", "string" ], [ "roll", "string" ], [ "time", "number" ], [ "vel", "number" ], [ "yaw", "string" ], [ "created_at", "date" ], [ "updated_at", "date" ] ];
    layer.table.set({
      name: "sensor_log_2013_10_27_12_01",
      privacy: "PUBLIC",
      schema: schema,
      updated_at: "2013-11-04T10:19:39+01:00",
      rows_counted: 13079,
      table_size: 2584576,
      map_id: 29086,
      description: null,
      geometry_types: [
      "ST_Point"
      ]
    });
    expect(called).toEqual(0);
    var s = _.clone(schema)
    s.push(['testest', 'number'])
    layer.table.set('schema', s);
    expect(called).toEqual(0);
  });

  it("should update properties when a column being used is removed ", function() {
    layer.table.set('geometry_types', ["st_point"]);
    layer.table.set({ schema: [
      ['c0', 'number'],
      ['c1', 'number'],
      ['c2', 'number']
    ] });
    layer.wizard_properties.active('bubble');
    layer.wizard_properties.set('property', 'c1');
    layer.table.set({ schema: [
      ['c0', 'number'],
      ['c2', 'number']
    ] });
    expect(layer.wizard_properties.get('property')).toEqual('c0');

  });

  it("should not use saved data when is restored", function() {
    layer.table.set('geometry_types', ["st_point"]);
    layer.table.set({ schema: [['test', 'string'], ['test2', 'number']] });
    layer.wizard_properties.active('bubble');
    layer.table.set({ schema: [['test', 'string']] });
    expect(layer.wizard_properties.get('type')).toEqual('polygon');
    layer.wizard_properties.active('bubble');
    layer.table.set({ schema: [['test', 'string'], ['test3', 'number']] });
    expect(layer.wizard_properties.get('type')).toEqual('bubble');
    expect(layer.wizard_properties.get('property')).toEqual('test3');
  });

  it("should update forms even if they are not active", function() {
    layer.table.set('geometry_types', ["st_point"]);
    layer.table.set({ schema: [['test', 'string']] });
    layer.wizard_properties.active('polygon');
    layer.wizard_properties.active('bubble');
    layer.wizard_properties.get('property', undefined);
    layer.wizard_properties.active('polygon');
    layer.table.set({ schema: [
      ['test', 'string'],
      ['test2', 'number']
    ]});
    layer.wizard_properties.active('bubble');
    expect(layer.wizard_properties.get('property')).toEqual('test2');
  });

  it("should not save layer if it's new", function() {
    layer.unset('id')
    spyOn(layer, 'save');
    layer.wizard_properties.cartoStylesGeneration.set('style', 'testing');
    expect(layer.save).not.toHaveBeenCalled();
  })

  it("should regenerate wizard when the geometry is empty", function() {
    layer.table.set('geometry_types', ["st_point"]);
    layer.wizard_properties.active('polygon');
    layer.table.set('geometry_types', []);
    expect(layer.wizard_properties.get('type')).toEqual(undefined);
  });

});

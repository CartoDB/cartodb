
describe("cdb.admin.CartoStyles", function() {

  var table;
  beforeEach(function() {
    table_polygons  = new cdb.admin.CartoDBTableMetadata({ name: 'test_table', geometry_types: ['st_polygon'] });
    table_polylines = new cdb.admin.CartoDBTableMetadata({ name: 'test_table', geometry_types: ['st_multilinestring'] });
    table_points = new cdb.admin.CartoDBTableMetadata({ name: 'test_table', geometry_types: ['st_multipoint'] });

    table_empty = new cdb.admin.CartoDBTableMetadata({ name: 'test_table', geometry_types: [] });
  });


  describe("simple polygon generation", function() {
    it("should return valid css", function() {
      var css;
      simple_polygon_generator(table_polygons, {
        'polygon-fill': '#FF6600',
        'line-color': '#FFFFFF',
        'line-width': 1,
        'polygon-opacity': 0.7,
        'line-opacity':1,
        'marker-opacity': 0.2,
      }, {}, function(style) { css = style; });

      expect(css.indexOf('#test_table') != -1).toEqual(true);
      expect(css.indexOf('polygon-fill: #FF6600;') != -1).toEqual(true);
      expect(css.indexOf('line-opacity: 1;') != -1).toEqual(true);
      expect(css.indexOf('marker-fill-opacity: 0.2;') != -1).toEqual(true);
    });


    it("should quota text-name entries", function() {
      var css;
      simple_polygon_generator(table_polygons, {
        'polygon-fill': '#FF6600',
        'line-color': '#FFFFFF',
        'text-name': 'test'
      }, {}, function(style) { css = style; });

      expect(css.indexOf("[test]") != -1).toEqual(true);
    });

    it("should remove text properies if the font is none", function() {
      var css;
      simple_polygon_generator(table_polygons, {
        'polygon-fill': '#FF6600',
        'line-color': '#FFFFFF',
        'text-name': 'None',
        'text-face-name': 'jajaja'
      }, {}, function(style) { css = style; });
      expect(css.indexOf("text-name") == -1).toEqual(true);
      expect(css.indexOf("text-face-name") == -1).toEqual(true);
      expect(css.indexOf("polygon-fill") != -1).toEqual(true);

    });

    it("should create a layer with text-properties", function() {
      var css;
      simple_polygon_generator(table_polygons, {
        'polygon-fill': '#FF6600',
        'line-color': '#FFFFFF',
        'text-name': 'test',
        'text-face-name': 'jajaja',
        'text-fill': '#fff',
        'text-allow-overlap': true
      }, {}, function(style) { css = style; });

      var layerStartIndex = css.indexOf("#test_table::labels")
      expect(layerStartIndex != -1).toEqual(true);
      expect(css.indexOf("text-face-name") > layerStartIndex).toEqual(true);
      expect(css.indexOf("text-name") > layerStartIndex).toEqual(true);
      expect(css.indexOf("text-fill") > layerStartIndex).toEqual(true);
      expect(css.indexOf("text-allow-overlap") > layerStartIndex).toEqual(true);
    });

    it ("should not allow polygon-patter-file and polygon-fill at the same time", function() {
      simple_polygon_generator(table_polygons, {
        'polygon-fill': '#FF6600',
        'line-color': '#FFFFFF',
        'polygon-pattern-file': 'url(https://s3.amazonaws.com/com.cartodb.assets.dev/development/dev/assets/layers.png)'
      }, {}, function(style) { css = style; });
      expect(css.indexOf("polygon-fill")).toEqual(-1);

    });

  });


  describe("simple polyline generation", function() {
    it("should return valid css", function() {
      var css;
      simple_polygon_generator(table_polylines, {
        'line-color': '#FFFFFF',
        'line-width': 1,
        'line-opacity':1
      }, {}, function(style) { css = style; });

      expect(css.indexOf('#test_table') != -1).toEqual(true);
      expect(css.indexOf('polygon-fill') == -1).toEqual(true);
      expect(css.indexOf('polygon-opacity') == -1).toEqual(true);
      expect(css.indexOf('line-opacity: 1;') != -1).toEqual(true);
    });
  });


  describe("bubble generator", function() {
    it("should return valid css", function() {
      var css;
      var p = {
       'marker-fill': '#FFF',
       'marker-line-color': '#F00',
       'marker-line-width': 1,
       'marker-line-opacity': 0.5,
       'marker-opacity': 0.6,
       'property': 'property_test',
       'radius_max': 10,
       'radius_min': 0,
       'qfunction': 'Equal Interval'
      };
      var originalDataUsed = false;
      table_polygons.data = function() {
        originalDataUsed = true;
        return table_polygons._data;
      }

      sinon.stub(table_polygons.data(), '_sqlQuery').yields({
        //rows: [{maxamount:1},{maxamount:2},{maxamount:3},{maxamount:4}, {maxamount:5},{maxamount:6},{maxamount:7},{maxamount:8},{maxamount:9},{maxamount:10}]
        rows: [{max: 10, min: 0, s: 1}]
      });
      bubble_generator(table_polygons, p, {}, function(style) {
        css = style;
      });

      expect(originalDataUsed).toEqual(true);
      expect(css.indexOf('property: property_test') == -1).toEqual(true);
      expect(css.indexOf('#test_table') != -1).toEqual(true);
      expect(css.indexOf('marker-fill: #FFF;') != -1).toEqual(true);
      expect(css.indexOf('marker-fill-opacity: 0.6;') != -1).toEqual(true);
      for(var i = 1; i <= 10; ++i) {
        expect(css.indexOf("#test_table [ property_test <= " + i + "]") != -1).toEqual(true);
      }
    });
  });


  it("should return valid css polygon", function() {
    var css;
    var p = {
     'line-color': '#FFF',
     'line-opacity': 0.2,
     'line-width': 3,
     'polygon-opacity': 0.3,
     'property': 'property_test',
     'color_ramp': 'red',
     'method': '5 Buckets',
     'radius_min': 0,
     'comp-op': 'src',
     'qfunction': 'Equal Interval'
    };

    sinon.stub(table_polygons.data(), '_sqlQuery').yields({
        rows: [{max: 5, min: 0, s: 1}]
    });
    choropleth_generator(table_polygons, p, {}, function(style) {
      css = style;
    });

    expect(css.indexOf('property: property_test') == -1).toEqual(true);
    expect(css.indexOf('#test_table') != -1).toEqual(true);
    expect(css.indexOf('line-color: #FFF;') != -1).toEqual(true);
    expect(css.indexOf('line-opacity: 0.2;') != -1).toEqual(true);
    expect(css.indexOf('polygon-opacity: 0;') == -1).toEqual(true);
    for(var i = 1; i <= 5; ++i) {
      expect(css.indexOf("#test_table [ property_test <= " + i + "]") != -1).toEqual(true);
    }
  });

  it("should return valid css point", function() {
    var css;
    var p = {
      'marker-width': 12,
      'marker-opacity': 0.5,
      'marker-line-width': 3,
      'marker-line-color': '#FFF',
      'marker-line-opacity': 0.5,
      'polygon-opacity': undefined,
      'property': 'property_test',
      'color_ramp': 'red',
      'method': '5 Buckets',
      'radius_min': 0,
      'comp-op': 'src',
      'qfunction': 'Equal Interval'
    };

    sinon.stub(table_points.data(), '_sqlQuery').yields({
        rows: [{max: 5, min: 0, s: 1}]
    });
    choropleth_generator(table_points, p, {}, function(style) {
      css = style;
    });

    expect(css.indexOf('property: property_test') == -1).toEqual(true);
    expect(css.indexOf('#test_table') != -1).toEqual(true);
    expect(css.indexOf('marker-width: 12;') != -1).toEqual(true);
    expect(css.indexOf('polygon-opacity') == -1).toEqual(true);
    expect(css.indexOf('marker-line-width: 3;') != -1).toEqual(true);
    expect(css.indexOf('marker-fill-opacity: 0.5;') != -1).toEqual(true);
    for(var i = 1; i <= 5; ++i) {
      expect(css.indexOf("#test_table [ property_test <= " + i + "]") != -1).toEqual(true);
    }
  });

  it("should return valid css for less quartiles than requested", function() {
    var css;
    var p = {
     'line-color': '#FFF',
     'line-opacity': 0.2,
     'line-width': 3,
     'property': 'property_test',
     'color_ramp': 'red',
     'method': '5 Buckets',
     'radius_min': 0,
     'text-name': 'none',
     'comp-op': 'src',
     'qfunction': 'Equal Interval'
    };

    sinon.stub(table_polylines.data(), '_sqlQuery').yields({
      rows: [{maxamount:1},{maxamount:2},{maxamount:3},
      {maxamount: 2147483649}]
    });

    choropleth_generator(table_polylines, p, {}, function(style) {
      css = style;
    });

    expect(css.indexOf('undefined')).toEqual(-1);
  });

  it("should return valid css for polyline", function() {
    var css;
    var p = {
     'line-color': '#FFF',
     'line-opacity': 0.2,
     'line-width': 3,
     'property': 'property_test',
     'color_ramp': 'red',
     'method': '5 Buckets',
     'radius_min': 0,
     'qfunction': 'Equal Interval'
    };

    sinon.stub(table_polylines.data(), '_sqlQuery').yields({
        rows: [{max: 4, min: 0, s: 1}]
    });

    choropleth_generator(table_polylines, p, {}, function(style) {
      css = style;
    });

    expect(css.indexOf('property: property_test') == -1).toEqual(true);
    expect(css.indexOf('#test_table') != -1).toEqual(true);
    expect(css.indexOf('line-color: #FFFFB2;') != -1).toEqual(true);
    expect(css.indexOf('line-opacity: 0.2;') != -1).toEqual(true);
    expect(css.indexOf('polygon-opacity: 0;') != -1).toEqual(true);

    for(var i = 1; i <= 4; ++i) {
      expect(css.indexOf("#test_table [ property_test <= " + i + "]") != -1).toEqual(true);
    }
  });

  it("density should generate many zooms", function() {
    var css;
    var p = {
     'line-color': '#FFF',
     'line-opacity': 0.2,
     'line-width': 3,
     'polygon-opacity': 0.3,
     'property': 'property_test',
     'color_ramp': 'red',
     'method': '5 Buckets',
     'radius_min': 0,
     'polygon-size': 10
    };

    sinon.stub(table_polygons.data(), '_sqlQuery').yields({
      rows: [{z: 0, maxdensity:1},{z: 0, maxdensity:2},{z: 2,maxdensity:3},{z: 2, maxdensity:4}, {z: 2, maxdensity:5}]
    });
    density_generator(table_polygons, p, {}, function(style) {
      css = style;
    });

    expect(css.indexOf('#test_table') != -1).toEqual(true);
    expect(css.indexOf('line-color: #FFF;') != -1).toEqual(true);
    expect(css.indexOf('line-opacity: 0.2;') != -1).toEqual(true);
    expect(css.indexOf('polygon-opacity: 0;') == -1).toEqual(true);
    for(var i = 1; i <= 5; ++i) {
      expect(css.indexOf("[points_density <= " + i + "]") != -1).toEqual(true);
    }
  });

  it("torque category should generate sql", function() {
    var sql = cdb.admin.carto.torque_cat.sql([
    {
      title: 'a',
      title_type: 'string'
    },
    {
      title: 'b',
      title_type: 'string'
    }], 'column_cat');

    var s = [
      'select *, (CASE',
      'WHEN "column_cat" = \'a\' THEN 1',
      'WHEN "column_cat" = \'b\' THEN 2',
      'ELSE 3 END) as torque_category FROM __wrapped _cdb_wrap'
    ]

    expect(sql).toEqual(s.join(' '));

  });

  it("torque category should generate categories", function() {
    sinon.stub(table_points.data(), '_sqlQuery').yields({
      fields: {
        cat: { type: 'string' }
      },
      rows: [
        {cat: 'cat1'},
        {cat: 'cat2'},
        {cat: 'cat3'},
        {cat: 'cat4'}
      ]
    });

    var css;
    var p = {
      'property': 'test',
      'torque-duration': 10,
      'torque-frame-count': 12,
      'torque-blend-mode': 'lighten',
      'torque-trails': 1,
      'torque-resolution': 1,
      'property_cat': 'cat',
    };

    cdb.admin.carto.torque_cat.generate(table_points, p, {}, function(style) {
      css = style;
    });
    console.log(css);
    expect(css.indexOf('-torque-aggregation-function:"CDB_Math_Mode(torque_category)"') !== -1).toEqual(true)
    expect(css.indexOf('[value=0]') === -1).toEqual(true);
    expect(css.indexOf('[value=1]') !== -1).toEqual(true);

  });




  describe("cdb.admin.CartoStyles", function() {
    var model, table;

    beforeEach(function() {
      table = new cdb.admin.CartoDBTableMetadata({ name: 'test' });
      model = new cdb.admin.CartoStyles({ table: table_polygons });
    });

    it("should not regenerate carto style when table name changes", function() {
      var s = sinon.spy();
      model.bind('change:style', s);
      table.set({name: 'test2'});
      expect(s.called).toEqual(false);
    });

    it("should generate carto style when properties changes", function() {
      var s = sinon.spy();
      model.bind('change:style', s);
      model.set({ properties: { 'polygon-fill': '#FFF' }});
      expect(s.called).toEqual(true);
    });

    it("should add changes object when any change has happened in properties", function() {
      var changes = {};

      model.registerGenerator('jam_type', function(table, props, changed, callback) {
        changes = changed;
      });

      model.set('type', 'jam_type');
      model.set({ properties: { 'polygon-fill': '#FFF' }});

      expect(_.isEmpty(changes)).toBeFalsy();
      expect(changes['polygon-fill']).toBe('#FFF');
    });

  });


  describe("cartoparser", function() {
    var parser, style;
    beforeEach(function() {
      style = "" +
       "   @test_var: #FF6622; " +
      " #sensor_log_2013_06_02_12_43{" +
       "   marker-fill: #FF6611;" +
       "   marker-opacity: 1;" +
          "marker-width: [ax]*3;" +
       "   marker-line-color: white;" +
       "   marker-line-width: 3;" +
       "   marker-line-opacity: 0.9;" +
       "   marker-placement: point;" +
       "   marker-type: ellipse;marker-allow-overlap: true;" +
          "[az > 1] {" +
        " marker-fill:@test_var;" +
        "}" +
        "[zoom = 12][az > 1] {" +
        " marker-fill: red;" +
        "}" +
        "[mapnik-geometry-type = 'point'] {" +
        " marker-fill: blue;" +
        "}" +
       "}";
      parser = new cdb.admin.CartoParser(style);
    });

    it("should report errors", function() {
      expect(parser.errors().length).toEqual(0);
      parser.parse(style + "#whatever {aksdjj; lakjsdk; jaksdjaks;}");
      expect(parser.errors().length > 0 ).toEqual(true);
    });

    it("should get the variables used", function() {
      var vars = parser.variablesUsed();
      expect(vars.indexOf('ax')).not.toEqual(-1);
      expect(vars.indexOf('az')).not.toEqual(-1);
      expect(vars.indexOf('zoom')).toEqual(-1);
      expect(vars.indexOf('mapnik-geometry-type')).toEqual(-1);
    });

    it("shoudl return the rules for main definition", function() {
      var rules = [
       'marker-fill',
       'marker-opacity',
       'marker-width',
       'marker-line-color',
       'marker-line-width',
       'marker-line-opacity',
       'marker-placement',
       'marker-type',
       'marker-allow-overlap'
      ];
      var vars = parser.getDefaultRules();
      for(var r in rules) {
        expect(rules[r] in vars).toEqual(true);
      }

    });

  });
});

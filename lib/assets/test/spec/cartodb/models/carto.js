
describe("cbd.admin.CartoStyles", function() {

  var table;
  beforeEach(function() {
    table_polygons  = new cdb.admin.CartoDBTableMetadata({ name: 'test_table', geometry_types: ['st_polygon'] });
    table_polylines = new cdb.admin.CartoDBTableMetadata({ name: 'test_table', geometry_types: ['st_multilinestring'] });

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
        'line-opacity':1
      }, function(style) { css = style; });

      expect(css.indexOf('#test_table') != -1).toEqual(true);
      expect(css.indexOf('polygon-fill: #FF6600;') != -1).toEqual(true);
      expect(css.indexOf('line-opacity: 1;') != -1).toEqual(true);
    });




    it("should quota text-name entries", function() {
      var css;
      simple_polygon_generator(table_polygons, {
        'polygon-fill': '#FF6600',
        'line-color': '#FFFFFF',
        'text-name': 'test'
      }, function(style) { css = style; });

      expect(css.indexOf("[test]") != -1).toEqual(true);
    });

    it("should remove text properies if the font is none", function() {
      var css;
      simple_polygon_generator(table_polygons, {
        'polygon-fill': '#FF6600',
        'line-color': '#FFFFFF',
        'text-name': 'None',
        'text-face-name': 'jajaja'
      }, function(style) { css = style; });
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
      }, function(style) { css = style; });

      var layerStartIndex = css.indexOf("#test_table::labels")
      expect(layerStartIndex != -1).toEqual(true);
      expect(css.indexOf("text-face-name") > layerStartIndex).toEqual(true);
      expect(css.indexOf("text-name") > layerStartIndex).toEqual(true);
      expect(css.indexOf("text-fill") > layerStartIndex).toEqual(true);
      expect(css.indexOf("text-allow-overlap") > layerStartIndex).toEqual(true);
    });

  });


  describe("simple polyline generation", function() {
    it("should return valid css", function() {
      var css;
      simple_polygon_generator(table_polylines, {
        'line-color': '#FFFFFF',
        'line-width': 1,
        'line-opacity':1
      }, function(style) { css = style; });

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
      table_polygons.originalData = function() {
        originalDataUsed = true;
        return table_polygons._data;
      }

      sinon.stub(table_polygons.data(), '_sqlQuery').yields({
        rows: [{maxamount:1},{maxamount:2},{maxamount:3},{maxamount:4},
        {maxamount:5},{maxamount:6},{maxamount:7},{maxamount:8},{maxamount:9},{maxamount:10}]
      });
      bubble_generator(table_polygons, p, function(style) {
        css = style;
      });

      expect(originalDataUsed).toEqual(true);
      expect(css.indexOf('property: property_test') == -1).toEqual(true);
      expect(css.indexOf('#test_table') != -1).toEqual(true);
      expect(css.indexOf('marker-fill: #FFF;') != -1).toEqual(true);
      expect(css.indexOf('marker-opacity: 0.6;') != -1).toEqual(true);
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
      rows: [{maxamount:1},{maxamount:2},{maxamount:3},{maxamount:4},
      {maxamount:5}]
    });
    choropleth_generator(table_polygons, p, function(style) {
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

    choropleth_generator(table_polylines, p, function(style) {
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
      rows: [{maxamount:1},{maxamount:2},{maxamount:3},{maxamount:4},
      {maxamount: 2147483649}]
    });

    choropleth_generator(table_polylines, p, function(style) {
      css = style;
    });

    expect(css.indexOf('property: property_test') == -1).toEqual(true);
    expect(css.indexOf('#test_table') != -1).toEqual(true);
    expect(css.indexOf('line-color: #FFF;') != -1).toEqual(true);
    expect(css.indexOf('line-opacity: 0.2;') != -1).toEqual(true);
    expect(css.indexOf('polygon-opacity: 0;') != -1).toEqual(true);
    for(var i = 1; i <= 4; ++i) {
      expect(css.indexOf("#test_table [ property_test <= " + i + "]") != -1).toEqual(true);
    }
    var maxNumber = 2147483648 + '.01';
    expect(css.indexOf("#test_table [ property_test <= 2147483649.01]") != -1).toEqual(true);
  });

  it("should work for tables without geometry", function() {
    var css;
    var p = {
     'property': 'cartodb_id'
    };

    sinon.stub(table_empty.data(), '_sqlQuery').yields({
      rows: [{maxamount:1},{maxamount:2},{maxamount:3},{maxamount:4},
      {maxamount:5}]
    });
    choropleth_generator(table_empty, p, function(style) {
      css = style;
    });

/*
    expect(css.indexOf('property: property_test') == -1).toEqual(true);
    expect(css.indexOf('#test_table') != -1).toEqual(true);
    expect(css.indexOf('line-color: #FFF;') != -1).toEqual(true);
    expect(css.indexOf('line-opacity: 0.2;') != -1).toEqual(true);
    expect(css.indexOf('polygon-opacity: 0;') != -1).toEqual(true);
    for(var i = 1; i <= 5; ++i) {
      expect(css.indexOf("#test_table [ property_test <= " + i + "]") != -1).toEqual(true);
    }
    */
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
    density_generator(table_polygons, p, function(style) {
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

    it("should always trigger changes on style when properties change", function() {

      var count = 0;
      model.bind('change:style', function() {
        ++count;
      });
      model.set({ properties: { 'polygon-fill': '#FFF' }});
      model.set({ properties: { 'polygon-fill': '#FFF' }});
      expect(count).toEqual(2);
    })

  });
});

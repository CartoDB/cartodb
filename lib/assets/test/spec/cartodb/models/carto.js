
describe("cbd.admin.CartoStyles", function() {

  var table;
  beforeEach(function() {
    table_polygons  = new cdb.admin.CartoDBTableMetadata({ name: 'test_table', geometry_types: ['st_polygon'] });
    table_polylines = new cdb.admin.CartoDBTableMetadata({ name: 'test_table', geometry_types: ['st_multilinestring'] });
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
       'radius_min': 0
      };
      sinon.stub(table_polygons.data(), '_sqlQuery').yields({
        rows: [{maxamount:1},{maxamount:2},{maxamount:3},{maxamount:4},
        {maxamount:5},{maxamount:6},{maxamount:7},{maxamount:8},{maxamount:9},{maxamount:10}]
      });
      bubble_generator(table_polygons, p, function(style) {
        css = style;
      });

      expect(css.indexOf('property: property_test') == -1).toEqual(true);
      expect(css.indexOf('#test_table') != -1).toEqual(true);
      expect(css.indexOf('marker-fill: #FFF;') != -1).toEqual(true);
      expect(css.indexOf('marker-opacity: 0.6;') != -1).toEqual(true);
      for(var i = 1; i <= 10; ++i) {
        expect(css.indexOf("#test_table [ property_test <= " + i + "]") != -1).toEqual(true);
      }
    });
  });


  describe("choropleth generator for polygon", function() {
    it("should return valid css", function() {
      var css;
      var p = {
       'line-color': '#FFF',
       'line-opacity': 0.2,
       'line-width': 3,
       'polygon-opacity': 0.3,
       'property': 'property_test',
       'color_ramp': 'red',
       'method': '5 Buckets',
       'radius_min': 0
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
  });

  describe("choropleth generator for polyline", function() {

    it("should return valid css", function() {
      var css;
      var p = {
       'line-color': '#FFF',
       'line-opacity': 0.2,
       'line-width': 3,
       'property': 'property_test',
       'color_ramp': 'red',
       'method': '5 Buckets',
       'radius_min': 0
      };
      
      sinon.stub(table_polylines.data(), '_sqlQuery').yields({
        rows: [{maxamount:1},{maxamount:2},{maxamount:3},{maxamount:4},
        {maxamount:5}]
      });
      choropleth_generator(table_polylines, p, function(style) {
        css = style;
      });

      expect(css.indexOf('property: property_test') == -1).toEqual(true);
      expect(css.indexOf('#test_table') != -1).toEqual(true);
      expect(css.indexOf('line-color: #FFF;') != -1).toEqual(true);
      expect(css.indexOf('line-opacity: 0.2;') != -1).toEqual(true);
      expect(css.indexOf('polygon-opacity: 0;') != -1).toEqual(true);
      for(var i = 1; i <= 5; ++i) {
        expect(css.indexOf("#test_table [ property_test <= " + i + "]") != -1).toEqual(true);
      }
    });
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

  });
});

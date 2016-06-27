var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var PecanDialogView = require('../../../../../javascripts/cartodb/common/dialogs/pecan/pecan_dialog_view');

describe("PecanDialogView", function() {

  beforeEach(function() {
    window.user_data = { username: 'test' };

    this.user = jasmine.createSpy('cdb.admin.User');
    this.user.get = function(i) {
      return 1245;
    };

    this.table = new cdb.admin.CartoDBTableMetadata({
      id: 'table_id',
      name: 'ufo_sightings'
    });

    var css = "/* category style */";
    css += '#ufo_sightings {';
    css += ' marker-fill-opacity: 0.9;';
    css += ' marker-line-color: #FFF;';
    css += ' marker-line-width: 1;';
    css += ' marker-line-opacity: 1;';
    css += ' marker-placement: point;';
    css += ' marker-type: ellipse;';
    css += ' marker-width: 10;';
    css += ' marker-allow-overlap: true;';
    css += '}';
    css += '#ufo_sightings[geocode_precision="unmatched"] {';
    css += ' marker-fill: #A6CEE3;';
    css += '}';
    css += '#ufo_sightings[geocode_precision="zip"] {';
    css += ' marker-fill: #1F78B4;';
    css += '}';

    var columns = [
      { table_id: "table_id", css: css, column: "date_sighted", state: "analyzed", geometry_type: "point", success: false },
      { table_id: "table_id", css: css, column: "date_reported", state: "analyzed", geometry_type: "point", success: true },
      { table_id: "table_id", css: css, column: "duration", state: "analyzed", geometry_type: "point", success: false },
      { table_id: "table_id", css: css, column: "city", state: "analyzed", geometry_type: "point", success: false },
      { table_id: "table_id", css: css, column: "geocode_score", state: "analyzed", geometry_type: "point", success: true },
      { table_id: "table_id", css: css, column: "geocode_precision", state: "analyzed", geometry_type: "point", success: true }
    ];

    this.collection = new Backbone.Collection(columns);

    this.vis = new cdb.admin.Visualization({
      type: 'derived',
      active_layer_id: 0,
      privacy: 'PUBLIC'
    });

    this.vis.table = this.table;
    this.map = new cdb.geo.Map();

    this.vis.tableMetadata().get = function(i) {
      if (i === 'row_count') {
        return 100000
      }
    }

    this.vis.map = this.map;
    this.vis.map.layers.push({ id: 0 });
    this.vis.map.layers.at(0).table = this.table;

    this.fakeMap = sinon.stub(this.map, "getLayerAt");

    this.fakeMap.returns({
      get: function(i) {
        return "http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
      }
    });

    this.view = new PecanDialogView({
      clean_on_hide: true,
      vis: this.vis,
      collection: this.collection,
      user: this.user
    });

  });

  describe("View", function() {

    it("should generate a layer definition", function() {
      var layerDefinition = this.view._generateLayerDefinition(this.collection.at(0));
      expect(layerDefinition.layers[1].options.cartocss).toBeDefined();
    });

    it("should modify the CSS if the information density is high", function() {
      var layerDefinition = this.view._generateLayerDefinition(this.collection.at(0));
      expect(layerDefinition.layers[1].options.cartocss).toContain("marker-width: 7;");
      expect(layerDefinition.layers[1].options.cartocss).toContain("marker-line-width: 0.7;");
    });

    it("should return the template if it's supported", function() {
      this.fakeMap.restore();
      this.fakeMap = sinon.stub(this.map, "getLayerAt");
      this.fakeMap.returns({
        get: function(i) {
          return "http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"
        }
      });
      expect(this.view._setupTemplate()).toEqual("http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png")
    });

    it("should return the default template if the template is not supported", function() {
      this.fakeMap.restore();
      this.fakeMap = sinon.stub(this.map, "getLayerAt");
      this.fakeMap.returns({
        get: function(i) {
          return "http://{s}.basemaps.cartocdn.com/UNKNOWN_TEMPLATE/{z}/{x}/{y}.png"
        }
      });
      expect(this.view._setupTemplate()).toEqual(this.view._DEFAULT_BASEMAP_TEMPLATE);
    });

    it("should return the default template if the layer doesn't have one", function() {
      this.fakeMap.restore();
      this.fakeMap = sinon.stub(this.map, "getLayerAt");
      this.fakeMap.returns({
        get: function(i) {
          return undefined
        }
      });
      expect(this.view._setupTemplate()).toEqual(this.view._DEFAULT_BASEMAP_TEMPLATE)
    });

    it("should skip", function() {
      this.fakeMap.restore();
      this.fakeMap = sinon.stub(this.map, "getLayerAt");

      this.fakeMap.returns({
        get: function(i) {
          return undefined;
        }
      });

      this.view.cancel();

      var skipPecanDialog = 'pecan_1245_ufo_sightings';
      expect(localStorage[skipPecanDialog]).toBe("true");
    });
  });
});

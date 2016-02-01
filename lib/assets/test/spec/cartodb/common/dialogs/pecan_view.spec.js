var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var PecanView = require('../../../../../javascripts/cartodb/common/dialogs/pecan/pecan_view');
var BackgroundPollingModel = require('../../../../../javascripts/cartodb/common/background_polling/background_polling_model');

describe("PecanView", function() {

  function stubTable(table, opts) {
    var fakeData = sinon.stub(table, 'data');

    var isGeoreferenced = sinon.stub(table, "isGeoreferenced");

    isGeoreferenced.returns(!opts || (opts && opts.isGeoreferenced === undefined) ? true : opts.isGeoreferenced);

    var query_schema = (opts && opts.query_schema) ? opts.query_schema : {
      cartodb_id: "number",
      the_geom: "geometry",
      something: "string",
      created_at: "number",
      updated_at: "number"
    };

    fakeData.returns({
      query_schema: query_schema,
      table: {
        get: function(p) {
          if (p === 'rows_counted') {
            return (opts && opts.row_count) ? opts.row_count : 100
          }
          if (p === 'geometry_types') {
            return ["ST_Point"]
          }
        }
      }
    });
  }

  beforeEach(function() {
    window.user_data = { username: 'test' };

    this.user = jasmine.createSpy('cdb.admin.User');

    this.backgroundPollingModel = new BackgroundPollingModel({}, {
      user: this.user
    });

    spyOn(this.backgroundPollingModel, "addAnalysis")

    this.table = new cdb.admin.CartoDBTableMetadata({
      id: 'table_id',
      name: 'table_name'
    });
  });

  describe("View", function() {

    it("should exclude certain columns", function() {
      var contain = false;

      var view = new PecanView({
        table: this.table,
        backgroundPollingModel: this.backgroundPollingModel
      });

      contain = _.every(['id', 'cartodb_id', 'lat', 'lon', 'lng', 'long', 'latitude', 'longitude'], function(column) {
        return _.contains(view._EXCLUDED_COLUMNS, column);
      });

      expect(contain).toEqual(true);
    });

    it("should create an analysis if the table size is OK", function() {
      stubTable(this.table, { row_count: 100 });

      var view = new PecanView({
        table: this.table,
        backgroundPollingModel: this.backgroundPollingModel
      });

      expect(view.backgroundPollingModel.addAnalysis).toHaveBeenCalled();
    });

    it("should not create an analysis if the table is not georeferenced", function() {
      stubTable(this.table, { row_count: 100, isGeoreferenced: false });

      var view = new PecanView({
        table: this.table,
        backgroundPollingModel: this.backgroundPollingModel
      });

      expect(view.backgroundPollingModel.addAnalysis).not.toHaveBeenCalled();
    });

    it("should not create an analysis if the numer of rows is > _MAX_ROWS", function() {
      stubTable(this.table, { row_count: PecanView.prototype._MAX_ROWS + 1 });

      var view = new PecanView({
        table: this.table,
        backgroundPollingModel: this.backgroundPollingModel
      });

      expect(view.backgroundPollingModel.addAnalysis).not.toHaveBeenCalled();
    });

    it("should not create an analysis if the number of columns is > _MAX_COLS", function() {

      var query_schema = {
        cartodb_id: "number",
        the_geom: "geometry",
        created_at: "number",
        updated_at: "number"
      };

      for (var i = 0; i < PecanView.prototype._MAX_COLS; i++) {
        query_schema["col_" + i] = _.shuffle(["boolean", "number", "string"])[0]
      }

      stubTable(this.table, { query_schema: query_schema });

      var view = new PecanView({
        table: this.table,
        backgroundPollingModel: this.backgroundPollingModel
      });

      expect(view.backgroundPollingModel.addAnalysis).not.toHaveBeenCalled();
    });

    it("should generate a collection of columns based on the schema", function() {
      stubTable(this.table);

      var view = new PecanView({
        table: this.table,
        backgroundPollingModel: this.backgroundPollingModel
      });

      expect(view.columns.length).toBe(2);
      expect(view.columns.at(0).get("name")).toBe("the_geom");
      expect(view.columns.at(0).get("geometry_type")).toBe("point");

      expect(view.columns.at(1).get("name")).toBe("something");
      expect(view.columns.at(1).get("geometry_type")).toBe("point");
    });

  });
});

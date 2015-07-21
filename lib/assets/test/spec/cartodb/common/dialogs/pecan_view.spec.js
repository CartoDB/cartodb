var $ = require('jquery');
var _ = require('underscore');
var cdb = require('cartodb.js');
var PecanView = require('../../../../../javascripts/cartodb/common/dialogs/pecan/pecan_view');
var BackgroundPollingModel = require('../../../../../javascripts/cartodb/common/background_polling/background_polling_model');


describe("pecan_view", function() {

  function stubTable(table, row_count) {
    var fakeData = sinon.stub(table, 'data');

    fakeData.returns({
      length: 100,
      table: {
        get: function(p) {
          if (p === 'rows_counted') {
            return row_count
          }
          if (p === 'stats_geometry_types') {
            return ["ST_Point"]
          }
        }
      },
      query_schema: {
        cartodb_id: "number",
        the_geom: "geometry",
        something: "string",
        created_at: "number",
        updated_at: "number"
      }
    });

  }

  afterEach(function() {
    //this.view.clean();
    this.server.restore();
  });

  beforeEach(function() {

    this.server = sinon.fakeServer.create();
    this.server.respondWith("GET", "/api/v2/sql?q=select * from (SELECT * FROM table_id) __wrap limit 0", [200, { "Content-Type": "application/json" }, '{ "response": true }']);

    window.user_data = { username: 'test' };

    spyOn($, 'ajax');

    this.user = jasmine.createSpy('cdb.admin.User');

    this.backgroundPollingModel = new BackgroundPollingModel({}, {
      user: this.user
    });

    spyOn(this.backgroundPollingModel, "addAnalysis")

    this.table = new cdb.admin.CartoDBTableMetadata({
      id: 'table_id',
      name: 'table_name'
    });

    this.container = $('<div>').css('height', '200px');

    this.map = new cdb.geo.Map();

    this.mapView = new cdb.geo.MapView({
      el: this.container,
      map: this.map
    });

    //this.view = new PecanView({
    //table: this.table,
    //backgroundPollingModel: this.backgroundPollingModel
    //});
  });

  describe("Dialog", function() {
    it("should create an analysis if the table size is OK", function() {
      stubTable(this.table, 100)
      var view = new PecanView({
        table: this.table,
        backgroundPollingModel: this.backgroundPollingModel
      });

      expect(view.backgroundPollingModel.addAnalysis).toHaveBeenCalled();
    });

    it("should not create an analysis if the table size is not OK", function() {
      stubTable(this.table, 500000);
      var view = new PecanView({
        table: this.table,
        backgroundPollingModel: this.backgroundPollingModel
      });

      expect(view.backgroundPollingModel.addAnalysis).not.toHaveBeenCalled();
    });

    it("should generate a collection of columns based on the schema", function() {
      stubTable(this.table, 100)
      var view = new PecanView({
        table: this.table,
        backgroundPollingModel: this.backgroundPollingModel
      });
      expect(view.columns.length).toBe(2);
      expect(view.columns.at(0).get("name")).toBe("the_geom");
      expect(view.columns.at(1).get("name")).toBe("something");
    });

  });
});

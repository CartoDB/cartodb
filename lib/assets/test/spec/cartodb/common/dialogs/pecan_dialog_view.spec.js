/*var $ = require('jquery');
var _ = require('underscore');
var cdb = require('cartodb.js');
var PecanView = require('../../../../../javascripts/cartodb/common/dialogs/pecan/pecan_view');

describe("Pecan", function() {

  afterEach(function() {
    this.view.clean();
    this.server.restore();
  });

  beforeEach(function() {

    this.server = sinon.fakeServer.create();
    this.server.respondWith("GET", "/api/v2/sql?q=select * from (SELECT * FROM table_id) __wrap limit 0", [200, { "Content-Type": "application/json" }, '{ "response": true }']);

    window.user_data = { username: 'test' };

    spyOn($, 'ajax');

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

    this.fakeData = sinon.stub(this.table, 'data');

    this.fakeData.returns({
      length: 100,
      table: {
        get: function(p) {
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


    this.user = jasmine.createSpy('cdb.admin.User');

    this.view = new PecanView({
      clean_on_hide: true,
      query_schema: this.table.data().query_schema,
      table: this.table,
      map: this.map,
      user: this.user
    });
  });

  describe("Dialog", function() {
    xit("should set the base query", function() {
      this.view._start();
      expect(this.view.query).toEqual("SELECT * FROM table_id");
    });

    xit("should generate a collection of columns based on the schema", function() {
      expect(this.view.columns.length).toBe(5);
      var cols = ["something", "cartodb_id", "created_at", "updated_at", "the_geom"];
      expect(_.difference(cols, this.view.columns.pluck("name")).length).toBe(0);
    });

    xit("should analyze each one of the non-excluded columns", function() {
      spyOn(this.view.sql, "describe")
      this.view._analyzeColumns();
      expect(this.view.sql.describe).toHaveBeenCalled();
      expect(this.view.sql.describe.calls.count()).toBe(2);
    });

    xit("should return ok if the table is valid", function() {
      expect(this.view._check()).toBe(true);
    });

    xit("should return false if the table is not valid", function() {

      this.fakeData.restore();
      this.fakeData = sinon.stub(this.table, 'data');

      this.fakeData.returns({
        length: 0,
        table: {
          get: function(p) {
            if (p === 'stats_geometry_types') {
              return ["ST_Point"]
            }
          }
        },
        query_schema: {
          cartodb_id: "number",
          something: "string",
          created_at: "number",
          updated_at: "number",
          the_geom: "geometry"
        }
      });

      expect(this.view._check()).toBe(false);
    });

    xit("should reject string columns whose weight is < 0.1", function() {
      var name = "string";
      var stats = { weight: 0.001 }
      expect(this.view._analyzeString(name, stats)).toBe(0);
    });

    xit("should reject string columns whose null_ratio is > 95%", function() {
      var name = "string";
      var stats = { null_ratio: 0.972 }
      expect(this.view._analyzeString(name, stats)).toBe(0);
    });

    xit("should accept string columns whose weight is > 0.8", function() {
      var name = "string";
      var stats = { weight: 0.95 }
      expect(this.view._analyzeString(name, stats)).toBe(1);
    });
  });

  describe('date columns', function(){
    beforeEach(function() {
      var self = this;
      this.originalExecute = cdb.admin.SQL.prototype.execute;
      // Mocked response for a date column
      cdb.SQL.prototype.execute = function(sql, vars, options, callback){
        if (sql.indexOf("limit 0") > -1) {
          vars(sql, vars, options, callback);
        } else {
          var fakeResponse = '{"rows":[{"start_time":"2014-02-24T16:50:50+0100","end_time":"2015-04-18T15:18:15+0200","moments":299}],"time":0.44,"fields":{"start_time":{"type":"date"},"end_time":{"type":"date"},"moments":{"type":"number"}},"total_rows":1}';
          if(typeof vars === 'function') callback = vars;
          callback(JSON.parse(fakeResponse));
        }
      }
    });

    xit("date columns should be analyzed", function(done){
      //spyOn(cdb.admin.SQL, "describe")
      var dateColumn = new cdb.core.Model({ name: "postedtime", type: "date", geometry_type: undefined, bbox: undefined, analyzed: false });
      this.view._analyzeColumn(dateColumn);
      expect(true === false);
      [>expect($.ajax).toHaveBeenCalled();
        expect($.ajax.calls.argsFor(0)[0].url).toEqual(
        'http://' + window.user_data.username + '.localhost.lan/api/v2/sql?q=' + encodeURIComponent("select * from (" + this.view.query + ") __wrap limit 0")
        );
        expect($.ajax.calls.argsFor(0)[0].type).toEqual('get');
        expect($.ajax.calls.argsFor(0)[0].dataType).toEqual('json');<]
    })
  });
});*/

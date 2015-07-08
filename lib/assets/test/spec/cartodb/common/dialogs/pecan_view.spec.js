var $ = require('jquery');
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

    var s = sinon.stub(this.table, 'data');

    s.returns({
      query_schema: {
        cartodb_id: "number",
        created_at: "number",
        updated_at: "number",
        the_geom: "geometry"
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

  it("should set the base query", function() {
    this.view._start();
    expect(this.view.query).toEqual("SELECT * FROM table_id");
  });

  it("should execute the base query ", function() {
    this.view._start();

    expect($.ajax).toHaveBeenCalled();
    expect($.ajax.calls.argsFor(0)[0].url).toEqual(
      'http://' + window.user_data.username + '.localhost.lan/api/v2/sql?q=' + encodeURIComponent("select * from (" + this.view.query + ") __wrap limit 0")
    );
    expect($.ajax.calls.argsFor(0)[0].type).toEqual('get');
    expect($.ajax.calls.argsFor(0)[0].dataType).toEqual('json');
  });
});

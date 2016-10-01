
describe("Geocodings", function() {

  var table, server;

  beforeEach(function() {
    cdb.config.set({
      sql_api_port: 80,
      sql_api_domain: 'carto.com',
      sql_api_endpoint: '/api/v1/sql'
    });
    this.table = TestUtil.createTable('test', [['the_geom', 'geometry'], ['cartodb_georef_status', "boolean"]]);
    this.geocoder = new cdb.admin.Geocoding();
    server = sinon.fakeServer.create();
  });

  afterEach(function() {
    server.restore();
    if (this.geocoder.dlg) this.geocoder.dlg.hide();
  });

  it("should initialize the values", function() {
    expect(this.geocoder.get('id')).toEqual(undefined);
    expect(this.geocoder.get('formatter')).toEqual('');
    expect(this.geocoder.get('table_name')).toEqual('');
    expect(this.geocoder.isGeocoding()).toBeFalsy();
  });

  it("should trigger events when state property changes", function() {
    var changed = false;
    this.geocoder.set({
      id: 666,
      formatter:  '{name}',
      table_name: 'test',
      state:      null      // state is null from the beginning when it comes from server
    }, { silent: true });

    this.geocoder.bind('geocodingStarted', function() {
      changed = true;
    }, this);

    this.geocoder.trigger('change');
    expect(changed).toBeTruthy();

  });

  it("should save and trigger event when model cancels geocoding", function(done) {
    var changed = false;
    this.geocoder.set({
      id: 666,
      formatter: '{name}',
      table_name: 'test'
    }, { silent: true });

    this.geocoder.bind('geocodingCanceled', function() {
      changed = true;
    }, this);

    this.geocoder.pollCheck(1);

    var self = this;
    setTimeout(function() {
      server.requests[0].respond(200, { "Content-Type": "application/json" }, JSON.stringify({ id: 666, state: null, processed_rows:0, total_rows:10 }) );
      self.geocoder.cancelGeocoding();
      server.requests[0].respond(200, { "Content-Type": "application/json" }, JSON.stringify({ id: 666, state: "canceled", processed_rows:0, total_rows:10 }) );
      expect(changed).toBeTruthy();

      done();

    }, 100);

  });

  it("should trigger event when model resets geocoding", function(done) {
    var changed = false;
    this.geocoder.set({
      id: 666,
      formatter: '{name}',
      table_name: 'test'
    }, { silent: true });

    this.geocoder.bind('geocodingReset', function() {
      changed = true;
    }, this);

    this.geocoder.pollCheck(1);
    var self = this;

    setTimeout(function() {
      server.requests[0].respond(200, { "Content-Type": "application/json" }, JSON.stringify({ id: 666, state: null, processed_rows:0, total_rows:10 }) );
      self.geocoder.resetGeocoding();
      server.requests[0].respond(200, { "Content-Type": "application/json" }, JSON.stringify({ id: 666, state: "reset", processed_rows:0, total_rows:10 }) );
      expect(changed).toBeTruthy();
      done();
    }, 100);

  });

});

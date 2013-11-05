
describe("Geocodings", function() {

  var table, server;

  beforeEach(function() {
    cdb.config.set({
      sql_api_port: 80,
      sql_api_domain: 'cartodb.com',
      sql_api_endpoint: '/api/v1/sql'
    });
    this.table = TestUtil.createTable('test', [['the_geom', 'geometry'], ['cartodb_georef_status', "boolean"]]);
    this.geocoder = new cdb.admin.Geocoding();
    server = sinon.fakeServer.create();
  });

  afterEach(function() {
    server.restore();
  });

  it("should initialize the values", function() {
    expect(this.geocoder.get('id')).toEqual('');
    expect(this.geocoder.get('formatter')).toEqual('');
    expect(this.geocoder.get('table_name')).toEqual('');
    expect(this.geocoder.isGeocoding()).toBeFalsy();
  });

  it("should trigger events when state property changes", function() {
    var changed = false;
    this.geocoder.set({
      'id': 2344,
      formatter: '{name}',
      table_name: 'test'
    }, { silent: true });
    this.geocoder.bind('geocodingStarted', function() {
      changed = true;
    }, this);
    
    this.geocoder.pollCheck(1);
    server.respondWith("GET", "/api/v1/geocodings/2344", [200, { "Content-Type": "application/json" },'{"id":45, "state":null, "formatter":"{name}", "table_name":"test"}']);
    
    waits(200);
    runs(function() {
      // expect(changed).toBeTruthy();
      this.geocoder.destroyCheck();
    })
    
  });

});

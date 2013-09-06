
describe("Geocoder", function() {

  var table;

  beforeEach(function() {
    cdb.config.set({
      sql_api_port: 80,
      sql_api_domain: 'cartodb.com',
      sql_api_endpoint: '/api/v1/sql'
    });
    this.table = TestUtil.createTable('test', [['the_geom', 'geometry'], ['cartodb_georef_status', "boolean"]]);
    this.geocoder = new cdb.admin.Geocoding('', this.table);
    this.geocoder.start();
    this.server = sinon.fakeServer.create();
  });

  afterEach(function() {
    this.server.restore();
  })

  it("should initialize the values", function() {
    expect(this.geocoder.lastCartoDbId).toEqual(0);
    expect(this.geocoder.current_connections).toEqual(0);
    expect(this.geocoder.queue.length).toEqual(0);
    expect(this.geocoder.total_connections).toEqual(0);
    expect(this.geocoder.georeferencing).toBeTruthy();
  });

  it("should get the number of rows to georefernece", function()  {
    var called = false;

    this.server.respondWith("POST", this.table.data().sqlApiUrl(),
        [200, { "Content-Type": "application/json" },
       '{"time":0.027975797653198242,"total_rows":1,"rows":[{"count":0}],"results":true,"modified":false}']);

    // this.server.respondWith('PUT', '/api/v1/queries/?sql=SELECT%20count(cartodb_id)%20FROM%20test%20WHERE%20cartodb_georef_status%20IS%20NULL%20OR%20cartodb_georef_status%20IS%20FALSE',
    //   TestUtil.response('{"time":0.027975797653198242,"total_rows":1,"rows":[{"count":0}],"results":true,"modified":false}'));
    this.geocoder._getTotalRegisters(function(){called = true})
    this.server.respond();
    expect(called).toBeTruthy();
  })

  it("should trigger event when there's not rows to be referenced", function()  {
    var called = false;

    this.server.respondWith("POST", this.table.data().sqlApiUrl(),
        [200, { "Content-Type": "application/json" },
       '{"time":0.027975797653198242,"total_rows":1,"rows":[{"count":0}],"results":true,"modified":false}']);

    // this.server.respondWith('/api/v1/queries/?sql=SELECT%20count(cartodb_id)%20FROM%20test%20WHERE%20cartodb_georef_status%20IS%20NULL%20OR%20cartodb_georef_status%20IS%20FALSE',
    //   TestUtil.response('{"time":0.027975797653198242,"total_rows":1,"rows":[{"count":0}],"results":true,"modified":false}'));

    this.geocoder.bind('no-data', function(){called = true});
    this.geocoder._getTotalRegisters(function(){})
    this.server.respond();
    expect(called).toBeTruthy();
  })

  it("should update info when there's  rows to be referenced", function()  {
    this.server.respondWith("POST", this.table.data().sqlApiUrl(),
        [200, { "Content-Type": "application/json" },
       '{"time":0.027975797653198242,"total_rows":1,"rows":[{"count":1}],"results":true,"modified":false}']);

    // this.server.respondWith('/api/v1/queries/?sql=SELECT%20count(cartodb_id)%20FROM%20test%20WHERE%20cartodb_georef_status%20IS%20NULL%20OR%20cartodb_georef_status%20IS%20FALSE',
    //   TestUtil.response('{"time":0.027975797653198242,"total_rows":1,"rows":[{"count":1}],"results":true,"modified":false}'));

    this.geocoder._getTotalRegisters(function(){})
    this.server.respond();
    expect(this.geocoder.totalRegisters).toEqual(1);
  });

  it("should feed the queue", function() {
    this.geocoder._next = function() {this.nextCalled = true} ;
    this.geocoder._finished = function() {this.finishCalled = true};

    this.server.respondWith("POST", this.table.data().sqlApiUrl(),
      [200, { "Content-Type": "application/json" },
      '{"time":0.0028295516967773438,"total_rows":1,"rows":[{"cartodb_id":6,"name":null,"description":null,"created_at":"2012-11-19T18:38:51+01:00","updated_at":"2012-11-19T18:38:51+01:00","the_geom":null,"the_geom_webmercator":null,"cartodb_georef_status":null}],"results":true,"modified":false}']);

    // this.server.respondWith('/api/v1/queries/?sql=SELECT%20*%20FROM%20test%20WHERE%20(cartodb_georef_status%20IS%20%20NULL%20OR%20cartodb_georef_status%20IS%20FALSE)%20AND%20cartodb_id%20%3E%200%20ORDER%20BY%20cartodb_georef_status%20ASC%20LIMIT%20100%20',
    //   TestUtil.response('{"time":0.0028295516967773438,"total_rows":1,"rows":[{"cartodb_id":6,"name":null,"description":null,"created_at":"2012-11-19T18:38:51+01:00","updated_at":"2012-11-19T18:38:51+01:00","the_geom":null,"the_geom_webmercator":null,"cartodb_georef_status":null}],"results":true,"modified":false}'));
    
    this.geocoder._feedQueue();
    this.server.respond();

    expect(this.geocoder.queue.length).toEqual(1);
    expect(this.geocoder.nextCalled).toBeTruthy();
  })

  it("should finish if the feedQueue doesn't returns any row", function() {
    this.geocoder._next = function() {this.nextCalled = true} ;
    this.geocoder.bind('finished', function() {this.finishCalled = true});
    
    this.server.respondWith("POST", this.table.data().sqlApiUrl(),
      [200, { "Content-Type": "application/json" },
      '{"time":0.0028295516967773438,"total_rows":0,"rows":[],"results":true,"modified":false}']);

    // this.server.respondWith('/api/v1/queries/?sql=SELECT%20*%20FROM%20test%20WHERE%20(cartodb_georef_status%20IS%20%20NULL%20OR%20cartodb_georef_status%20IS%20FALSE)%20AND%20cartodb_id%20%3E%200%20ORDER%20BY%20cartodb_georef_status%20ASC%20LIMIT%20100%20',
    //   TestUtil.response('{"time":0.0028295516967773438,"total_rows":0,"rows":[],"results":true,"modified":false}'));
    this.geocoder._feedQueue();
    this.server.respond();
    expect(this.geocoder.finishCalled).toBeTruthy();
    expect(this.geocoder.nextCalled).toBeFalsy();
  })

  it("should feed the queue again if there not more rows to proccess, updating the lastCartoDbId on the request", function() {
    this.geocoder.geocodeRow = function() {return true} ;
    this.geocoder.bind('finished', function() {this.finishCalled = true});
    this.server = sinon.fakeServer.create();

    // this.server.respondWith('/api/v1/queries/?sql=SELECT%20*%20FROM%20test%20WHERE%20(cartodb_georef_status%20IS%20%20NULL%20OR%20cartodb_georef_status%20IS%20FALSE)%20AND%20cartodb_id%20%3E%200%20ORDER%20BY%20cartodb_georef_status%20ASC%20LIMIT%20100%20',
    //   TestUtil.response('{"time":0.0028295516967773438,"total_rows":2,"rows":[{"cartodb_id":6}, {"cartodb_id":7}],"results":true,"modified":false}'));
    // this.server.respondWith('/api/v1/queries/?sql=SELECT%20*%20FROM%20test%20WHERE%20(cartodb_georef_status%20IS%20%20NULL%20OR%20cartodb_georef_status%20IS%20FALSE)%20AND%20cartodb_id%20%3E%207%20ORDER%20BY%20cartodb_georef_status%20ASC%20LIMIT%20100%20',
    //   TestUtil.response('{"time":0.0028295516967773438,"total_rows":0,"rows":[],"results":true,"modified":false}'));

    this.server.respondWith("POST", this.table.data().sqlApiUrl(),
      [200, { "Content-Type": "application/json" },
      '{"time":0.0028295516967773438,"total_rows":0,"rows":[],"results":true,"modified":false}']);

    this.geocoder._feedQueue();
    this.server.respond();
    
    expect(this.geocoder.finishCalled).toBeTruthy();
  })

  it("should remove #s from addresses to prevent encoder to crash", function() {
    TestUtil.feedTable(this.table, 1);
    this.table.data().models[0].set('test2', 'street #1');
    this.geocoder.address = "{test2}";

    var address = this.geocoder.getRowAddress(this.table.data().models[0].toJSON())
    expect(address).toEqual('street 1')
  });

});

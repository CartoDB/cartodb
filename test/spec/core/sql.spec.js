describe("core.sql", function() {

  beforeEach(function() {
    this.sqlApi = new cdb.core.SqlApi({
      key: "irrelevant",
      url: "irrelevant.com"
    })


    this.server = sinon.fakeServer.create();
    this.server.respondWith("GET",
      "irrelevant.com?api_key=irrelevant",
      [
        200,
        { "Content-Type": "application/json" },
        '{"success": true}'
      ]
    );


  });

  afterEach(function() {
    this.server.restore();
  })
  it("should initialize the object", function() {
    expect(this.sqlApi.get('key')).toEqual('irrelevant');
    expect(this.sqlApi.get('url')).toEqual('irrelevant.com');
  });

  it("should crash if options not provided", function() {
    var hasCrashed = false;
    try {
      var sqlApi = new cdb.core.SqlApi();
    } catch(err) {
      hasCrashed = true;
    }
    expect(hasCrashed).toBeTruthy();
  });

  it("should de able to send the info to server and fetch", function() {
    this.sqlApi.fetch();
    this.server.respond();
    expect(this.server.request).toEqual(1);
  })


});

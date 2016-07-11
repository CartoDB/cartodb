describe("Authenticated user", function() {
  beforeEach(function() {
    this.model = new cdb.open.AuthenticatedUser({});
  });

  it("should return the normal URL", function() {
    var s = sinon.stub(this.model, '_getCurrentHost');
    s.returns("test.carto.com");

    expect(this.model.url()).toBe('//test.carto.com/api/v1/get_authenticated_users');
  });

  it("should return the a URL with a custom host", function() {
    var s = sinon.stub(cdb.open.AuthenticatedUser.prototype, '_getCurrentHost');
    s.returns("test.carto.com");
    var model = new cdb.open.AuthenticatedUser({ host: "hello.carto.com" });
    expect(model.url()).toBe('//hello.carto.com/api/v1/get_authenticated_users');
  });
});

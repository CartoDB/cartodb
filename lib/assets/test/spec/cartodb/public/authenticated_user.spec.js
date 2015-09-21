describe("Authenticated user", function() {
  beforeEach(function() {
    this.model = new cdb.open.AuthenticatedUser({});
  });

  it("should return the normal URL", function() {
    var s = sinon.stub(this.model, '_getCurrentHost');
    s.returns("test.cartodb.com");

    expect(this.model.url()).toBe('//test.cartodb.com/api/v1/get_authenticated_users');
  });

  it("should return the a URL with a custom host", function() {
    var s = sinon.stub(this.model, '_getCurrentHost');
    s.returns("test.cartodb.com");
    expect(this.model.url( { host: "hello.cartodb.com" })).toBe('//hello.cartodb.com/api/v1/get_authenticated_users');
  });
});

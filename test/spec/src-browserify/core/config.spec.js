
describe("config", function() {
  it("should contain links variables", function() {
    expect(cdb.config.get('cartodb_attributions')).toEqual("CartoDB <a href='http://cartodb.com/attributions' target='_blank'>attribution</a>");
    expect(cdb.config.get('cartodb_logo_link')).toEqual("http://www.cartodb.com");
  });
});

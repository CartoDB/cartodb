
describe("config", function() {
  it("should contain links variables", function() {
    expect(cdb.config.get('cartodb_attributions')).toEqual("© <a href=\"https://carto.com/attributions\" target=\"_blank\">CARTO</a>");
    expect(cdb.config.get('cartodb_logo_link')).toEqual("http://www.carto.com");
  });
});

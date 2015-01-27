describe("Image", function() {

  it("should allow to set the size", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson).size(500, 500);

    image.getUrl(function() {
      var size = image.model.get("size");
      expect(size[0]).toEqual(500);
      expect(size[1]).toEqual(500);
      done();
    });

  });

  it("should allow to set the zoom", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson).zoom(4);

    image.getUrl(function() {
      expect(image.model.get("zoom")).toEqual(4);
      done();
    });

  });

});

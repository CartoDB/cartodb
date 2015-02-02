describe("Image", function() {

  beforeEach(function() {
    var img = $('<img id="image" />');
    $("body").append(img);
  });

  afterEach(function() {
    $("#image").remove();
  });

  it("should allow to set the size", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson).size(640, 480);

    image.getUrl(function() {
      expect(image.model.get("size")).toEqual([640, 480]);
      done();
    });

  });

  it("should have a default basemap", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson).size(640, 480);

    image.getUrl(function() {
      expect(image.model.get("basemap")).toEqual("light_nolabels");
      done();
    });

  });

  it("should allow to set the basemap", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson, { basemap: "my_fantastic_basemap"}).size(640, 480);

    image.getUrl(function() {
      expect(image.model.get("basemap")).toEqual("my_fantastic_basemap");
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

  it("should allow to set the center", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson).center([40, 30]);

    image.getUrl(function() {
      expect(image.model.get("center")).toEqual([40, 30]);
      done();
    });

  });

  it("should allow to set the bounding box", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var regexp = new RegExp("http://documentation\.cartodb\.com/api/v1/map/static/bbox/(.*?)/-31\.05,-155\.74,82\.58,261\.21/400/300\.png");

    cartodb.Image(vizjson).bbox([[-31.05, -155.74], [82.58, 261.21]]).size(400,300).getUrl(function(error, url) {
      expect(error).toEqual(null);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("should allow to set the format", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson).format("jpg");

    image.getUrl(function() {
      expect(image.model.get("format")).toEqual("jpg");
      done();
    });

  });

  it("shouldn't allow to set an invalid format", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson).format("pin");

    image.getUrl(function() {
      expect(image.model.get("format")).toEqual("png");
      done();
    });

  });

  it("should generate the image URL", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var regexp = new RegExp("http://documentation\.cartodb\.com/api/v1/map/static/center/(.*?)/2/52\.5897007687178/52\.734375/320/240\.png");

    cartodb.Image(vizjson).getUrl(function(error, url) {
      expect(error).toEqual(null);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("should generate the image URL using custom params", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var regexp = new RegExp("http://documentation\.cartodb\.com/api/v1/map/static/center/(.*?)/7/40/10/400/300\.png");

    cartodb.Image(vizjson).center([40, 10]).zoom(7).size(400, 300).getUrl(function(error, url) {
      expect(error).toEqual(null);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("should generate the image inside of an image element", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var img = document.getElementById('image');

    cartodb.Image(vizjson).center([40, 10]).zoom(7).size(400, 300).into(img);

    var regexp = new RegExp("http://documentation\.cartodb\.com/api/v1/map/static/center/(.*?)/7/40/10/400/300\.png");

    setTimeout(function() {
      expect($("#image").attr("src")).toMatch(regexp);
      done();
    }, 800);

  });

});

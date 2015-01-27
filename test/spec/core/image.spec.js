describe("Image", function() {

  beforeEach(function() {
    $("body").append("<img id='image' />")
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

    cartodb.Image(vizjson).bbox([[ -31.05293398570514, -155.7421875 ], [ 82.58610635020881, 261.2109375 ]]).size(400,300).getUrl(function(error, url) {
      expect(error).toEqual(null);
      expect(url).toEqual("http://documentation.cartodb.com/api/v1/map/static/bbox/f70411bd51cf8c67892fafc7e0178cfc:0/-31.05293398570514/-155.7421875/82.58610635020881/261.2109375/400/300.png");
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

    cartodb.Image(vizjson).getUrl(function(error, url) {
      expect(error).toEqual(null);
      expect(url).toEqual("http://documentation.cartodb.com/api/v1/map/static/center/f70411bd51cf8c67892fafc7e0178cfc:0/2/52.5897007687178/52.734375/320/240.png");
      done();
    });

  });

  it("should generate the image URL using custom params", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    cartodb.Image(vizjson).center([40, 10]).zoom(7).size(400, 300).getUrl(function(error, url) {
      expect(error).toEqual(null);
      expect(url).toEqual("http://documentation.cartodb.com/api/v1/map/static/center/f70411bd51cf8c67892fafc7e0178cfc:0/7/40/10/400/300.png");
      done();
    });

  });

  it("should generate the image inside of an image element", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var img = document.getElementById('image');
    cartodb.Image(vizjson).center([40, 10]).zoom(7).size(400, 300).into(img);

    setTimeout(function() {
      expect($("#image").attr("src")).toEqual("http://documentation.cartodb.com/api/v1/map/static/center/f70411bd51cf8c67892fafc7e0178cfc:0/7/40/10/400/300.png");
      done();
    }, 800);

  });

});

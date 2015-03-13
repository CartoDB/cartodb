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
      expect(image.imageOptions["size"]).toEqual([640, 480]);
      done();
    });

  });

  it("should use the basemap defined in the vizjson", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/318ab654-c989-11e4-97c6-0e9d821ea90d/viz.json"

    var image = cartodb.Image(vizjson).size(640, 480);

    var basemap = { options: { visible: true, type: 'Tiled', urlTemplate: 'https://{s}.maps.nlp.nokia.com/maptile/2.1/maptile/newest/normal.day/{z}/{x}/{y}/256/png8?lg=eng&token=A7tBPacePg9Mj_zghvKt9Q&app_id=KuYppsdXZznpffJsKT24', subdomains: '1234', name: 'Nokia Day', className: 'nokia_day', attribution: "©2012 Nokia <a href='http://here.net/services/terms' target='_blank'>Terms of use</a>" }, infowindow: null, tooltip: null, id: '2c4a8c5e-2ba5-4068-8807-d916a01b48d5', order: 0, parent_id: null, children: [  ], type: 'tiled' }

    image.getUrl(function() {
      expect(image.imageOptions.basemap).toEqual(basemap);
      done();
    });

  });

  it("should generate the URL for a torque layer", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/3ec995a8-b6ae-11e4-849e-0e4fddd5de28/viz.json"

    var image = cartodb.Image(vizjson);

    var regexp = new RegExp("http://a.ashbu.cartocdn.com/documentation/api/v1/map/static/bbox/(.*?)/-138\.6474609375,27\.761329874505233,-83\.408203125,51\.26191485308451/320/240\.pn");

    image.getUrl(function(err, url) {
      expect(image.options.layers.layers.length).toEqual(2);
      expect(image.options.layers.layers[0].type).toEqual("http");
      expect(image.options.layers.layers[1].type).toEqual("torque");
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("should generate the right layer configuration for a torque layer and a named map", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/e7b04b62-b901-11e4-b0d7-0e018d66dc29/viz.json";

    var image = cartodb.Image(vizjson);

    image.getUrl(function(err, url) {
      expect(image.options.layers.layers.length).toEqual(2);
      expect(image.options.layers.layers[0].type).toEqual("http");
      expect(image.options.layers.layers[1].type).toEqual("named");
      done();
    });

  });

  it("should generate the right layer configuration for a torque layer with a named map inside", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/6b447f26-c80b-11e4-8164-0e018d66dc29/viz.json";

    var image = cartodb.Image(vizjson);

    image.getUrl(function(err, url) {
      expect(image.options.layers.layers.length).toEqual(2);
      expect(image.options.layers.layers[0].type).toEqual("http");
      expect(image.options.layers.layers[1].type).toEqual("named");
      done();
    });

  });

  it("shouldn't use hidden layers to generate the image", function(done) { 

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/42e98b9a-bcce-11e4-9d68-0e9d821ea90d/viz.json";

    var image = cartodb.Image(vizjson);

    image.getUrl(function(err, url) {
      expect(image.options.layers.layers.length).toEqual(2);
      done();
    });

  });

  it("should extract the cdn_url from the vizjson", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/e7b04b62-b901-11e4-b0d7-0e018d66dc29/viz.json";

    var image = cartodb.Image(vizjson);

    image.getUrl(function(err, url) {
      expect(image.options.cdn_url.http).toEqual("ashbu.cartocdn.com");
      expect(image.options.cdn_url.https).toEqual("cartocdn-ashbu.global.ssl.fastly.net");
      done();
    });

  });

  it("should allow to set the zoom", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson).zoom(4);

    image.getUrl(function() {
      expect(image.imageOptions["zoom"]).toEqual(4);
      done();
    });

  });

  it("should allow to set the center", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson).center([40, 30]);

    image.getUrl(function() {
      expect(image.imageOptions["center"]).toEqual([40, 30]);
      done();
    });

  });

  it("should allow to set the bounding box", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var regexp = new RegExp("http://a.ashbu.cartocdn.com/documentation/api/v1/map/static/bbox/(.*?)/-31\.05,-155\.74,82\.58,261\.21/400/300\.png");

    cartodb.Image(vizjson).bbox([-31.05, -155.74, 82.58, 261.21]).size(400,300).getUrl(function(error, url) {
      expect(error).toEqual(null);
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("should allow to override the bounding box", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var regexp = new RegExp("http://a.ashbu.cartocdn.com/documentation/api/v1/map/static/center/(.*?)/52\.5897007687178/52\.734375/400/300\.png");

    cartodb.Image(vizjson, { override_bbox: true }).size(400,300).getUrl(function(error, url) {
      expect(error).toEqual(null);
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("shouldn't generate a bbox URL without a bouding box", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var regexp = new RegExp("http://a.ashbu.cartocdn.com/documentation/api/v1/map/static/center/(.*?)/52\.5897007687178/52\.734375/400/300\.png");

    cartodb.Image(vizjson).bbox([]).size(400,300).getUrl(function(error, url) {
      expect(error).toEqual(null);
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("should use the zoom defined in the vizjson", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson);

    var regexp = new RegExp("http://a.ashbu.cartocdn.com/documentation/api/v1/map/static/center/(.*?)/2/40/10/320/240\.png");

    image.center([40,10]).getUrl(function(err, url) {
      expect(image.imageOptions.zoom).toEqual(2);
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("should allow to set the format", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson).format("jpg");

    image.getUrl(function() {
      expect(image.imageOptions["format"]).toEqual("jpg");
      done();
    });

  });

  it("shouldn't allow to set an invalid format", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson).format("pin");

    image.getUrl(function() {
      expect(image.imageOptions["format"]).toEqual("png");
      done();
    });

  });

  it("should generate the image URL", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var regexp = new RegExp("http://a.ashbu.cartocdn.com/documentation/api/v1/map/static/bbox/(.*?)320/240\.png");

    cartodb.Image(vizjson).getUrl(function(error, url) {
      expect(error).toEqual(null);
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("should generate the image URL using custom params", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var regexp = new RegExp("http://a.ashbu.cartocdn.com/documentation/api/v1/map/static/center/(.*?)/7/40/10/400/300\.png");

    cartodb.Image(vizjson).center([40, 10]).zoom(7).size(400, 300).getUrl(function(error, url) {
      expect(error).toEqual(null);
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("should generate the image inside of an image element", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var img = document.getElementById('image');

    cartodb.Image(vizjson).center([40, 10]).zoom(7).size(400, 300).into(img);

    var regexp = new RegExp("http://a.ashbu.cartocdn.com/documentation/api/v1/map/static/center/(.*?)/7/40/10/400/300\.png");

    setTimeout(function() {
      expect($("#image").attr("src")).toMatch(regexp);
      done();
    }, 800);

  });

  it("should generate an image using a layer definition", function(done) {

    var layer_definition = {
      user_name: "documentation",
      tiler_domain: "cartodb.com",
      tiler_port: "80",
      tiler_protocol: "http",
      layers: [{
        type: "http",
        options: {
          urlTemplate: "http://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png",
          subdomains: [ "a", "b", "c" ]
        }
      }, {
        type: "cartodb",
        options: {
          sql: "SELECT * FROM nyc_wifi",
          cartocss: "#ncy_wifi{ marker-fill-opacity: 0.8; marker-line-color: #FFFFFF; marker-line-width: 3; marker-line-opacity: .8; marker-placement: point; marker-type: ellipse; marker-width: 16; marker-fill: #6ac41c; marker-allow-overlap: true; }",
          cartocss_version: "2.1.1"
        }
      }]
    };

    var regexp = new RegExp("http://a.ashbu.cartocdn.com/documentation/api/v1/map/static/center/(.*?)/2/0/0/250/250\.png");

    cartodb.Image(layer_definition).size(250, 250).zoom(2).getUrl(function(error, url) {
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("should generate an image using a layer definition for a plain color", function(done) {

    var layer_definition = {
      user_name: "documentation",
      tiler_domain: "cartodb.com",
      tiler_port: "80",
      tiler_protocol: "http",
      layers: [{
        type: "plain",
        options: {
          color: "lightblue"
        }
      }, {
        type: "cartodb",
        options: {
          sql: "SELECT * FROM nyc_wifi",
          cartocss: "#ncy_wifi{ marker-fill-opacity: 0.8; marker-line-color: #FFFFFF; marker-line-width: 3; marker-line-opacity: .8; marker-placement: point; marker-type: ellipse; marker-width: 16; marker-fill: #6ac41c; marker-allow-overlap: true; }",
          cartocss_version: "2.1.1"
        }
      }]
    };

    var regexp = new RegExp("http://a.ashbu.cartocdn.com/documentation/api/v1/map/static/center/(.*?)/2/0/0/250/250\.png");

    cartodb.Image(layer_definition).size(250, 250).zoom(2).getUrl(function(error, url) {
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("should set the protocol and port depending on the URL (https)", function(done) {

    var vizjson = "https://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson).size(400, 300);

    var regexp = new RegExp("https://cartocdn-ashbu.global.ssl.fastly.net/documentation/api/v1/map/static/bbox/(.*?)400/300\.png");

    image.getUrl(function(err, url) {
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("should set the protocol and port depending on the URL (http)", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson).size(400, 300);

    var regexp = new RegExp("http://a.ashbu.cartocdn.com/documentation/api/v1/map/static/bbox/(.*?)400/300\.png");

    image.getUrl(function(err, url) {
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("should set force the https protocol", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson, { https: true }).size(400, 300);

    var regexp = new RegExp("https://cartocdn-ashbu.global.ssl.fastly.net/documentation/api/v1/map/static/bbox/(.*?)400/300\.png");

    image.getUrl(function(err, url) {
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("should set force the https protocol (no_cdn)", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson, { https: true, no_cdn: true }).size(400, 300);

    var regexp = new RegExp("https://documentation.cartodb.com:443/api/v1/map/static/bbox/(.*?)400/300\.png");

    image.getUrl(function(err, url) {
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("should set the protocol and port depending on the URL (http, no_cdn)", function(done) {

    var vizjson = "http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson, { no_cdn: true }).size(400, 300);

    var regexp = new RegExp("http://documentation.cartodb.com:80/api/v1/map/static/bbox/(.*?)400/300\.png");

    image.getUrl(function(err, url) {
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("shouldn't send the urlTemplate if the vizjson doesn't contain it", function(done) {

    var vizjson = "https://documentation.cartodb.com/api/v2/viz/75b90cd6-e9cf-11e2-8be0-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson).size(400, 300);

    image.getUrl(function(err, url) {
      expect(image.options.layers.layers.length).toEqual(1);
      expect(image.options.layers.layers[0].type).toEqual("cartodb");
      done();
    });

  });

});

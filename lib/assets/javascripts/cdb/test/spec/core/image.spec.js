describe("Image", function() {
  beforeEach(function() {
    var img = $('<img id="image" />');
    $("body").append(img);
  });

  afterEach(function() {
    $("#image").remove();
  });

  it("should allow to set the size", function(done) {

    var vizjson = "http://documentation.carto.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson).size(640, 480);

    image.getUrl(function() {
      expect(image.imageOptions["size"]).toEqual([640, 480]);
      done();
    });
  });

  it("should use the basemap defined in the vizjson", function(done) {
    var vizjson = "http://documentation.carto.com/api/v2/viz/318ab654-c989-11e4-97c6-0e9d821ea90d/viz.json"
    var image = cartodb.Image(vizjson).size(640, 480);
    var basemapURLTemplate = 'https://{s}.base.maps.api.here.com/maptile/2.1/maptile/newest/normal.day/{z}/{x}/{y}/256/png8?lg=eng&token=A7tBPacePg9Mj_zghvKt9Q&app_id=KuYppsdXZznpffJsKT24';
    image.getUrl(function() {
      expect(image.imageOptions.basemap.options.urlTemplate).toEqual(basemapURLTemplate);
      done();
    });

  });

  it("should generate the URL for a torque layer", function(done) {

    var vizjson = "http://documentation.carto.com/api/v2/viz/3ec995a8-b6ae-11e4-849e-0e4fddd5de28/viz.json"

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

  it("should generate the right layer configuration for map with a layer of labels", function(done) {
    var oldLoaderGet = cdb.core.Loader.get;

    var vizjson = {
      layers: [
        {
          type: 'tiled',
          options: {
            urlTemplate: 'urlTemplate'
          },
          visible: true
        },
        {
          type: 'tiled',
          options: {
            urlTemplate: 'urlTemplateLabels'
          },
          visible: true
        },
        {
          type: 'layergroup',
          options: {
            layer_definition: {
              layers: [{
                options: {},
                visible: true
              }]
            }
          }
        }
      ],
      center: "[52.5897007687178, 52.734375]",
      zoom: 2
    }
    cdb.core.Loader.get = function(a, callback) {
      callback(vizjson);
    }

    var image = cartodb.Image("wadus.json");

    image.getUrl(function(err, url) {
      expect(image.options.layers.layers.length).toEqual(3);
      expect(image.options.layers.layers[0].type).toEqual("http");
      expect(image.options.layers.layers[0].options.urlTemplate).toEqual("urlTemplate");
      expect(image.options.layers.layers[1].type).toEqual("cartodb");
      expect(image.options.layers.layers[2].type).toEqual("http");
      expect(image.options.layers.layers[2].options.urlTemplate).toEqual("urlTemplateLabels");
      done();
    });

    cdb.core.Loader.get = oldLoaderGet;
  });

  it("should generate the right layer configuration for a torque layer and a named map", function(done) {

    var vizjson = "http://documentation.carto.com/api/v2/viz/e7b04b62-b901-11e4-b0d7-0e018d66dc29/viz.json";

    var image = cartodb.Image(vizjson);

    image.getUrl(function(err, url) {
      expect(image.options.layers.layers.length).toEqual(2);
      expect(image.options.layers.layers[0].type).toEqual("http");
      expect(image.options.layers.layers[1].type).toEqual("named");
      done();
    });

  });

  it("should generate the right layer configuration for a torque layer with a named map inside", function(done) {

    var vizjson = "http://documentation.carto.com/api/v2/viz/6b447f26-c80b-11e4-8164-0e018d66dc29/viz.json";

    var image = cartodb.Image(vizjson);

    image.getUrl(function(err, url) {
      expect(image.options.layers.layers.length).toEqual(2);
      expect(image.options.layers.layers[0].type).toEqual("http");
      expect(image.options.layers.layers[1].type).toEqual("named");
      done();
    });

  });

  it("should allow to use a step for a torque layer", function(done) {

    var vizjson = "http://documentation.carto.com/api/v2/viz/3ec995a8-b6ae-11e4-849e-0e4fddd5de28/viz.json"

    var image = cartodb.Image(vizjson, { step: 10 });

    var regexp = new RegExp("http://a.ashbu.cartocdn.com/documentation/api/v1/map/static/bbox/(.*?)/-138\.6474609375,27\.761329874505233,-83\.408203125,51\.26191485308451/320/240\.pn");

    image.getUrl(function(err, url) {
      expect(image.options.userOptions.step).toEqual(10);
      expect(image.options.layers.layers[1].options.step).toEqual(10);
      done();
    });

  });

  it("shouldn't use hidden layers to generate the image", function(done) {

    var vizjson = "http://documentation.carto.com/api/v2/viz/42e98b9a-bcce-11e4-9d68-0e9d821ea90d/viz.json";

    var image = cartodb.Image(vizjson);

    image.getUrl(function(err, url) {
      expect(image.options.layers.layers.length).toEqual(2);
      done();
    });

  });

  it("should extract the cdn_url from the vizjson", function(done) {

    var vizjson = "http://documentation.carto.com/api/v2/viz/e7b04b62-b901-11e4-b0d7-0e018d66dc29/viz.json";

    var image = cartodb.Image(vizjson);

    image.getUrl(function(err, url) {
      expect(image.options.cdn_url.http).toEqual("ashbu.cartocdn.com");
      expect(image.options.cdn_url.https).toEqual("cartocdn-ashbu.global.ssl.fastly.net");
      done();
    });

  });

  it("should allow to set the zoom", function(done) {

    var vizjson = "http://documentation.carto.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson).zoom(4);

    image.getUrl(function() {
      expect(image.imageOptions["zoom"]).toEqual(4);
      done();
    });

  });

  it("should allow to set the center", function(done) {

    var vizjson = "http://documentation.carto.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson).center([40, 30]);

    image.getUrl(function() {
      expect(image.imageOptions["center"]).toEqual([40, 30]);
      done();
    });

  });

  it("should allow to set the bounding box", function(done) {

    var vizjson = "http://documentation.carto.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var regexp = new RegExp("http://a.ashbu.cartocdn.com/documentation/api/v1/map/static/bbox/(.*?)/-31\.05,-155\.74,82\.58,261\.21/400/300\.png");

    cartodb.Image(vizjson).bbox([-31.05, -155.74, 82.58, 261.21]).size(400,300).getUrl(function(error, url) {
      expect(error).toEqual(null);
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("should allow to override the bounding box", function(done) {

    var vizjson = "http://documentation.carto.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var regexp = new RegExp("http://a.ashbu.cartocdn.com/documentation/api/v1/map/static/center/(.*?)/52\.5897007687178/52\.734375/400/300\.png");

    cartodb.Image(vizjson, { override_bbox: true }).size(400,300).getUrl(function(error, url) {
      expect(error).toEqual(null);
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("shouldn't generate a bbox URL without a bouding box", function(done) {

    var vizjson = "http://documentation.carto.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var regexp = new RegExp("http://a.ashbu.cartocdn.com/documentation/api/v1/map/static/center/(.*?)/52\.5897007687178/52\.734375/400/300\.png");

    cartodb.Image(vizjson).bbox([]).size(400,300).getUrl(function(error, url) {
      expect(error).toEqual(null);
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("should use the zoom defined in the vizjson", function(done) {

    var vizjson = "http://documentation.carto.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

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

    var vizjson = "http://documentation.carto.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson).format("jpg");

    image.getUrl(function() {
      expect(image.imageOptions["format"]).toEqual("jpg");
      done();
    });

  });

  it("shouldn't allow to set an invalid format", function(done) {

    var vizjson = "http://documentation.carto.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson).format("pin");

    image.getUrl(function() {
      expect(image.imageOptions["format"]).toEqual("png");
      done();
    });

  });

  it("should generate the image URL", function(done) {

    var vizjson = "http://documentation.carto.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var regexp = new RegExp("http://a.ashbu.cartocdn.com/documentation/api/v1/map/static/bbox/(.*?)320/240\.png");

    cartodb.Image(vizjson).getUrl(function(error, url) {
      expect(error).toEqual(null);
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("should generate the image URL using custom params", function(done) {

    var vizjson = "http://documentation.carto.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var regexp = new RegExp("http://a.ashbu.cartocdn.com/documentation/api/v1/map/static/center/(.*?)/7/40/10/400/300\.png");

    cartodb.Image(vizjson).center([40, 10]).zoom(7).size(400, 300).getUrl(function(error, url) {
      expect(error).toEqual(null);
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("should generate the image inside of an image element", function(done) {

    var vizjson = "http://documentation.carto.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

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
      tiler_domain: "carto.com",
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

  it("should use maps_api_template when provided", function() {
    var layer_definition = {
      user_name: "documentation",
      maps_api_template: 'https://carto.com/user/{user}/api/v1/maps',
      tiler_domain: "carto.com",
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

    expect(cartodb.Image(layer_definition)._tilerHost()).toEqual(
      'https://carto.com/user/documentation/api/v1/maps'
    );
  });

  it("should generate an image using a layer definition for a plain color", function(done) {

    var layer_definition = {
      user_name: "documentation",
      tiler_domain: "carto.com",
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

    var vizjson = "https://documentation.carto.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson).size(400, 300);

    var regexp = new RegExp("https://cartocdn-ashbu.global.ssl.fastly.net/documentation/api/v1/map/static/bbox/(.*?)400/300\.png");

    image.getUrl(function(err, url) {
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("should set the protocol and port depending on the URL (http)", function(done) {

    var vizjson = "http://documentation.carto.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson).size(400, 300);

    var regexp = new RegExp("http://a.ashbu.cartocdn.com/documentation/api/v1/map/static/bbox/(.*?)400/300\.png");

    image.getUrl(function(err, url) {
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("should set the protocol and port depending on the URL (http, no_cdn)", function(done) {

    var vizjson = "http://documentation.carto.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson, { no_cdn: true }).size(400, 300);

    var regexp = new RegExp("http://documentation.carto.com:80/api/v1/map/static/bbox/(.*?)400/300\.png");

    image.getUrl(function(err, url) {
      expect(url.match(regexp).length).toEqual(2);
      expect(url).toMatch(regexp);
      done();
    });

  });

  it("shouldn't send the urlTemplate if the vizjson doesn't contain it", function(done) {

    var vizjson = "https://documentation.carto.com/api/v2/viz/75b90cd6-e9cf-11e2-8be0-5404a6a683d5/viz.json"

    var image = cartodb.Image(vizjson).size(400, 300);

    image.getUrl(function(err, url) {
      expect(image.options.layers.layers.length).toEqual(1);
      expect(image.options.layers.layers[0].type).toEqual("cartodb");
      done();
    });

  });

  it("should send the auth_tokens", function(done) {

    var vizjson = "http://documentation.carto.com/api/v2/viz/e11db0aa-d77e-11e4-9039-0e853d047bba/viz.json"
    var json = {"id":"e11db0aa-d77e-11e4-9039-0e853d047bba","version":"0.1.0","title":"password_protected_map","likes":0,"description":null,"scrollwheel":false,"legends":true,"url":null,"map_provider":"leaflet","bounds":[[0.0,0.0],[0.0,0.0]],"center":"[30, 0]","zoom":3,"updated_at":"2015-03-31T08:21:18+00:00","layers":[{"options":{"visible":true,"type":"Tiled","urlTemplate":"http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png","subdomains":"1234","name":"Positron","className":"positron_rainbow","attribution":"\u00a9 <a href=\"http://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors \u00a9 <a href=\"https://carto.com/attributions\">CartoDB</a>"},"infowindow":null,"tooltip":null,"id":"c850d654-ab61-441d-9860-b3c2e42424fb","order":0,"parent_id":null,"children":[],"type":"tiled"},{"type":"namedmap","order":1,"options":{"type":"namedmap","user_name":"documentation","tiler_protocol":"https","tiler_domain":"carto.com","tiler_port":"443","cdn_url":{"http":"api.cartocdn.com","https":"cartocdn.global.ssl.fastly.net"},"dynamic_cdn":false,"named_map":{"name":"tpl_e11db0aa_d77e_11e4_9039_0e853d047bba","stat_tag":"e11db0aa-d77e-11e4-9039-0e853d047bba","params":{"layer0":1},"layers":[{"layer_name":"untitled_table_5","interactivity":"cartodb_id","visible":true}]}}}],"overlays":[{"type":"logo","order":9,"options":{"display":true,"x":10,"y":40},"template":""},{"type":"loader","order":8,"options":{"display":true,"x":20,"y":150},"template":"<div class=\"loader\" original-title=\"\"></div>"},{"type":"zoom","order":6,"options":{"display":true,"x":20,"y":20},"template":"<a href=\"#zoom_in\" class=\"zoom_in\">+</a> <a href=\"#zoom_out\" class=\"zoom_out\">-</a>"},{"type":"search","order":3,"options":{"display":true,"x":60,"y":20},"template":""},{"type":"share","order":2,"options":{"display":true,"x":20,"y":20},"template":""}],"prev":null,"next":null,"transition_options":{"time":0}};

    StaticImage.prototype.load = function(vizjson, options) {

      this.queue = new Queue;

      this.no_cdn = options.no_cdn;

      this.auth_tokens = options.auth_tokens;

      this.userOptions = options;

      options = _.defaults({ vizjson: vizjson, temp_id: "s" + this._getUUID() }, this.defaults);

      this.imageOptions = options;

      this._onVisLoaded(json); // do the callback

    };

    var options = { auth_tokens: ["e900fe76cc3c1eed4fc018d027d82c8b0e59b2c484d1941954f34b4818a5d660"] };
    var image = cartodb.Image(vizjson, options).size(400, 300);

    image.getUrl(function(err, url) {
      expect(image.options.layers.layers[1].options.auth_tokens.length > 0).toBe(true);
      expect(image.options.layers.layers[1].options.auth_tokens[0]).toBe("e900fe76cc3c1eed4fc018d027d82c8b0e59b2c484d1941954f34b4818a5d660");
      done();
    });
  });

  it("should generate an image using a layer definition in a certain bbox", function(done) {
    jasmine.clock().install();
    var ajax = $.ajax;
    spyOn($, 'ajax');

    var fakeServerResponse = {
      'layergroupid': '5e59b997e678d51096c9037faf9a84b7:1398886221740',
      'metadata': {
        'layers': [
          {
            'type': 'plain',
            'id': 'plain-layer0',
            'meta': {
              'stats': []
            }
          },
          {
            'type': 'mapnik',
            'id': 'layer0',
            'meta': {
              'stats': [],
              'cartocss': '#ncy_wifi{ marker-fill-opacity: 0.8; marker-line-color: #FFFFFF; marker-line-width: 3; marker-line-opacity: .8; marker-placement: point; marker-type: ellipse; marker-width: 16; marker-fill: #6ac41c; marker-allow-overlap: true; }'
            }
          }
        ],
        'dataviews': {},
        'analyses': []
      },
      'cdn_url': {
        'http': 'ashbu.cartocdn.com',
        'https': 'cartocdn-ashbu.global.ssl.fastly.net'
      },
      'last_updated': '2014-04-30T19:30:21.740Z'
    };

    var layer_definition = {
      user_name: "documentation",
      tiler_domain: "carto.com",
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

    cartodb.Image(layer_definition).size(250, 250).bbox([[-87.82814025878906,41.88719899247721], [ -27.5936508178711,41.942765696654604]]).getUrl(function (error, url) {
      expect(url).toEqual('http://a.ashbu.cartocdn.com/documentation/api/v1/map/static/bbox/5e59b997e678d51096c9037faf9a84b7:1398886221740/-87.82814025878906,41.88719899247721,-27.5936508178711,41.942765696654604/250/250.png');
      done();
    });

    // Wait for a timeout
    jasmine.clock().tick(101);

    $.ajax.calls.argsFor(0)[0].success(fakeServerResponse);
    jasmine.clock().uninstall();
    $.ajax = ajax;
  });
});

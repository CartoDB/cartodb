describe("cdb.geo.ui.Mobile", function() {

  var mobile;

  beforeEach(function() {

    var map = new cdb.geo.Map();
    var map2 = new cdb.geo.Map();

    // Layers
    var l1 = new cdb.geo.CartoDBLayer({ type: "Tiled", visible: true, urlTemplate: "https://maps.nlp.nokia.com/maptiler/v2/maptile/newest/normal.day/{z}/{x}/{y}/256/png8?lg=eng&token=61YWYROufLu_f8ylE0vn0Q&app_id=qIWDkliFCtLntLma2e6O", name: "Nokia Day", className: "nokia_day", attribution: "©2012 Nokia <a href='http://here.net/services/terms' target='_blank'>Terms of use</a>", kind: "tiled", infowindow: null, id: 1226, order: 0 });
    var l2 = new cdb.geo.CartoDBLayer({ type: "CartoDB", attribution: "CartoDB <a href='http://cartodb.com/attributions' target='_blank'>attribution</a>", active: true, query: null, opacity: 0.99, interactivity: "cartodb_id", interaction: true, debug: false, tiler_domain: "localhost.lan", tiler_port: "8181", tiler_protocol: "http", sql_api_domain: "development.localhost.lan", sql_api_port: 8080, sql_api_protocol: "http", extra_params: { cache_policy: "persist", cache_buster: 1369995364392 }, cdn_url: "", maxZoom: 28, auto_bound: false, visible: true, sql_domain: "localhost.lan", sql_port: "8080", sql_protocol: "http", tile_style_history: [ "#untitled_table1 { // polygons [mapnik-geometry-type=polygons] { marker-fill: #FF6600; marker-opacity: 1; marker-width: 12; marker-line-color: white; marker-line-width: 3; marker-line-opacity: 0.9; marker-placement: point; marker-type: ellipse;marker-allow-overlap: true; } //lines [mapnik-geometry-type=linestring] { line-color: #FF6600; line-width: 2; line-opacity: 0.7; } //polygons [mapnik-geometry-type=polygon] { polygon-fill:#FF6600; polygon-opacity: 0.7; line-opacity:1; line-color: #FFFFFF; } }" ], style_version: "2.1.1", table_name: "points", user_name: "development", tile_style: "#untitled_table { // points [mapnik-geometry-type=point] { marker-fill: #FF6600; marker-opacity: 1; marker-width: 12; marker-line-color: white; marker-line-width: 3; marker-line-opacity: 0.9; marker-placement: point; marker-type: ellipse;marker-allow-overlap: true; } //lines [mapnik-geometry-type=linestring] { line-color: #FF6600; line-width: 2; line-opacity: 0.7; } //polygons [mapnik-geometry-type=polygon] { polygon-fill:#FF6600; polygon-opacity: 0.7; line-opacity:1; line-color: #FFFFFF; } }", use_server_style: true, query_history: [ ], sql_api_endpoint: "/api/v1/sql", no_cdn: true, order: 2, kind: "carto", template_name: "table/views/infowindow_light" , id: 231, order: 1 });
    var l3 = new cdb.geo.CartoDBLayer({ type: "CartoDB", attribution: "CartoDB <a href='http://cartodb.com/attributions' target='_blank'>attribution</a>", active: true, query: null, opacity: 0.99, interactivity: "cartodb_id", interaction: true, debug: false, tiler_domain: "localhost.lan", tiler_port: "8181", tiler_protocol: "http", sql_api_domain: "development.localhost.lan", sql_api_port: 8080, sql_api_protocol: "http", extra_params: { cache_policy: "persist", cache_buster: 1369995364392 }, cdn_url: "", maxZoom: 28, auto_bound: false, visible: true, sql_domain: "localhost.lan", sql_port: "8080", sql_protocol: "http", tile_style_history: [ "#untitled_table { // points [mapnik-geometry-type=point] { marker-fill: #FF6600; marker-opacity: 1; marker-width: 12; marker-line-color: white; marker-line-width: 3; marker-line-opacity: 0.9; marker-placement: point; marker-type: ellipse;marker-allow-overlap: true; } //lines [mapnik-geometry-type=linestring] { line-color: #FF6600; line-width: 2; line-opacity: 0.7; } //polygons [mapnik-geometry-type=polygon] { polygon-fill:#FF6600; polygon-opacity: 0.7; line-opacity:1; line-color: #FFFFFF; } }" ], style_version: "2.1.1", table_name: "polygons", user_name: "development", tile_style: "#untitled_table { // points [mapnik-geometry-type=point] { marker-fill: #FF6600; marker-opacity: 1; marker-width: 12; marker-line-color: white; marker-line-width: 3; marker-line-opacity: 0.9; marker-placement: point; marker-type: ellipse;marker-allow-overlap: true; } //lines [mapnik-geometry-type=linestring] { line-color: #FF6600; line-width: 2; line-opacity: 0.7; } //polygons [mapnik-geometry-type=polygon] { polygon-fill:#FF6600; polygon-opacity: 0.7; line-opacity:1; line-color: #FFFFFF; } }", use_server_style: true, query_history: [ ], sql_api_endpoint: "/api/v1/sql", no_cdn: true, order: 2, kind: "carto", template_name: "table/views/infowindow_light" , id: 1231, order: 2 });

    layerGroup = new cdb.geo.CartoDBGroupLayer({
      layer_definition: {
        version: '1.0.0',
        layers: [{
          type: 'cartodb',
          options: {
            sql: "select * from european_countries_export",
            cartocss: '#layer { polygon-fill: #000; polygon-opacity: 0.8;}',
            cartocss_version : '2.0.0',
            layer_name: "european_countries_export",
            interactivity: ['created_at', 'cartodb_id']
          }
        },{
          type: 'cartodb',
          options: {
            sql: "select * from jamon_countries",
            cartocss: '#layer { polygon-fill: #000; polygon-opacity: 0.8;}',
            cartocss_version : '2.0.0',
            layer_name: "jamon_countries",
            interactivity: ['description', 'cartodb_id']
          }
        }]
      }
    });

    map.layers = new cdb.geo.Layers([l1, layerGroup]);

    var template = cdb.core.Template.compile('\<div class="backdrop"></div>\
      <div class="cartodb-header">\
      <div class="content">\
      <a href="#" class="fullscreen"></a>\
      <a href="#" class="toggle"></a>\
      <div class="hgroup">\
      <div class="title"></div>\
      <div class="description"></div>\
      </div>\
      </div>\
      </div>\
      <div class="aside">\
      <div class="layer-container">\
      <div class="scrollpane"><ul class="layers"></ul></div>\
      </div>\
      </div>\
      <div class="cartodb-attribution"></div>\
      <a href="#" class="cartodb-attribution-button"></a>\
      <div class="torque"></div>\
      ', 'mustache');

    var container = $('<div>').css('height', '200px');

    var mapView = new cdb.geo.GoogleMapsMapView({
      el: container,
      map: map
    });

    var overlays = [];

    overlays.push({
      options: {
        extra: {
          description: null,
          title: "Hello!",
          show_title: true,
          show_description: false
        },
      },
      order: 1,
      shareable: false,
      type: "header",
      url: null
    });

    mobile = new cdb.geo.ui.Mobile({
      template: template,
      mapView: mapView,
      overlays: overlays,
      torqueLayer: null,
      map: map
    });

  });

  describe("with CartoDB layers", function() {

    it("should render properly", function() {
      mobile.render();
      expect(mobile.$el.find(".aside").length).toBe(1);
    });

    it("should render the title", function() {
      mobile.render();
      expect(mobile.$el.find(".title").text()).toBe("Hello!");
    });

    it("should render the layer toggle", function() {
      mobile.render();
      expect(mobile.$el.hasClass("with-header")).toBe(true);
      expect(mobile.$el.find(".cartodb-header .toggle").length).toBe(1);
    });

    it("should render the layers", function() {
      mobile.render();
      expect(mobile.$el.find(".layers > li").length).toBe(2);
    });

    it("should render the attribution", function() {
      mobile.render();
      expect(mobile.$el.find(".cartodb-attribution-button").length).toBe(1);
      expect(mobile.$el.find(".cartodb-attribution").html()).toBe('<li>©2012 Nokia <a href="http://here.net/services/terms" target="_blank">Terms of use</a></li><li>CartoDB <a href="http://cartodb.com/attributions" target="_blank">attribution</a></li>');
    });

  });

});

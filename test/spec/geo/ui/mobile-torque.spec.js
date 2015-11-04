var $ = require('jquery');
var _ = require('underscore');

describe('geo/ui/mobile (torque)', function() {

  var mobile, map, layerGroup, container, mapView, template, overlays, l1, l2, torque;

  beforeEach(function() {
    map = new cdb.geo.Map();

    torque = new cdb.geo.TorqueLayer({ type: "torque", visible: false, urlTemplate: "https://maps.nlp.nokia.com/maptiler/v2/maptile/newest/normal.day/{z}/{x}/{y}/256/png8?lg=eng&token=61YWYROufLu_f8ylE0vn0Q&app_id=qIWDkliFCtLntLma2e6O", name: "Nokia Day", className: "nokia_day", attribution: "©2012 Nokia <a href='http://here.net/services/terms' target='_blank'>Terms of use</a>", kind: "tiled", infowindow: null, id: 1226, order: 0 });

    l1 = new cdb.geo.CartoDBLayer({ type: "Tiled", visible: true, urlTemplate: "https://maps.nlp.nokia.com/maptiler/v2/maptile/newest/normal.day/{z}/{x}/{y}/256/png8?lg=eng&token=61YWYROufLu_f8ylE0vn0Q&app_id=qIWDkliFCtLntLma2e6O", name: "Nokia Day", className: "nokia_day", attribution: "©2012 Nokia <a href='http://here.net/services/terms' target='_blank'>Terms of use</a>", kind: "tiled", infowindow: null, id: 1226, order: 0 });

    l2 = new cdb.geo.CartoDBLayer({ type: "CartoDB", attribution: "CartoDB <a href='http://cartodb.com/attributions' target='_blank'>attribution</a>", active: true, query: null, opacity: 0.99, interactivity: "cartodb_id", interaction: true, debug: false, tiler_domain: "localhost.lan", tiler_port: "8181", tiler_protocol: "http", sql_api_domain: "development.localhost.lan", sql_api_port: 8080, sql_api_protocol: "http", extra_params: { cache_policy: "persist", cache_buster: 1369995364392 }, cdn_url: "", maxZoom: 28, auto_bound: false, visible: true, sql_domain: "localhost.lan", sql_port: "8080", sql_protocol: "http", tile_style_history: [ "#untitled_table1 { // polygons [mapnik-geometry-type=polygons] { marker-fill: #FF6600; marker-opacity: 1; marker-width: 12; marker-line-color: white; marker-line-width: 3; marker-line-opacity: 0.9; marker-placement: point; marker-type: ellipse;marker-allow-overlap: true; } //lines [mapnik-geometry-type=linestring] { line-color: #FF6600; line-width: 2; line-opacity: 0.7; } //polygons [mapnik-geometry-type=polygon] { polygon-fill:#FF6600; polygon-opacity: 0.7; line-opacity:1; line-color: #FFFFFF; } }" ], style_version: "2.1.1", table_name: "points", user_name: "development", tile_style: "#untitled_table { // points [mapnik-geometry-type=point] { marker-fill: #FF6600; marker-opacity: 1; marker-width: 12; marker-line-color: white; marker-line-width: 3; marker-line-opacity: 0.9; marker-placement: point; marker-type: ellipse;marker-allow-overlap: true; } //lines [mapnik-geometry-type=linestring] { line-color: #FF6600; line-width: 2; line-opacity: 0.7; } //polygons [mapnik-geometry-type=polygon] { polygon-fill:#FF6600; polygon-opacity: 0.7; line-opacity:1; line-color: #FFFFFF; } }", use_server_style: true, query_history: [ ], sql_api_endpoint: "/api/v1/sql", no_cdn: true, order: 2, kind: "carto", template_name: "table/views/infowindow_light" , id: 231, order: 1 });

    layerGroup = new cdb.geo.CartoDBGroupLayer({
      layer_definition: {
        version: '1.0.0',
        layers: [{
          type: 'cartodb',
            visible: false,
          options: {
            sql: "select * from european_countries_export",
            cartocss: '#layer { polygon-fill: #000; polygon-opacity: 0.8;}',
            cartocss_version : '2.0.0',
            layer_name: "european_countries_export",
            interactivity: ['created_at', 'cartodb_id']
          }
        },{
          type: 'cartodb',
            visible: false,
          options: {
            sql: "select * from jamon_countries",
            cartocss: '#layer { polygon-fill: #000; polygon-opacity: 0.8;}',
            cartocss_version : '2.0.0',
            layer_name: "jamon_countries",
            interactivity: ['description', 'cartodb_id']
          }
        },{
          type: 'cartodb',
            visible: true,
          options: {
            sql: "select * from jamon_countries",
            cartocss: '#layer { polygon-fill: #000; polygon-opacity: 0.8;}',
            cartocss_version : '2.0.0',
            layer_name: "layer_with_legend",
            interactivity: ['description', 'cartodb_id'],
          },
          legend: {
            type: "custom",
            title: "Little legend",
            show_title: true,
            data: [
              { name: "Natural Parks",  value: "#58A062" },
              { name: "Villages",       value: "#F07971" },
              { name: "Rivers",         value: "#54BFDE" },
              { name: "Fields",         value: "#9BC562" },
              { name: "Caves",          value: "#FABB5C" }
            ]
          }
        }]
      }
    });

    map.layers.reset([l1, layerGroup]);

    template = cdb.core.Template.compile('\<div class="backdrop"></div>\
          <div class="cartodb-header">\
          <div class="content">\
          <a href="#" class="fullscreen"></a>\
          <a href="#" class="toggle"></a>\
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

          container = $('<div>').css('height', '200px');

          mapView = new cdb.geo.GoogleMapsMapView({
            el: container,
            map: map
          });

          overlays = [];

          overlays.push({
            order: 2,
            type: "zoom",
            url: null
          });

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

  });

  describe("with a hidden torque layer", function() {
    var mobile;

    beforeEach(function() {
      torque.options = { steps: 3 };
      torque.hidden  = true;
      torque.getStep = function() {};

      mobile = new cdb.geo.ui.Mobile({
        template: template,
        mapView: mapView,
        overlays: overlays,
        torqueLayer: torque,
        map: map
      });
    });

    it("should hide the timeslider", function() {
      mobile.render();
      expect(mobile.$el.find(".cartodb-timeslider").length).toBe(1);
      expect(mobile.$el.find(".cartodb-timeslider").css("display")).toBe("none");
    });
  });

});

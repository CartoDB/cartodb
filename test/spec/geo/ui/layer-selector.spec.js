var $ = require('jquery');
var Backbone = require('backbone');
var L = require('leaflet');
var cdb = require('cdb');
cdb.geo.ui.LayerView = require('cdb/geo/ui/layer-view');
var Map = require('cdb/geo/map');
var CartoDBLayer = require('cdb/geo/map/cartodb-layer');
var CartoDBLayerGroupAnonymous = require('cdb/geo/map/cartodb-layer-group-anonymous');
var Layers = require('cdb/geo/map/layers');
var LeafletMapView = require('cdb/geo/leaflet/leaflet-map-view');
var Template = require('cdb/core/template');
var LayerSelector = require('cdb/geo/ui/layer-selector');

describe('geo/ui/layer-selector', function() {

  var layerSelector, layerSelector2, l1, l2, l3;

  beforeEach(function() {
    // Layers
    l1 = new CartoDBLayer({ type: "Tiled", visible: true, urlTemplate: "https://maps.nlp.nokia.com/maptiler/v2/maptile/newest/normal.day/{z}/{x}/{y}/256/png8?lg=eng&token=61YWYROufLu_f8ylE0vn0Q&app_id=qIWDkliFCtLntLma2e6O", name: "Nokia Day", className: "nokia_day", attribution: "©2012 Nokia <a href='http://here.net/services/terms' target='_blank'>Terms of use</a>", kind: "tiled", infowindow: null, id: 1226, order: 0 });
    l2 = new CartoDBLayer({ type: "CartoDB", attribution: "CartoDB <a href='http://cartodb.com/attributions' target='_blank'>attribution</a>", active: true, query: null, opacity: 0.99, interactivity: "cartodb_id", interaction: true, debug: false, tiler_domain: "localhost.lan", tiler_port: "8181", tiler_protocol: "http", sql_api_domain: "development.localhost.lan", sql_api_port: 8080, sql_api_protocol: "http", extra_params: { cache_policy: "persist", cache_buster: 1369995364392 }, cdn_url: "", maxZoom: 28, auto_bound: false, visible: true, sql_domain: "localhost.lan", sql_port: "8080", sql_protocol: "http", tile_style_history: [ "#untitled_table1 { // polygons [mapnik-geometry-type=polygons] { marker-fill: #FF6600; marker-opacity: 1; marker-width: 12; marker-line-color: white; marker-line-width: 3; marker-line-opacity: 0.9; marker-placement: point; marker-type: ellipse;marker-allow-overlap: true; } //lines [mapnik-geometry-type=linestring] { line-color: #FF6600; line-width: 2; line-opacity: 0.7; } //polygons [mapnik-geometry-type=polygon] { polygon-fill:#FF6600; polygon-opacity: 0.7; line-opacity:1; line-color: #FFFFFF; } }" ], style_version: "2.1.1", table_name: "points", user_name: "development", tile_style: "#untitled_table { // points [mapnik-geometry-type=point] { marker-fill: #FF6600; marker-opacity: 1; marker-width: 12; marker-line-color: white; marker-line-width: 3; marker-line-opacity: 0.9; marker-placement: point; marker-type: ellipse;marker-allow-overlap: true; } //lines [mapnik-geometry-type=linestring] { line-color: #FF6600; line-width: 2; line-opacity: 0.7; } //polygons [mapnik-geometry-type=polygon] { polygon-fill:#FF6600; polygon-opacity: 0.7; line-opacity:1; line-color: #FFFFFF; } }", use_server_style: true, query_history: [ ], sql_api_endpoint: "/api/v1/sql", no_cdn: true, order: 2, kind: "carto", template_name: "table/views/infowindow_light" , id: 231, order: 1 });
    l3 = new CartoDBLayer({ type: "CartoDB", attribution: "CartoDB <a href='http://cartodb.com/attributions' target='_blank'>attribution</a>", active: true, query: null, opacity: 0.99, interactivity: "cartodb_id", interaction: true, debug: false, tiler_domain: "localhost.lan", tiler_port: "8181", tiler_protocol: "http", sql_api_domain: "development.localhost.lan", sql_api_port: 8080, sql_api_protocol: "http", extra_params: { cache_policy: "persist", cache_buster: 1369995364392 }, cdn_url: "", maxZoom: 28, auto_bound: false, visible: true, sql_domain: "localhost.lan", sql_port: "8080", sql_protocol: "http", tile_style_history: [ "#untitled_table { // points [mapnik-geometry-type=point] { marker-fill: #FF6600; marker-opacity: 1; marker-width: 12; marker-line-color: white; marker-line-width: 3; marker-line-opacity: 0.9; marker-placement: point; marker-type: ellipse;marker-allow-overlap: true; } //lines [mapnik-geometry-type=linestring] { line-color: #FF6600; line-width: 2; line-opacity: 0.7; } //polygons [mapnik-geometry-type=polygon] { polygon-fill:#FF6600; polygon-opacity: 0.7; line-opacity:1; line-color: #FFFFFF; } }" ], style_version: "2.1.1", table_name: "polygons", user_name: "development", tile_style: "#untitled_table { // points [mapnik-geometry-type=point] { marker-fill: #FF6600; marker-opacity: 1; marker-width: 12; marker-line-color: white; marker-line-width: 3; marker-line-opacity: 0.9; marker-placement: point; marker-type: ellipse;marker-allow-overlap: true; } //lines [mapnik-geometry-type=linestring] { line-color: #FF6600; line-width: 2; line-opacity: 0.7; } //polygons [mapnik-geometry-type=polygon] { polygon-fill:#FF6600; polygon-opacity: 0.7; line-opacity:1; line-color: #FFFFFF; } }", use_server_style: true, query_history: [ ], sql_api_endpoint: "/api/v1/sql", no_cdn: true, order: 2, kind: "carto", template_name: "table/views/infowindow_light" , id: 1231, order: 2 });
  });

  // TODO: This will never happen (CartoDB layers are not added directly to the a map)
  //  -> Perhaps we should test Torque Layers instead
  describe("with CartoDB layers", function() {

    beforeEach(function() {
      var map = new Map();
      map.layers = new Layers([l1, l2, l3]);

      var mapView = new LeafletMapView({
        el: $("<div>"),
        map: map
      });

      layerSelector = new LayerSelector({
        mapView: mapView,
        template: Template.compile('<a href="#/change-visibility" class="layers">Visible layers<div class="count"></div></a>','underscore'),
        dropdown_template: Template.compile('<ul></ul><div class="tail"><span class="border"></span></div>','underscore')
      });
    });

    it("should render properly", function() {
      layerSelector.render();
      expect(layerSelector.$('a.layers').size()).toBe(1);
      expect(layerSelector.$('a.layer').size()).toBe(2);
      expect(layerSelector.$('a.layer:eq(0)').text()).not.toBe("");
      expect(layerSelector.$('a.layer:eq(1)').text()).not.toBe("");
      expect(layerSelector.$('div.count').text()).toBe("2")
    });

    it("should render the dropdown correctly", function() {
      layerSelector.render();
      expect(layerSelector.dropdown.$('li').size()).toBe(2);
    });

    it("should store two layers", function() {
      layerSelector.render();
      expect(layerSelector.layers.length).toBe(2);
    });

    it("should open the dropdown when clicks over it", function() {
      layerSelector.render();
      layerSelector.$('a.layers').click();
      expect(layerSelector.dropdown.$el.css('display')).toBe('block');
    });

    it("should change the select status when the switch button is clicked and trigger and event", function() {
      layerSelector.render();

      for(var key in layerSelector._subviews) break;
      var view = layerSelector._subviews[key];

      view.$el.find(".switch").click();
      expect(view.model.get("visible")).toBeFalsy();

      view.$el.find(".switch").click();
      expect(view.model.get("visible")).toBeTruthy();
    });

    it("should trigger a switchChanged event when the switch button is clicked", function() {
      layerSelector.render();
      for(var key in layerSelector._subviews) break;
      var view = layerSelector._subviews[key];
      spyOn(view, 'trigger');
      view.$el.find(".switch").click();
      expect(view.trigger).toHaveBeenCalledWith('switchChanged');
    });

    it("should toggle the enabled/disabled classes when the switch button is clicked", function() {
      layerSelector.render();
      for(var key in layerSelector._subviews) break;
      var view = layerSelector._subviews[key];

      view.$el.find(".switch").click();
      expect(view.$el.find(".switch").hasClass("enabled")).toBeFalsy();
      expect(view.$el.find(".switch").hasClass("disabled")).toBeTruthy();
    });
  });

  describe("with a CartoDB LayerGroup", function() {

    var layerGroup, layer1, layer2;

    beforeEach(function() {
      var map2 = new Map();

      layer1 = new CartoDBLayer({ layer_name: 'Layer 1' });
      layer2 = new CartoDBLayer({ layer_name: 'Layer 2' });

      layerGroup = new CartoDBLayerGroupAnonymous({}, {
        layers: [layer1, layer2]
      });

      map2.layers = new Layers([layerGroup]);

      var mapView2 = new LeafletMapView({
        el: $("<div>"),
        map: map2
      });

      layerSelector2 = new LayerSelector({
        mapView: mapView2,
        template: Template.compile('<a href="#/change-visibility" class="layers">Visible layers<div class="count"></div></a>','underscore'),
        dropdown_template: Template.compile('<ul></ul><div class="tail"><span class="border"></span></div>','underscore')
      });
    });

    it("should render properly", function() {
      layerSelector2.render();
      expect(layerSelector2.$('a.layers').size()).toBe(1);
      expect(layerSelector2.$('a.layer').size()).toBe(2);
      expect(layerSelector2.$('a.layer:eq(0)').text()).toBe("Layer 1");
      expect(layerSelector2.$('a.layer:eq(1)').text()).toBe("Layer 2");
      expect(layerSelector2.$('div.count').text()).toBe("2");
    });

    it("should store two layers", function() {
      layerSelector2.render();
      expect(layerSelector2.layers.length).toBe(2);
    });

    it("should hide the layer when the switch button is clicked", function() {
      layerSelector2.render();

      // Al layers are visible
      expect(layer1.isVisible()).toBeTruthy();
      expect(layer2.isVisible()).toBeTruthy();
      expect(layerSelector2.$('div.count').text()).toBe("2");

      // Hide the first layer
      var switcher = $(layerSelector2.$('li')[0]);
      switcher.find(".switch").click();

      // Layer1 is hidden
      expect(layer1.isVisible()).toBeFalsy();
      expect(layer2.isVisible()).toBeTruthy();
      expect(layerSelector2.$('div.count').text()).toBe("1");
    });
  });
});

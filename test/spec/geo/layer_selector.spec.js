describe("cdb.geo.ui.layer_selector", function() {

  describe("cdb.geo.ui.layer", function() {
    describe("model", function() {

      var model;

      beforeEach(function() {
        model = new cdb.geo.ui.Layer();
      });

      it("should be visible by default", function() {
        expect(model.get("visible")).toBeTruthy();
      });

    });

    describe("view", function() {

      var layerSelector, layerSelector2, spyEvent, view, spy, model;

      beforeEach(function() {

        spy = { switchChanged: function() {} };
        spyEvent = spyOn(spy, "switchChanged");
        model = new cdb.geo.ui.Layer({ options: { table_name: "table_name" } });

        var map    = {};
        var map2   = {};

        // Layers
        var l1 = new cdb.geo.ui.Layer({ type: "Tiled", visible: true, urlTemplate: "https://maps.nlp.nokia.com/maptiler/v2/maptile/newest/normal.day/{z}/{x}/{y}/256/png8?lg=eng&token=61YWYROufLu_f8ylE0vn0Q&app_id=qIWDkliFCtLntLma2e6O", name: "Nokia Day", className: "nokia_day", attribution: "©2012 Nokia <a href='http://here.net/services/terms' target='_blank'>Terms of use</a>", kind: "tiled", infowindow: null, id: 1226, order: 0 });
        var l2 = new cdb.geo.ui.Layer({ type: "CartoDB", attribution: "CartoDB <a href='http://cartodb.com/attributions' target='_blank'>attribution</a>", active: true, query: null, opacity: 0.99, interactivity: "cartodb_id", interaction: true, debug: false, tiler_domain: "localhost.lan", tiler_port: "8181", tiler_protocol: "http", sql_api_domain: "development.localhost.lan", sql_api_port: 8080, sql_api_protocol: "http", extra_params: { cache_policy: "persist", cache_buster: 1369995364392 }, cdn_url: "", maxZoom: 28, auto_bound: false, visible: true, sql_domain: "localhost.lan", sql_port: "8080", sql_protocol: "http", tile_style_history: [ "#untitled_table1 { // polygons [mapnik-geometry-type=polygons] { marker-fill: #FF6600; marker-opacity: 1; marker-width: 12; marker-line-color: white; marker-line-width: 3; marker-line-opacity: 0.9; marker-placement: point; marker-type: ellipse;marker-allow-overlap: true; } //lines [mapnik-geometry-type=linestring] { line-color: #FF6600; line-width: 2; line-opacity: 0.7; } //polygons [mapnik-geometry-type=polygon] { polygon-fill:#FF6600; polygon-opacity: 0.7; line-opacity:1; line-color: #FFFFFF; } }" ], style_version: "2.1.1", table_name: "points", user_name: "development", tile_style: "#untitled_table { // points [mapnik-geometry-type=point] { marker-fill: #FF6600; marker-opacity: 1; marker-width: 12; marker-line-color: white; marker-line-width: 3; marker-line-opacity: 0.9; marker-placement: point; marker-type: ellipse;marker-allow-overlap: true; } //lines [mapnik-geometry-type=linestring] { line-color: #FF6600; line-width: 2; line-opacity: 0.7; } //polygons [mapnik-geometry-type=polygon] { polygon-fill:#FF6600; polygon-opacity: 0.7; line-opacity:1; line-color: #FFFFFF; } }", use_server_style: true, query_history: [ ], sql_api_endpoint: "/api/v1/sql", no_cdn: true, order: 2, kind: "carto", template_name: "table/views/infowindow_light" , id: 231, order: 1 });
        var l3 = new cdb.geo.ui.Layer({ type: "CartoDB", attribution: "CartoDB <a href='http://cartodb.com/attributions' target='_blank'>attribution</a>", active: true, query: null, opacity: 0.99, interactivity: "cartodb_id", interaction: true, debug: false, tiler_domain: "localhost.lan", tiler_port: "8181", tiler_protocol: "http", sql_api_domain: "development.localhost.lan", sql_api_port: 8080, sql_api_protocol: "http", extra_params: { cache_policy: "persist", cache_buster: 1369995364392 }, cdn_url: "", maxZoom: 28, auto_bound: false, visible: true, sql_domain: "localhost.lan", sql_port: "8080", sql_protocol: "http", tile_style_history: [ "#untitled_table { // points [mapnik-geometry-type=point] { marker-fill: #FF6600; marker-opacity: 1; marker-width: 12; marker-line-color: white; marker-line-width: 3; marker-line-opacity: 0.9; marker-placement: point; marker-type: ellipse;marker-allow-overlap: true; } //lines [mapnik-geometry-type=linestring] { line-color: #FF6600; line-width: 2; line-opacity: 0.7; } //polygons [mapnik-geometry-type=polygon] { polygon-fill:#FF6600; polygon-opacity: 0.7; line-opacity:1; line-color: #FFFFFF; } }" ], style_version: "2.1.1", table_name: "polygons", user_name: "development", tile_style: "#untitled_table { // points [mapnik-geometry-type=point] { marker-fill: #FF6600; marker-opacity: 1; marker-width: 12; marker-line-color: white; marker-line-width: 3; marker-line-opacity: 0.9; marker-placement: point; marker-type: ellipse;marker-allow-overlap: true; } //lines [mapnik-geometry-type=linestring] { line-color: #FF6600; line-width: 2; line-opacity: 0.7; } //polygons [mapnik-geometry-type=polygon] { polygon-fill:#FF6600; polygon-opacity: 0.7; line-opacity:1; line-color: #FFFFFF; } }", use_server_style: true, query_history: [ ], sql_api_endpoint: "/api/v1/sql", no_cdn: true, order: 2, kind: "carto", template_name: "table/views/infowindow_light" , id: 1231, order: 2 });

          var layerGroup = new cdb.geo.CartoDBGroupLayer({
            layer_definition: {
              version: '1.0.0',
              layers: new cdb.geo.ui.Layers([l2, l3])
            }});

        map.layers = new cdb.geo.ui.Layers([l1, l2, l3]);
        map2.layers = new cdb.geo.ui.Layers([l1, layerGroup]);

        layerSelector = new cdb.geo.ui.LayerSelector({
          map: map
        });

        layerSelector2 = new cdb.geo.ui.LayerSelector({
          map: map2
        });

        view  = new cdb.geo.ui.LayerView({
          model: model,
        }).bind("switchChanged", spy.switchChanged, spy);

      });

      it("should retrieve the CartoDB layers", function() {
        view.render();
        var layers = layerSelector.cartoDBLayers;

        expect(layers.length).toEqual(2);
        expect(layers[0].get("table_name")).toEqual("points");
        expect(layers[1].get("table_name")).toEqual("polygons");
      });

      it("should retrieve the CartoDB layers from a vizjson", function() {
        view.render();
        var layers = layerSelector2.cartoDBLayers;

        expect(layers.length).toEqual(2);
        expect(layers[0].get("table_name")).toEqual("points");
        expect(layers[1].get("table_name")).toEqual("polygons");
      });


      it("should change the select status when the switch button is clicked", function() {
        view.render();
        view.$el.find(".switch").click();
        expect(view.model.get("visible")).toBeFalsy();

        view.$el.find(".switch").click();
        expect(view.model.get("visible")).toBeTruthy();
      });

      /*it("should trigger a switchChanged event when the switch button is clicked", function() {
        view.render();
        view.$el.find(".switch").click();
        expect(spyEvent).toHaveBeenCalled();
      });

      it("should trigger a switchChanged event when the switch button is clicked", function() {
        view.render();
        view.$el.find(".switch").click();
        expect(spyEvent).toHaveBeenCalled();
      });*/

      it("should toggle the enabled/disabled classes when the switch button is clicked", function() {
        view.render();

        view.$el.find(".switch").click();
        expect(view.$el.find(".switch").hasClass("enabled")).toBeFalsy();
        expect(view.$el.find(".switch").hasClass("disabled")).toBeTruthy();

        view.$el.find(".switch").click();
        expect(view.$el.find(".switch").hasClass("enabled")).toBeTruthy();
        expect(view.$el.find(".switch").hasClass("disabled")).toBeFalsy();

      });

    });

  });

});

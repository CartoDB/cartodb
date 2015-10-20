describe("cdb.geo.ui.Mobile", function() {

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

  describe("with legends, with layer selector, without search", function() {

    var mobile;

    beforeEach(function() {

      mobile = new cdb.geo.ui.Mobile({
        template: template,
        mapView: mapView,
        overlays: overlays,
        torqueLayer: null,
        map: map,
        visibility_options: {
          search: false,
          legends: true,
          layer_selector: true
        }
      });

    });

    it("should render properly", function() {
      mobile.render();
      expect(mobile.$el.find(".aside").length).toBe(1);
    });

    it("should render the title", function() {
      mobile.render();
      expect(mobile.$el.find(".title").text()).toBe("Hello!");
    });

    it("shouldn't render the description", function() {
      mobile.render();
      expect(mobile.$el.find(".description").length).toBe(0);
    });

    it("should render the layers", function() {
      mobile.render();
      expect(mobile.$el.hasClass("with-layers")).toBe(true);
      expect(mobile.$el.find(".layer-container > h3").text()).toBe("3 layers");
      expect(mobile.$el.find(".layers > li").length).toBe(3);

      // There's one layer with legend
      expect(mobile.$el.find(".layers > li:nth-child(3) .cartodb-legend").length).toBe(1);

      expect(mobile.$el.find(".layers > li:nth-child(1) h3").text()).toBe("european_countries_exp&hellip;");
      expect(mobile.$el.find(".layers > li:nth-child(2) h3").text()).toBe("jamon_countries");
      expect(mobile.$el.find(".layers > li:nth-child(3) h3").text()).toBe("layer_with_legend");
    });

    it("shouldn't render the search", function() {
      mobile.render();
      expect(mobile.$el.hasClass("with-search")).toBe(false);
      expect(mobile.$el.find(".cartodb-searchbox").length).toBe(0);
    });

    it("should render the attribution", function() {
      mobile.render();
      expect(mobile.$el.find(".cartodb-attribution-button").length).toBe(1);
      expect(mobile.$el.find(".cartodb-attribution").html()).toBe('<li>©2012 Nokia <a href="http://here.net/services/terms" target="_blank">Terms of use</a></li><li>CartoDB <a href="http://cartodb.com/attributions" target="_blank">attribution</a></li>');
    });

    it("should has the attribution hidden by default", function() {
      mobile.render();
      expect(mobile.$el.find(".cartodb-attribution").css("display")).toBe("");
    });

    it("should show the zoom", function() {
      mobile.render();
      expect(mobile.$el.find(".cartodb-zoom").length).toBe(1);
    });

    it("should show the toggle button", function() {
      mobile.render();
      expect(mobile.$el.find(".cartodb-header .content .toggle").length).toBe(1);
    });

    it("should show the attribution", function() {
      mobile.render();
      mobile.$el.find(".cartodb-attribution-button").click();
      expect(mobile.$el.find(".cartodb-attribution").css("display")).toBe("block");
    });

    it("should render the legend", function() {
      mobile.render();
      expect(mobile.$el.find(".layers .cartodb-mobile-layer.has-legend .cartodb-legend .legend-title").text()).toBe("Little legend");
      expect(mobile.$el.find(".layers .cartodb-mobile-layer.has-legend").length).toBe(1);
    });

    //it("should hide the attribution when clicking on the backdrop", function() {
      //mobile.render();
      //mobile.$el.find(".cartodb-attribution-button").click();
      //mobile.$el.find(".cartodb-attribution-button .backdrop").click();

      //setTimeout(function() {
        //expect(mobile.$el.find(".cartodb-attribution").css("display")).toBe("");
      //}, 450);

    //});

  });

  describe("without layer_selector, without legends, without search", function() {

    var mobile;

    beforeEach(function() {

      mobile = new cdb.geo.ui.Mobile({
        template: template,
        mapView: mapView,
        overlays: overlays,
        torqueLayer: null,
        map: map,
        visibility_options: {
          search:false,
          legends: false,
          layer_selector: false
        }
      });

    });

    it("should render properly", function() {
      mobile.render();
      expect(mobile.$el.find(".aside").length).toBe(1);
    });

    it("should render the title", function() {
      mobile.render();
      expect(mobile.$el.find(".title").text()).toBe("Hello!");
    });

    it("should set the right classes", function() {
      mobile.render();
      expect(mobile.$el.hasClass("with-header")).toBe(true);
      expect(mobile.$el.hasClass("with-layers")).toBe(false);
      expect(mobile.$el.hasClass("with-search")).toBe(false);
    });

    it("shouldn't render the layers", function() {
      mobile.render();
      expect(mobile.$el.find(".layers > li").length).toBe(0);
    });


    it("should render the attribution", function() {
      mobile.render();
      expect(mobile.$el.find(".cartodb-attribution-button").length).toBe(1);
      expect(mobile.$el.find(".cartodb-attribution").html()).toBe('<li>©2012 Nokia <a href="http://here.net/services/terms" target="_blank">Terms of use</a></li><li>CartoDB <a href="http://cartodb.com/attributions" target="_blank">attribution</a></li>');
    });

    it("should has the attribution hidden by default", function() {
      mobile.render();
      expect(mobile.$el.find(".cartodb-attribution").css("display")).toBe("");
    });

    it("should show the zoom", function() {
      mobile.render();
      expect(mobile.$el.find(".cartodb-zoom").length).toBe(1);
    });

    it("should show the attribution", function() {
      mobile.render();
      mobile.$el.find(".cartodb-attribution-button").click();
      expect(mobile.$el.find(".cartodb-attribution").css("display")).toBe("block");
    });

    it("shouldn't render the legend", function() {
      mobile.render();
      expect(mobile.$el.find(".layers .cartodb-mobile-layer.has-legend").length).toBe(0);
    });

  });

  describe("with legends, without layer selector, without search", function() {

    var mobile;

    beforeEach(function() {

      mobile = new cdb.geo.ui.Mobile({
        template: template,
        mapView: mapView,
        overlays: overlays,
        torqueLayer: null,
        map: map,
        visibility_options: {
          search: false,
          legends: true,
          layer_selector: false
        }
      });

    });

    it("should render properly", function() {
      mobile.render();
      expect(mobile.$el.find(".aside").length).toBe(1);
    });

    it("should render the title", function() {
      mobile.render();
      expect(mobile.$el.find(".title").text()).toBe("Hello!");
    });

    it("should render only the layers with legends", function() {
      mobile.render();
      expect(mobile.$el.hasClass("with-layers")).toBe(true);
      expect(mobile.$el.find(".layers > li h3").length).toBe(0); // don't show titles
      expect(mobile.$el.find(".layers > li").length).toBe(1);
      expect(mobile.$el.find(".layer-container h3").text()).toBe("1 layer");
    });

    it("shouldn't render the search", function() {
      mobile.render();
      expect(mobile.$el.hasClass("with-search")).toBe(false);
      expect(mobile.$el.find(".cartodb-searchbox").length).toBe(0);
    });

    it("should render the attribution", function() {
      mobile.render();
      expect(mobile.$el.find(".cartodb-attribution-button").length).toBe(1);
      expect(mobile.$el.find(".cartodb-attribution").html()).toBe('<li>©2012 Nokia <a href="http://here.net/services/terms" target="_blank">Terms of use</a></li><li>CartoDB <a href="http://cartodb.com/attributions" target="_blank">attribution</a></li>');
    });

    it("should has the attribution hidden by default", function() {
      mobile.render();
      expect(mobile.$el.find(".cartodb-attribution").css("display")).toBe("");
    });

    it("should show the zoom", function() {
      mobile.render();
      expect(mobile.$el.find(".cartodb-zoom").length).toBe(1);
    });

    it("should show the toggle button", function() {
      mobile.render();
      expect(mobile.$el.find(".cartodb-header .content .toggle").length).toBe(1);
    });

    it("should show the attribution", function() {
      mobile.render();
      mobile.$el.find(".cartodb-attribution-button").click();
      expect(mobile.$el.find(".cartodb-attribution").css("display")).toBe("block");
    });

    it("should render the legend", function() {
      mobile.render();
      expect(mobile.$el.find(".layers .cartodb-mobile-layer.has-legend .cartodb-legend .legend-title").text()).toBe("Little legend");
      expect(mobile.$el.find(".layers .cartodb-mobile-layer.has-legend").length).toBe(1);
    });

  });

  describe("with layer_selector, without legends, without search", function() {

    var mobile;

    beforeEach(function() {

      mobile = new cdb.geo.ui.Mobile({
        template: template,
        mapView: mapView,
        overlays: overlays,
        torqueLayer: null,
        map: map,
        visibility_options: {
          search: false,
          legends: false,
          layer_selector: true
        }
      });

    });

    it("should render properly", function() {
      mobile.render();
      expect(mobile.$el.find(".aside").length).toBe(1);
    });

    it("should render the title", function() {
      mobile.render();
      expect(mobile.$el.find(".title").text()).toBe("Hello!");
    });

    it("shouldn't render the search", function() {
      mobile.render();
      expect(mobile.$el.hasClass("with-search")).toBe(false);
    });

    it("should render the layers", function() {
      mobile.render();
      expect(mobile.$el.hasClass("with-header")).toBe(true);
      expect(mobile.$el.hasClass("with-layers")).toBe(true);
      expect(mobile.$el.find(".layers > li").length).toBe(3);
      expect(mobile.$el.find(".layers > li:first-child").hasClass("has-toggle")).toBe(true);
    });

    it("shouldn't render the legend", function() {
      mobile.render();
      expect(mobile.$el.find(".layers .cartodb-mobile-layer.has-legend").length).toBe(0);
    });

    it("should render the attribution", function() {
      mobile.render();
      expect(mobile.$el.find(".cartodb-attribution-button").length).toBe(1);
      expect(mobile.$el.find(".cartodb-attribution").html()).toBe('<li>©2012 Nokia <a href="http://here.net/services/terms" target="_blank">Terms of use</a></li><li>CartoDB <a href="http://cartodb.com/attributions" target="_blank">attribution</a></li>');
    });

    it("should has the attribution hidden by default", function() {
      mobile.render();
      expect(mobile.$el.find(".cartodb-attribution").css("display")).toBe("");
    });

    it("should show the zoom", function() {
      mobile.render();
      expect(mobile.$el.find(".cartodb-zoom").length).toBe(1);
    });

    it("should show the attribution", function() {
      mobile.render();
      mobile.$el.find(".cartodb-attribution-button").click();
      expect(mobile.$el.find(".cartodb-attribution").css("display")).toBe("block");
    });

  });

  describe("with search, without layer_selector, without legends", function() {

    var mobile;

    beforeEach(function() {

      mobile = new cdb.geo.ui.Mobile({
        template: template,
        mapView: mapView,
        overlays: overlays,
        torqueLayer: null,
        map: map,
        visibility_options: {
          search:true,
          legends: false,
          layer_selector: false
        }
      });

    });

    it("should render properly", function() {
      mobile.render();
      expect(mobile.$el.find(".aside").length).toBe(1);
    });

    it("should render the title", function() {
      mobile.render();
      expect(mobile.$el.find(".title").text()).toBe("Hello!");
    });

    it("should render the search", function() {
      mobile.render();
      expect(mobile.$el.hasClass("with-search")).toBe(true);
    });

    it("shouldn't render the layers", function() {
      mobile.render();
      expect(mobile.$el.hasClass("with-header")).toBe(true);
      expect(mobile.$el.hasClass("with-layers")).toBe(false);
      expect(mobile.$el.find(".layers > li").length).toBe(0);
    });

    it("should render the attribution", function() {
      mobile.render();
      expect(mobile.$el.find(".cartodb-attribution-button").length).toBe(1);
      expect(mobile.$el.find(".cartodb-attribution").html()).toBe('<li>©2012 Nokia <a href="http://here.net/services/terms" target="_blank">Terms of use</a></li><li>CartoDB <a href="http://cartodb.com/attributions" target="_blank">attribution</a></li>');
    });

    it("should has the attribution hidden by default", function() {
      mobile.render();
      expect(mobile.$el.find(".cartodb-attribution").css("display")).toBe("");
    });

    it("should show the zoom", function() {
      mobile.render();
      expect(mobile.$el.find(".cartodb-zoom").length).toBe(1);
    });

    it("should show the attribution", function() {
      mobile.render();
      mobile.$el.find(".cartodb-attribution-button").click();
      expect(mobile.$el.find(".cartodb-attribution").css("display")).toBe("block");
    });

    it("shouldn't render the legend", function() {
      mobile.render();
      expect(mobile.$el.find(".layers .cartodb-mobile-layer.has-legend").length).toBe(0);
    });

  });

  describe("without anything", function() {

    var mobile;

    beforeEach(function() {

      mobile = new cdb.geo.ui.Mobile({
        template: template,
        mapView: mapView,
        overlays: [],
        torqueLayer: null,
        map: map,
        visibility_options: {
          legends: false,
          layer_selector: false
        }
      });

    });

    it("should render properly", function() {
      mobile.render();
      expect(mobile.$el.find(".aside").length).toBe(1);
    });

    it("shouldn't render the title", function() {
      mobile.render();
      expect(mobile.$el.find(".title").text()).toBe("");
    });

    it("should set the right classes", function() {
      mobile.render();
      expect(mobile.$el.hasClass("with-header")).toBe(false);
      expect(mobile.$el.hasClass("with-layers")).toBe(false);
      expect(mobile.$el.hasClass("with-search")).toBe(false);
    });

    it("shouldn't render the layers", function() {
      mobile.render();
      expect(mobile.$el.hasClass("with-layers")).toBe(false);
      expect(mobile.$el.find(".layers > li").length).toBe(0);
    });


    it("should render the attribution", function() {
      mobile.render();
      expect(mobile.$el.find(".cartodb-attribution-button").length).toBe(1);
      expect(mobile.$el.find(".cartodb-attribution").html()).toBe('<li>©2012 Nokia <a href="http://here.net/services/terms" target="_blank">Terms of use</a></li><li>CartoDB <a href="http://cartodb.com/attributions" target="_blank">attribution</a></li>');
    });

    it("should has the attribution hidden by default", function() {
      mobile.render();
      expect(mobile.$el.find(".cartodb-attribution").css("display")).toBe("");
    });

    it("shouldn't show the zoom", function() {
      mobile.render();
      expect(mobile.$el.find(".cartodb-zoom").length).toBe(0);
    });

    it("should show the attribution", function() {
      mobile.render();
      mobile.$el.find(".cartodb-attribution-button").click();
      expect(mobile.$el.find(".cartodb-attribution").css("display")).toBe("block");
    });

    it("shouldn't render the legend", function() {
      mobile.render();
      expect(mobile.$el.find(".layers .cartodb-mobile-layer.has-legend").length).toBe(0);
    });

    //it("should hide the attribution when clicking on the backdrop", function() {
      //mobile.render();
      //mobile.$el.find(".cartodb-attribution-button").click();
      //mobile.$el.find(".cartodb-attribution-button .backdrop").click();

      //setTimeout(function() {
        //expect(mobile.$el.find(".cartodb-attribution").css("display")).toBe("");
      //}, 350);

    //});

  });

  describe("with some disabled layers", function() {

    var mobile, layerGroup2;

    beforeEach(function() {

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
        },{
          type: 'cartodb',
          options: {
            visible: false,
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
        }
        ]
      }
    });

    map.layers.reset([l1, layerGroup]);


    mapView = new cdb.geo.GoogleMapsMapView({
      el: container,
      map: map
    });

      mobile = new cdb.geo.ui.Mobile({
        template: template,
        mapView: mapView,
        overlays: overlays,
        torqueLayer: null,
        map: map,
        visibility_options: {
          layer_selector: true
        }
      });

    });

    it("should render properly", function() {
      mobile.render();
      expect(mobile.$el.find(".aside").length).toBe(1);
    });

    it("should render the title", function() {
      mobile.render();
      expect(mobile.$el.find(".title").text()).toBe("Hello!");
    });

    it("should render the layers", function() {
      mobile.render();
      expect(mobile.$el.hasClass("with-layers")).toBe(true);
      expect(mobile.$el.find(".layer-container > h3").text()).toBe("3 layers");
      expect(mobile.$el.find(".layers > li").length).toBe(3);

      // There's one hidden layer
      expect(mobile.$el.find(".layers > li:nth-child(3)").hasClass("hidden")).toBe(true);

      expect(mobile.$el.find(".layers > li:nth-child(1) h3").text()).toBe("european_countries_exp&hellip;");
      expect(mobile.$el.find(".layers > li:nth-child(2) h3").text()).toBe("jamon_countries");
      expect(mobile.$el.find(".layers > li:nth-child(3) h3").text()).toBe("layer_with_legend");
    });

    it("shouldn't render the search", function() {
      mobile.render();
      expect(mobile.$el.hasClass("with-search")).toBe(false);
      expect(mobile.$el.find(".cartodb-searchbox").length).toBe(0);
    });

    it("should render the attribution", function() {
      mobile.render();
      expect(mobile.$el.find(".cartodb-attribution-button").length).toBe(1);
      expect(mobile.$el.find(".cartodb-attribution").html()).toBe('<li>©2012 Nokia <a href="http://here.net/services/terms" target="_blank">Terms of use</a></li><li>CartoDB <a href="http://cartodb.com/attributions" target="_blank">attribution</a></li>');
    });

    it("should has the attribution hidden by default", function() {
      mobile.render();
      expect(mobile.$el.find(".cartodb-attribution").css("display")).toBe("");
    });

    it("should show the zoom", function() {
      mobile.render();
      expect(mobile.$el.find(".cartodb-zoom").length).toBe(1);
    });

    it("should show the toggle button", function() {
      mobile.render();
      expect(mobile.$el.find(".cartodb-header .content .toggle").length).toBe(1);
    });

    it("should show the attribution", function() {
      mobile.render();
      mobile.$el.find(".cartodb-attribution-button").click();
      expect(mobile.$el.find(".cartodb-attribution").css("display")).toBe("block");
    });

    it("should render the legend", function() {
      mobile.render();
      expect(mobile.$el.find(".layers .cartodb-mobile-layer.has-legend .cartodb-legend .legend-title").text()).toBe("Little legend");
      expect(mobile.$el.find(".layers .cartodb-mobile-layer.has-legend").length).toBe(1);
    });

    it("should hide the attribution when clicking on the backdrop", function(done) {
      mobile.render();
      mobile.$el.find(".cartodb-attribution-button").click();
      
      setTimeout(function() {
        expect(mobile.$el.find(".backdrop").css("display")).toBe("block");

        spyOn($.fn, 'fadeOut');

        mobile.$el.find(".backdrop").click();

        setTimeout(function() {
          // FadeOut tests are the hell!!
          expect($.fn.fadeOut).toHaveBeenCalled();
          expect($.fn.fadeOut.calls.count()).toBe(2);

          var elements_class = ['backdrop', 'cartodb-attribution'];
          expect(
            _.every($.fn.fadeOut.calls.all(), function(item, pos) {
              return _.contains(elements_class, $(item.object).attr('class'))
            })
          ).toBeTruthy();

          done();
        }, 500);

      }, 500);
    });

  });

  describe("disabling the title and the description", function() {

    var mobile;

    beforeEach(function() {

      mobile = new cdb.geo.ui.Mobile({
        template: template,
        mapView: mapView,
        overlays: overlays,
        torqueLayer: null,
        map: map,
        visibility_options: {
          title: false,
          description: false,
        }
      });

    });

    it("should render properly", function() {
      mobile.render();
      expect(mobile.$el.find(".aside").length).toBe(1);
    });

    it("shoulnd't render the title", function() {
      mobile.render();
      expect(mobile.$el.find(".title").length).toBe(0);
    });

  });

  describe("search overlay", function() {

    var mobile;

    beforeEach(function() {

      mobile = new cdb.geo.ui.Mobile({
        template: template,
        mapView: mapView,
        overlays: [{
            order: 3,
            type: "search",
            template: null
          }],
        torqueLayer: null,
        map: map,
        visibility_options: {
          layer_selector:false,
          legends:false,
          title: false,
          description: false,
        }
      });

    });

    it("should render the search", function() {
      mobile.render();
      expect(mobile.$el.hasClass("with-search")).toBe(true);
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

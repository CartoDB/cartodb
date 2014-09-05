describe("cdb.geo.ui.Mobile", function() {

  var mobile;

  beforeEach(function() {

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

    var map = new cdb.geo.Map();

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

  });

});

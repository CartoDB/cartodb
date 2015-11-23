var $ = require('jquery');
var _ = require('underscore');
var Template = require('cdb/core/template');
var CartoDBLayerGroupAnonymous = require('cdb/geo/map/cartodb-layer-group-anonymous');
var CartoDBLayer = require('cdb/geo/map/cartodb-layer');
var TorqueLayer = require('cdb/geo/map/torque-layer');
var Map = require('cdb/geo/map');
var Mobile = require('cdb/geo/ui/mobile');
var GoogleMapsMapView = require('cdb/geo/gmaps/gmaps-map-view');

describe('geo/ui/mobile (torque)', function() {

  var mobile, map, layerGroup, container, mapView, template, overlays, l1, l2, torque;

  beforeEach(function() {
    map = new Map();

    torque = new TorqueLayer({ type: "torque", visible: false, urlTemplate: "https://maps.nlp.nokia.com/maptiler/v2/maptile/newest/normal.day/{z}/{x}/{y}/256/png8?lg=eng&token=61YWYROufLu_f8ylE0vn0Q&app_id=qIWDkliFCtLntLma2e6O", name: "Nokia Day", className: "nokia_day", attribution: "©2012 Nokia <a href='http://here.net/services/terms' target='_blank'>Terms of use</a>", kind: "tiled", infowindow: null, id: 1226, order: 0 });

    layerGroup = new CartoDBLayerGroupAnonymous({
      attribution: 'Custom attribution'
    }, {
      layers: [
        new CartoDBLayer({
          type: 'cartodb',
          visible: false,
          options: {
            sql: "select * from european_countries_export",
            cartocss: '#layer { polygon-fill: #000; polygon-opacity: 0.8;}',
            cartocss_version : '2.0.0',
            layer_name: "european_countries_export",
            interactivity: ['created_at', 'cartodb_id']
          }
        }),
        new CartoDBLayer({
          type: 'cartodb',
          visible: false,
          options: {
            sql: "select * from jamon_countries",
            cartocss: '#layer { polygon-fill: #000; polygon-opacity: 0.8;}',
            cartocss_version : '2.0.0',
            layer_name: "jamon_countries",
            interactivity: ['description', 'cartodb_id']
          }
        }),
        new CartoDBLayer({
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
        })
      ]
    });

    map.layers.reset([layerGroup]);

    template = Template.compile('<div class="backdrop"></div>' +
      '<div class="cartodb-header">' +
      '<div class="content">' +
      '<a href="#" class="fullscreen"></a>' +
      '<a href="#" class="toggle"></a>' +
      '</div>' +
      '</div>' +
      '<div class="aside">' +
      '<div class="layer-container">' +
      '<div class="scrollpane"><ul class="layers"></ul></div>' +
      '</div>' +
      '</div>' +
      '<div class="cartodb-attribution"></div>' +
      '<a href="#" class="cartodb-attribution-button"></a>' +
      '<div class="torque"></div>'
    , 'mustache');

    container = $('<div>').css('height', '200px');

    mapView = new GoogleMapsMapView({
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

      mobile = new Mobile({
        template: template,
        mapView: mapView,
        overlays: overlays,
        torqueLayer: torque,
        map: map
      });
    });
  });

});

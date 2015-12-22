var $ = require('jquery');
var _ = require('underscore');
var Template = require('../../../../src/core/template');
var Map = require('../../../../src/geo/map');
var TorqueLayer = require('../../../../src/geo/map/torque-layer');
var CartoDBLayer = require('../../../../src/geo/map/cartodb-layer');
var CartoDBLayerGroupAnonymous = require('../../../../src/geo/map/cartodb-layer-group-anonymous');
var GoogleMapsMapView = require('../../../../src/geo/gmaps/gmaps-map-view');
var Mobile = require('../../../../src/geo/ui/mobile');

describe('geo/ui/mobile', function () {
  var map, layerGroup, container, mapView, template, overlays;

  beforeEach(function () {
    map = new Map();

    torque = new TorqueLayer({ type: 'torque', visible: false, urlTemplate: 'https://maps.nlp.nokia.com/maptiler/v2/maptile/newest/normal.day/{z}/{x}/{y}/256/png8?lg=eng&token=61YWYROufLu_f8ylE0vn0Q&app_id=qIWDkliFCtLntLma2e6O', name: 'Nokia Day', className: 'nokia_day', attribution: "©2012 Nokia <a href='http://here.net/services/terms' target='_blank'>Terms of use</a>", kind: 'tiled', infowindow: null, id: 1226, order: 0 });

    layerGroup = new CartoDBLayerGroupAnonymous({
      attribution: 'Custom attribution'
    }, {
      layers: [
        new CartoDBLayer({
          type: 'cartodb',
          visible: false,
          options: {
            sql: 'select * from european_countries_export',
            cartocss: '#layer { polygon-fill: #000; polygon-opacity: 0.8;}',
            cartocss_version: '2.0.0',
            layer_name: 'european_countries_export',
            interactivity: ['created_at', 'cartodb_id']
          }
        }),
        new CartoDBLayer({
          type: 'cartodb',
          visible: false,
          options: {
            sql: 'select * from jamon_countries',
            cartocss: '#layer { polygon-fill: #000; polygon-opacity: 0.8;}',
            cartocss_version: '2.0.0',
            layer_name: 'jamon_countries',
            interactivity: ['description', 'cartodb_id']
          }
        }),
        new CartoDBLayer({
          type: 'cartodb',
          visible: true,
          options: {
            sql: 'select * from jamon_countries',
            cartocss: '#layer { polygon-fill: #000; polygon-opacity: 0.8;}',
            cartocss_version: '2.0.0',
            layer_name: 'layer_with_legend',
            interactivity: ['description', 'cartodb_id'],
          },
          legend: {
            type: 'custom',
            title: 'Little legend',
            show_title: true,
            data: [
              { name: 'Natural Parks',  value: '#58A062' },
              { name: 'Villages',       value: '#F07971' },
              { name: 'Rivers',         value: '#54BFDE' },
              { name: 'Fields',         value: '#9BC562' },
              { name: 'Caves',          value: '#FABB5C' }
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
      type: 'zoom',
      url: null
    });

    overlays.push({
      options: {
        extra: {
          description: null,
          title: 'Hello!',
          show_title: true,
          show_description: false
        },
      },
      order: 1,
      shareable: false,
      type: 'header',
      url: null
    });
  });

  describe('with legends, with layer selector, without search', function () {
    var mobile;

    beforeEach(function () {
      mobile = new Mobile({
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

    it('should render properly', function () {
      mobile.render();
      expect(mobile.$el.find('.aside').length).toBe(1);
    });

    it('should render the title', function () {
      mobile.render();
      expect(mobile.$el.find('.title').text()).toBe('Hello!');
    });

    it("shouldn't render the description", function () {
      mobile.render();
      expect(mobile.$el.find('.description').length).toBe(0);
    });

    it('should render the layers', function () {
      mobile.render();
      expect(mobile.$el.hasClass('with-layers')).toBe(true);
      expect(mobile.$el.find('.layer-container > h3').text()).toBe('3 layers');
      expect(mobile.$el.find('.layers > li').length).toBe(3);

      // There's one layer with legend
      expect(mobile.$el.find('.layers > li:nth-child(3) .cartodb-legend').length).toBe(1);

      expect(mobile.$el.find('.layers > li:nth-child(1) h3').text()).toBe('european_countries_exp&hellip;');
      expect(mobile.$el.find('.layers > li:nth-child(2) h3').text()).toBe('jamon_countries');
      expect(mobile.$el.find('.layers > li:nth-child(3) h3').text()).toBe('layer_with_legend');
    });

    it("shouldn't render the search", function () {
      mobile.render();
      expect(mobile.$el.hasClass('with-search')).toBe(false);
      expect(mobile.$el.find('.cartodb-searchbox').length).toBe(0);
    });

    it('should show the zoom', function () {
      mobile.render();
      expect(mobile.$el.find('.CDB-Zoom').length).toBe(1);
    });

    it('should show the toggle button', function () {
      mobile.render();
      expect(mobile.$el.find('.cartodb-header .content .toggle').length).toBe(1);
    });

    it('should render the legend', function () {
      mobile.render();
      expect(mobile.$el.find('.layers .cartodb-mobile-layer.has-legend .cartodb-legend .legend-title').text()).toBe('Little legend');
      expect(mobile.$el.find('.layers .cartodb-mobile-layer.has-legend').length).toBe(1);
    });

  });

  describe('without layer_selector, without legends, without search', function () {
    var mobile;

    beforeEach(function () {
      mobile = new Mobile({
        template: template,
        mapView: mapView,
        overlays: overlays,
        torqueLayer: null,
        map: map,
        visibility_options: {
          search: false,
          legends: false,
          layer_selector: false
        }
      });

    });

    it('should render properly', function () {
      mobile.render();
      expect(mobile.$el.find('.aside').length).toBe(1);
    });

    it('should render the title', function () {
      mobile.render();
      expect(mobile.$el.find('.title').text()).toBe('Hello!');
    });

    it('should set the right classes', function () {
      mobile.render();
      expect(mobile.$el.hasClass('with-header')).toBe(true);
      expect(mobile.$el.hasClass('with-layers')).toBe(false);
      expect(mobile.$el.hasClass('with-search')).toBe(false);
    });

    it("shouldn't render the layers", function () {
      mobile.render();
      expect(mobile.$el.find('.layers > li').length).toBe(0);
    });

    it('should show the zoom', function () {
      mobile.render();
      expect(mobile.$el.find('.CDB-Zoom').length).toBe(1);
    });

    it("shouldn't render the legend", function () {
      mobile.render();
      expect(mobile.$el.find('.layers .cartodb-mobile-layer.has-legend').length).toBe(0);
    });

  });

  describe('with legends, without layer selector, without search', function () {
    var mobile;

    beforeEach(function () {
      mobile = new Mobile({
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

    it('should render properly', function () {
      mobile.render();
      expect(mobile.$el.find('.aside').length).toBe(1);
    });

    it('should render the title', function () {
      mobile.render();
      expect(mobile.$el.find('.title').text()).toBe('Hello!');
    });

    it('should render only the layers with legends', function () {
      mobile.render();
      expect(mobile.$el.hasClass('with-layers')).toBe(true);
      expect(mobile.$el.find('.layers > li h3').length).toBe(0); // don't show titles
      expect(mobile.$el.find('.layers > li').length).toBe(1);
      expect(mobile.$el.find('.layer-container h3').text()).toBe('1 layer');
    });

    it("shouldn't render the search", function () {
      mobile.render();
      expect(mobile.$el.hasClass('with-search')).toBe(false);
      expect(mobile.$el.find('.cartodb-searchbox').length).toBe(0);
    });

    it('should show the zoom', function () {
      mobile.render();
      expect(mobile.$el.find('.CDB-Zoom').length).toBe(1);
    });

    it('should show the toggle button', function () {
      mobile.render();
      expect(mobile.$el.find('.cartodb-header .content .toggle').length).toBe(1);
    });

    it('should render the legend', function () {
      mobile.render();
      expect(mobile.$el.find('.layers .cartodb-mobile-layer.has-legend .cartodb-legend .legend-title').text()).toBe('Little legend');
      expect(mobile.$el.find('.layers .cartodb-mobile-layer.has-legend').length).toBe(1);
    });

  });

  describe('with layer_selector, without legends, without search', function () {
    var mobile;

    beforeEach(function () {
      mobile = new Mobile({
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

    it('should render properly', function () {
      mobile.render();
      expect(mobile.$el.find('.aside').length).toBe(1);
    });

    it('should render the title', function () {
      mobile.render();
      expect(mobile.$el.find('.title').text()).toBe('Hello!');
    });

    it("shouldn't render the search", function () {
      mobile.render();
      expect(mobile.$el.hasClass('with-search')).toBe(false);
    });

    it('should render the layers', function () {
      mobile.render();
      expect(mobile.$el.hasClass('with-header')).toBe(true);
      expect(mobile.$el.hasClass('with-layers')).toBe(true);
      expect(mobile.$el.find('.layers > li').length).toBe(3);
      expect(mobile.$el.find('.layers > li:first-child').hasClass('has-toggle')).toBe(true);
    });

    it("shouldn't render the legend", function () {
      mobile.render();
      expect(mobile.$el.find('.layers .cartodb-mobile-layer.has-legend').length).toBe(0);
    });

    it('should show the zoom', function () {
      mobile.render();
      expect(mobile.$el.find('.CDB-Zoom').length).toBe(1);
    });

  });

  describe('with search, without layer_selector, without legends', function () {
    var mobile;

    beforeEach(function () {
      mobile = new Mobile({
        template: template,
        mapView: mapView,
        overlays: overlays,
        torqueLayer: null,
        map: map,
        visibility_options: {
          search: true,
          legends: false,
          layer_selector: false
        }
      });

    });

    it('should render properly', function () {
      mobile.render();
      expect(mobile.$el.find('.aside').length).toBe(1);
    });

    it('should render the title', function () {
      mobile.render();
      expect(mobile.$el.find('.title').text()).toBe('Hello!');
    });

    it('should render the search', function () {
      mobile.render();
      expect(mobile.$el.hasClass('with-search')).toBe(true);
    });

    it("shouldn't render the layers", function () {
      mobile.render();
      expect(mobile.$el.hasClass('with-header')).toBe(true);
      expect(mobile.$el.hasClass('with-layers')).toBe(false);
      expect(mobile.$el.find('.layers > li').length).toBe(0);
    });

    it('should show the zoom', function () {
      mobile.render();
      expect(mobile.$el.find('.CDB-Zoom').length).toBe(1);
    });

    it("shouldn't render the legend", function () {
      mobile.render();
      expect(mobile.$el.find('.layers .cartodb-mobile-layer.has-legend').length).toBe(0);
    });

  });

  describe('without anything', function () {
    var mobile;

    beforeEach(function () {
      mobile = new Mobile({
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

    it('should render properly', function () {
      mobile.render();
      expect(mobile.$el.find('.aside').length).toBe(1);
    });

    it("shouldn't render the title", function () {
      mobile.render();
      expect(mobile.$el.find('.title').text()).toBe('');
    });

    it('should set the right classes', function () {
      mobile.render();
      expect(mobile.$el.hasClass('with-header')).toBe(false);
      expect(mobile.$el.hasClass('with-layers')).toBe(false);
      expect(mobile.$el.hasClass('with-search')).toBe(false);
    });

    it("shouldn't render the layers", function () {
      mobile.render();
      expect(mobile.$el.hasClass('with-layers')).toBe(false);
      expect(mobile.$el.find('.layers > li').length).toBe(0);
    });

    it("shouldn't show the zoom", function () {
      mobile.render();
      expect(mobile.$el.find('.CDB-Zoom').length).toBe(0);
    });

    it("shouldn't render the legend", function () {
      mobile.render();
      expect(mobile.$el.find('.layers .cartodb-mobile-layer.has-legend').length).toBe(0);
    });
  });

  describe('with some disabled layers', function () {
    var mobile, layerGroup2;

    beforeEach(function () {
      layerGroup = new CartoDBLayerGroupAnonymous({
        attribution: 'Custom attribution'
      }, {
        layers: [
          new CartoDBLayer({
            type: 'cartodb',
            visible: true,
            options: {
              sql: 'select * from european_countries_export',
              cartocss: '#layer { polygon-fill: #000; polygon-opacity: 0.8;}',
              cartocss_version: '2.0.0',
              layer_name: 'european_countries_export',
              interactivity: ['created_at', 'cartodb_id']
            }
          }),
          new CartoDBLayer({
            type: 'cartodb',
            visible: true,
            options: {
              sql: 'select * from jamon_countries',
              cartocss: '#layer { polygon-fill: #000; polygon-opacity: 0.8;}',
              cartocss_version: '2.0.0',
              layer_name: 'jamon_countries',
              interactivity: ['description', 'cartodb_id']
            }
          }),
          new CartoDBLayer({
            type: 'cartodb',
            visible: false,
            options: {
              sql: 'select * from jamon_countries',
              cartocss: '#layer { polygon-fill: #000; polygon-opacity: 0.8;}',
              cartocss_version: '2.0.0',
              layer_name: 'layer_with_legend',
              interactivity: ['description', 'cartodb_id'],
            },
            legend: {
              type: 'custom',
              title: 'Little legend',
              show_title: true,
              data: [
                { name: 'Natural Parks',  value: '#58A062' },
                { name: 'Villages',       value: '#F07971' },
                { name: 'Rivers',         value: '#54BFDE' },
                { name: 'Fields',         value: '#9BC562' },
                { name: 'Caves',          value: '#FABB5C' }
              ]
            }
          })
        ]
      });

      map.layers.reset([layerGroup]);

      mapView = new GoogleMapsMapView({
        el: container,
        map: map
      });

      mobile = new Mobile({
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

    it('should render properly', function () {
      mobile.render();
      expect(mobile.$el.find('.aside').length).toBe(1);
    });

    it('should render the title', function () {
      mobile.render();
      expect(mobile.$el.find('.title').text()).toBe('Hello!');
    });

    it('should render the layers', function () {
      mobile.render();
      expect(mobile.$el.hasClass('with-layers')).toBe(true);
      expect(mobile.$el.find('.layer-container > h3').text()).toBe('3 layers');
      expect(mobile.$el.find('.layers > li').length).toBe(3);

      // There's one hidden layer
      expect(mobile.$el.find('.layers > li:nth-child(3)').hasClass('hidden')).toBe(true);

      expect(mobile.$el.find('.layers > li:nth-child(1) h3').text()).toBe('european_countries_exp&hellip;');
      expect(mobile.$el.find('.layers > li:nth-child(2) h3').text()).toBe('jamon_countries');
      expect(mobile.$el.find('.layers > li:nth-child(3) h3').text()).toBe('layer_with_legend');
    });

    it("shouldn't render the search", function () {
      mobile.render();
      expect(mobile.$el.hasClass('with-search')).toBe(false);
      expect(mobile.$el.find('.cartodb-searchbox').length).toBe(0);
    });

    it('should show the zoom', function () {
      mobile.render();
      expect(mobile.$el.find('.CDB-Zoom').length).toBe(1);
    });

    it('should show the toggle button', function () {
      mobile.render();
      expect(mobile.$el.find('.cartodb-header .content .toggle').length).toBe(1);
    });

    it('should render the legend', function () {
      mobile.render();
      expect(mobile.$el.find('.layers .cartodb-mobile-layer.has-legend .cartodb-legend .legend-title').text()).toBe('Little legend');
      expect(mobile.$el.find('.layers .cartodb-mobile-layer.has-legend').length).toBe(1);
    });

  });

  describe('disabling the title and the description', function () {
    var mobile;

    beforeEach(function () {
      mobile = new Mobile({
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

    it('should render properly', function () {
      mobile.render();
      expect(mobile.$el.find('.aside').length).toBe(1);
    });

    it("shoulnd't render the title", function () {
      mobile.render();
      expect(mobile.$el.find('.title').length).toBe(0);
    });

  });

  describe('search overlay', function () {
    var mobile;

    beforeEach(function () {
      mobile = new Mobile({
        template: template,
        mapView: mapView,
        overlays: [{
          order: 3,
          type: 'search',
          template: null
        }],
        torqueLayer: null,
        map: map,
        visibility_options: {
          layer_selector: false,
          legends: false,
          title: false,
          description: false,
        }
      });

    });

    it('should render the search', function () {
      mobile.render();
      expect(mobile.$el.hasClass('with-search')).toBe(true);
    });

  });

});

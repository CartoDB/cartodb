var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var View = require('../../../src/core/view');

// required due to implicit dependency in vis --> map-view
var cdb = require('cdb');
_.extend(cdb.geo, require('../../../src/geo/leaflet'));
_.extend(cdb.geo, require('../../../src/geo/gmaps'));

var Overlay = require('../../../src/vis/vis/overlay');
var Vis = require('../../../src/vis/vis');
var VizJSON = require('../../../src/api/vizjson');

require('../../../src/vis/overlays'); // Overlay.register calls
require('../../../src/vis/layers'); // Layers.register calls

describe('vis/vis', function () {
  beforeEach(function () {
    this.container = $('<div>').css('height', '200px');
    this.mapConfig = {
      updated_at: 'cachebuster',
      title: 'irrelevant',
      description: 'not so irrelevant',
      url: 'http://cartodb.com',
      center: [40.044, -101.95],
      zoom: 4,
      bounds: [
        [1, 2],
        [3, 4]
      ],
      user: {
        fullname: 'Chuck Norris',
        avatar_url: 'http://example.com/avatar.jpg'
      },
      datasource: {
        user_name: 'wadus',
        maps_api_template: 'https://{user}.example.com:443',
        stat_tag: 'ece6faac-7271-11e5-a85f-04013fc66a01',
        force_cors: true // This is sometimes set in the editor
      }
    };

    this.createNewVis = function (attrs) {
      attrs.widgets = new Backbone.Collection();
      this.vis = new Vis(attrs);
      return this.vis;
    };
    this.createNewVis({
      el: this.container
    });
    this.vis.load(new VizJSON(this.mapConfig));
  });

  afterEach(function () {
    jasmine.clock().uninstall();
  });

  it('should not invalidate map if map height is 0', function (done) {
    jasmine.clock().install();
    var container = $('<div>').css('height', '0');
    var vis = this.createNewVis({el: container});
    this.mapConfig.map_provider = 'googlemaps';

    vis.load(new VizJSON(this.mapConfig));

    setTimeout(function () {
      spyOn(vis.mapView, 'invalidateSize');
      expect(vis.mapView.invalidateSize).not.toHaveBeenCalled();
      done();
    }, 4000);
    jasmine.clock().tick(4000);
  });

  it('should bind resize changes when map height is 0', function () {
    var container = $('<div>').css('height', '0');
    var vis = this.createNewVis({el: container});
    spyOn(vis, '_onResize');

    this.mapConfig.map_provider = 'googlemaps';
    vis.load(new VizJSON(this.mapConfig));
    $(window).trigger('resize');
    expect(vis._onResize).toHaveBeenCalled();
  });

  it("shouldn't bind resize changes when map height is greater than 0", function () {
    var container = $('<div>').css('height', '200px');
    var vis = this.createNewVis({el: container});
    spyOn(vis, '_onResize');

    this.mapConfig.map_provider = 'googlemaps';
    vis.load(new VizJSON(this.mapConfig));
    $(window).trigger('resize');
    expect(vis._onResize).not.toHaveBeenCalled();
    expect(vis.center).not.toBeDefined();
  });

  it('should pass map to overlays', function () {
    var _map;
    Overlay.register('jaja', function (data, vis) {
      _map = vis.map;
      return new View();
    });
    var vis = this.createNewVis({el: this.container});
    this.mapConfig.overlays = [ {type: 'jaja'}];
    vis.load(new VizJSON(this.mapConfig));
    expect(_map).not.toEqual(undefined);
  });

  it('when https is false all the urls should be transformed to http', function () {
    this.vis.https = false;
    this.mapConfig.layers = [{
      type: 'tiled',
      options: {
        urlTemplate: 'https://dnv9my2eseobd.cloudfront.net/v3/{z}/{x}/{y}.png'
      }
    }];
    this.vis.load(new VizJSON(this.mapConfig));
    expect(this.vis.map.layers.at(0).get('urlTemplate')).toEqual(
      'http://a.tiles.mapbox.com/v3/{z}/{x}/{y}.png'
    );
  });

  it('should return the native map obj', function () {
    expect(this.vis.getNativeMap()).toEqual(this.vis.mapView._leafletMap);
  });

  it('should create a google maps map when provider is google maps', function () {
    this.mapConfig.map_provider = 'googlemaps';
    this.vis.load(new VizJSON(this.mapConfig));
    expect(this.vis.mapView._gmapsMap).not.toEqual(undefined);
  });

  describe('.centerMapToOrigin', function () {
    it('should invalidate map size', function () {
      spyOn(this.vis.mapView, 'invalidateSize');
      this.vis.centerMapToOrigin();
      expect(this.vis.mapView.invalidateSize).toHaveBeenCalled();
    });

    it('should re-center the map', function () {
      spyOn(this.vis.map, 'reCenter');
      this.vis.centerMapToOrigin();
      expect(this.vis.map.reCenter).toHaveBeenCalled();
    });
  });

  describe('dragging option', function () {
    beforeEach(function () {
      this.mapConfig = {
        updated_at: 'cachebuster',
        title: 'irrelevant',
        description: 'not so irrelevant',
        url: 'http://cartodb.com',
        center: [40.044, -101.95],
        zoom: 4,
        bounds: [[1, 2], [3, 4]],
        scrollwheel: true,
        overlays: [],
        user: {
          fullname: 'Chuck Norris',
          avatar_url: 'http://example.com/avatar.jpg'
        },
        datasource: {
          user_name: 'wadus',
          maps_api_template: 'https://{user}.example.com:443',
          stat_tag: 'ece6faac-7271-11e5-a85f-04013fc66a01',
          force_cors: true // This is sometimes set in the editor
        }
      };
    });

    it('should be enabled with zoom overlay and scrollwheel enabled', function () {
      var container = $('<div>').css('height', '200px');
      var vis = this.createNewVis({el: container});

      this.mapConfig.overlays = [
        {
          type: 'zoom',
          order: 6,
          options: {
            x: 20,
            y: 20,
            display: true
          },
          template: ''
        }
      ];

      vis.load(new VizJSON(this.mapConfig));
      expect(vis.map.get('drag')).toBeTruthy();
    });

    it('should be enabled with zoom overlay and scrollwheel disabled', function () {
      var container = $('<div>').css('height', '200px');
      var vis = this.createNewVis({el: container});

      this.mapConfig.overlays = [
        {
          type: 'zoom',
          order: 6,
          options: {
            x: 20,
            y: 20,
            display: true
          },
          template: ''
        }
      ];

      vis.load(new VizJSON(this.mapConfig));
      expect(vis.map.get('drag')).toBeTruthy();
    });

    it('should be enabled without zoom overlay and scrollwheel enabled', function () {
      var container = $('<div>').css('height', '200px');
      var vis = this.createNewVis({el: container});

      this.mapConfig.scrollwheel = true;

      vis.load(new VizJSON(this.mapConfig));
      expect(vis.map.get('drag')).toBeTruthy();
    });

    it('should be disabled without zoom overlay and scrollwheel disabled', function () {
      var container = $('<div>').css('height', '200px');
      var vis = this.createNewVis({el: container});

      this.mapConfig.scrollwheel = false;

      vis.load(new VizJSON(this.mapConfig));
      expect(vis.map.get('drag')).toBeFalsy();
    });
  });

  describe('api', function () {
    it ('should respond to getLayers', function() {
      this.mapConfig.layers = [{
        type: 'tiled',
        options: {
          urlTemplate: 'https://dnv9my2eseobd.cloudfront.net/v3/{z}/{x}/{y}.png'
        }
      }];
      this.vis.load(new VizJSON(this.mapConfig));
      expect(vis.getLayers().length).toBe(1);
    })
    it ('should respond to getLayerViews', function() {
      this.mapConfig.layers = [{
        type: 'tiled',
        options: {
          urlTemplate: 'https://dnv9my2eseobd.cloudfront.net/v3/{z}/{x}/{y}.png'
        }
      }];
      this.vis.load(new VizJSON(this.mapConfig));
      expect(vis.getLayerViews().length).toBe(1);
    })
  });

  describe('Legends', function () {
    it('should only display legends for visible layers', function () {
      this.mapConfig.layers = [
        {
          type: 'tiled',
          legend: {
            type: 'custom',
            show_title: false,
            title: '',
            template: '',
            items: [
              {
                name: 'visible legend item',
                visible: true,
                value: '#cccccc',
                sync: true
              }
            ]
          },
          options: {
            urlTemplate: 'https://dnv9my2eseobd.cloudfront.net/v3/{z}/{x}/{y}.png'
          }
        },
        {
          visible: false,
          type: 'tiled',
          legend: {
            type: 'custom',
            show_title: false,
            title: '',
            template: '',
            items: [
              {
                name: 'invisible legend item',
                visible: true,
                value: '#cccccc',
                sync: true
              }
            ]
          },
          options: {
            urlTemplate: 'https://dnv9my2eseobd.cloudfront.net/v3/{z}/{x}/{y}.png'
          }
        }
      ];
      this.vis.load(new VizJSON(this.mapConfig));

      expect(this.vis.legends.$('.cartodb-legend').length).toEqual(1);
      expect(this.vis.legends.$el.html()).toContain('visible legend item');
      expect(this.vis.legends.$el.html()).not.toContain('invisible legend item');
    });
  });

  it('should retrieve the overlays of a given type', function () {
    Overlay.register('wadus', function (data, vis) {
      return new View();
    });

    var tooltip1 = this.vis.addOverlay({
      type: 'wadus'
    });
    var tooltip2 = this.vis.addOverlay({
      type: 'wadus'
    });
    var tooltip3 = this.vis.addOverlay({
      type: 'wadus'
    });
    var tooltips = this.vis.getOverlaysByType('wadus');
    expect(tooltips.length).toEqual(3);
    expect(tooltips[0]).toEqual(tooltip1);
    expect(tooltips[1]).toEqual(tooltip2);
    expect(tooltips[2]).toEqual(tooltip3);
    tooltip1.clean();
    tooltip2.clean();
    tooltip3.clean();
    expect(this.vis.getOverlaysByType('wadus').length).toEqual(0);
  });

  describe('addOverlay', function () {
    it('should throw an error if no layers are available', function () {
      expect(function () {
        this.vis.addOverlay({
          type: 'tooltip',
          template: 'test'
        });
      }.bind(this)).toThrow(new Error('layer is null'));
    });

    it('should add an overlay to the specified layer and enable interaction', function () {
      var FakeLayer = function () {};
      FakeLayer.prototype.setInteraction = function () {};
      _.extend(FakeLayer.prototype, Backbone.Events);

      var layer = new FakeLayer();

      var tooltip = this.vis.addOverlay({
        type: 'tooltip',
        template: 'test',
        layer: layer
      });

      expect(tooltip.options.layer).toEqual(layer);
    });

    it('should add an overlay to the first layer and enable interaction', function () {
      var vizjson = {
        layers: [
          {
            type: 'tiled',
            options: {
              urlTemplate: ''
            }
          },
          {
            type: 'layergroup',
            options: {
              user_name: 'pablo',
              maps_api_template: 'https://{user}.cartodb-staging.com:443',
              layer_definition: {
                stat_tag: 'ece6faac-7271-11e5-a85f-04013fc66a01',
                layers: [{
                  type: 'CartoDB'
                }]
              }
            }
          }
        ],
        user: {
          fullname: 'Chuck Norris',
          avatar_url: 'http://example.com/avatar.jpg'
        },
        datasource: {
          user_name: 'wadus',
          maps_api_template: 'https://{user}.example.com:443',
          stat_tag: 'ece6faac-7271-11e5-a85f-04013fc66a01',
          force_cors: true // This is sometimes set in the editor
        }
      };

      this.vis.load(new VizJSON(vizjson));
      var tooltip = this.vis.addOverlay({
        type: 'tooltip',
        template: 'test'
      });

      var layerView = this.vis.getLayerViews()[1];

      expect(tooltip.options.layer).toEqual(layerView);
    });
  });
});

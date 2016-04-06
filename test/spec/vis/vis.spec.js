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
    this.vis.load(this.mapConfig);
  });

  afterEach(function () {
    jasmine.clock().uninstall();
  });

  describe('public API', function () {
    describe('dataviews factory', function () {
      it('should be defined', function () {
        expect(this.vis.dataviews).toBeDefined();
      });

      it('should have an api_key when using an api_key option', function () {
        this.vis.load(this.mapConfig, {
          apiKey: 'API_KEY'
        });

        expect(this.vis.dataviews.get('apiKey')).toEqual('API_KEY');
      });
    });

    describe('analyses factory', function () {
      it('should be defined', function () {
        expect(this.vis.analysis).toBeDefined();
      });
    });
  });

  it('should insert default max and minZoom values when not provided', function () {
    expect(this.vis.mapView._leafletMap.options.maxZoom).toEqual(20);
    expect(this.vis.mapView._leafletMap.options.minZoom).toEqual(0);
  });

  it('should insert user max and minZoom values when provided', function () {
    this.container = $('<div>').css('height', '200px');
    this.mapConfig.maxZoom = 10;
    this.mapConfig.minZoom = 5;
    this.vis.load(this.mapConfig);

    expect(this.vis.mapView._leafletMap.options.maxZoom).toEqual(10);
    expect(this.vis.mapView._leafletMap.options.minZoom).toEqual(5);
  });

  it('should parse center if values are correct', function () {
    this.container = $('<div>').css('height', '200px');
    var opts = {
      center_lat: 43.3,
      center_lon: '89'
    };
    this.vis.load(this.mapConfig, opts);

    expect(this.vis.map.get('center')).toEqual([43.3, 89.0]);
  });

  it('should not parse center if values are not correct', function () {
    this.container = $('<div>').css('height', '200px');
    var opts = {
      center_lat: 43.3,
      center_lon: 'ham'
    };
    this.vis.load(this.mapConfig, opts);

    expect(this.vis.map.get('center')).toEqual([40.044, -101.95]);
  });

  it('should parse bounds values if they are correct', function () {
    this.container = $('<div>').css('height', '200px');
    var opts = {
      sw_lat: 43.3,
      sw_lon: 12,
      ne_lat: 12,
      ne_lon: '0'
    };
    this.vis.load(this.mapConfig, opts);

    expect(this.vis.map.get('view_bounds_sw')).toEqual([43.3, 12]);
    expect(this.vis.map.get('view_bounds_ne')).toEqual([12, 0]);
  });

  it('should not parse bounds values if they are not correct', function () {
    this.container = $('<div>').css('height', '200px');
    var opts = {
      sw_lat: 43.3,
      sw_lon: 12,
      ne_lat: 'jamon',
      ne_lon: '0'
    };
    this.vis.load(this.mapConfig, opts);

    expect(this.vis.map.get('view_bounds_sw')).toEqual([1, 2]);
    expect(this.vis.map.get('view_bounds_ne')).toEqual([3, 4]);
  });

  it('should create a google maps map when provider is google maps', function () {
    this.container = $('<div>').css('height', '200px');
    this.mapConfig.map_provider = 'googlemaps';
    this.vis.load(this.mapConfig);
    expect(this.vis.mapView._gmapsMap).not.toEqual(undefined);
  });

  it('should not invalidate map if map height is 0', function (done) {
    jasmine.clock().install();
    var container = $('<div>').css('height', '0');
    var vis = this.createNewVis({el: container});
    this.mapConfig.map_provider = 'googlemaps';

    vis.load(this.mapConfig);

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
    vis.load(this.mapConfig);
    $(window).trigger('resize');
    expect(vis._onResize).toHaveBeenCalled();
  });

  it("shouldn't bind resize changes when map height is greater than 0", function () {
    var container = $('<div>').css('height', '200px');
    var vis = this.createNewVis({el: container});
    spyOn(vis, '_onResize');

    this.mapConfig.map_provider = 'googlemaps';
    vis.load(this.mapConfig);
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
    vis.load(this.mapConfig);
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
    this.vis.load(this.mapConfig);
    expect(this.vis.map.layers.at(0).get('urlTemplate')).toEqual(
      'http://a.tiles.mapbox.com/v3/{z}/{x}/{y}.png'
    );
  });

  it('should return the native map obj', function () {
    expect(this.vis.getNativeMap()).toEqual(this.vis.mapView._leafletMap);
  });

  it('load should call done', function (done) {
    jasmine.clock().install();

    this.mapConfig.layers = [{
      type: 'tiled',
      options: {
        urlTemplate: 'https://dnv9my2eseobd.cloudfront.net/v3/{z}/{x}/{y}.png'
      }
    }];
    layers = null;

    this.vis.load(this.mapConfig, { }).done(function (vis, lys) {  layers = lys;});

    setTimeout(function () {
      expect(layers.length).toEqual(1);
      done();
    }, 100);

    jasmine.clock().tick(1000);
  });

  it('should add header', function () {
    this.mapConfig.title = 'title';

    this.vis.load(this.mapConfig, {
      title: true
    });
    expect(this.vis.$('.cartodb-header').length).toEqual(1);
  });

  it('should add layer selector', function () {
    this.vis.load(this.mapConfig, {
      title: true,
      layer_selector: true
    });
    expect(this.vis.$('.cartodb-layer-selector-box').length).toEqual(1);
  });

  it('should add header without link in the title', function () {
    var mapConfig = _.clone(this.mapConfig);
    mapConfig.title = 'title';
    mapConfig.url = null;

    this.vis.load(mapConfig, {
      title: true
    });

    expect(this.vis.$('.cartodb-header').length).toEqual(1);
    expect(this.vis.$('.cartodb-header h1 > a').length).toEqual(0);
  });

  it('should add zoom', function () {
    this.mapConfig.overlays = [{ type: 'zoom', order: 7, options: { x: 20, y: 20 }, template: 'test' }];
    this.vis.load(this.mapConfig);
    expect(this.vis.$('.CDB-Zoom').length).toEqual(1);
  });

  it("should enable zoom if it's specified by zoomControl option", function () {
    this.mapConfig.overlays = [{ type: 'zoom', order: 7, options: { x: 20, y: 20 }, template: 'test' }];
    this.vis.load(this.mapConfig, {
      zoomControl: true
    });
    expect(this.vis.$('.CDB-Zoom').length).toEqual(1);
  });

  it("should disable zoom if it's specified by zoomControl option", function () {
    this.mapConfig.overlays = [{ type: 'zoom', order: 7, options: { x: 20, y: 20 }, template: 'test' }];
    this.vis.load(this.mapConfig, {
      zoomControl: false
    });
    expect(this.vis.$('.CDB-Zoom').length).toEqual(0);
  });

  it('should add search', function () {
    this.mapConfig.overlays = [{ type: 'search' }];
    this.vis.load(this.mapConfig);
    expect(this.vis.$('.CDB-Search').length).toEqual(1);
  });

  it("should enable search if it's specified by searchControl", function () {
    this.mapConfig.overlays = [{ type: 'search' }];
    this.vis.load(this.mapConfig, {
      searchControl: true
    });
    expect(this.vis.$('.CDB-Search').length).toEqual(1);
  });

  it("should disable search if it's specified by searchControl", function () {
    this.mapConfig.overlays = [{ type: 'search' }];
    this.vis.load(this.mapConfig, {
      searchControl: false
    });
    expect(this.vis.$('.CDB-Search').length).toEqual(0);
  });

  it('should use zoom', function () {
    this.vis.load(this.mapConfig, {
      zoom: 10,
      bounds: [[24.206889622398023, -84.0234375], [76.9206135182968, 169.1015625]]
    });
    expect(this.vis.map.getZoom()).toEqual(10);
  });

  it('should force GMaps', function () {
    this.mapConfig.map_provider = 'leaflet';
    this.mapConfig.layers = [{
      type: 'tiled',
      options: {
        urlTemplate: 'https://dnv9my2eseobd.cloudfront.net/v3/{z}/{x}/{y}.png'
      }
    }];

    var opts = {
      gmaps_base_type: 'dark_roadmap'
    };

    layers = null;

    this.vis.load(this.mapConfig, opts);
    expect(this.vis.map.layers.at(0).get('type')).toEqual('GMapsBase');
  });

  describe('.instantiateMap', function () {
    beforeEach(function () {
      spyOn(this.vis, 'instantiateMap').and.callThrough();
      this.doneCallback = jasmine.createSpy('done trigger');
      this.vis.bind('done', this.doneCallback, this);
      jasmine.clock().install();
    });

    describe('do not skip instantiation', function () {
      beforeEach(function () {
        this.vis.load(this.mapConfig);
      });

      it('should instantiate map', function () {
        expect(this.vis.instantiateMap).toHaveBeenCalled();
      });

      it('should trigger done callback if skip is true', function () {
        jasmine.clock().tick(100);
        expect(this.doneCallback).toHaveBeenCalled();
      });
    });

    describe('skip instantiation', function () {
      beforeEach(function () {
        this.vis.load(this.mapConfig, {
          skipMapInstantiation: true
        });
      });

      it('should not instantiate map', function () {
        expect(this.vis.instantiateMap).not.toHaveBeenCalled();
      });

      it('should not trigger done callback if skip is true', function () {
        jasmine.clock().tick(100);
        expect(this.doneCallback).not.toHaveBeenCalled();
      });
    });

    afterEach(function () {
      jasmine.clock().uninstall();
    });
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

      vis.load(this.mapConfig);
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

      vis.load(this.mapConfig);
      expect(vis.map.get('drag')).toBeTruthy();
    });

    it('should be enabled without zoom overlay and scrollwheel enabled', function () {
      var container = $('<div>').css('height', '200px');
      var vis = this.createNewVis({el: container});

      this.mapConfig.scrollwheel = true;

      vis.load(this.mapConfig);
      expect(vis.map.get('drag')).toBeTruthy();
    });

    it('should be disabled without zoom overlay and scrollwheel disabled', function () {
      var container = $('<div>').css('height', '200px');
      var vis = this.createNewVis({el: container});

      this.mapConfig.scrollwheel = false;

      vis.load(this.mapConfig);
      expect(vis.map.get('drag')).toBeFalsy();
    });
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
      this.vis.load(this.mapConfig);

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

  it('should initialize existing analyses', function () {
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
                type: 'CartoDB',
                options: {
                  source: 'a0'
                }

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
      },
      analyses: [
        {
          id: 'a1',
          type: 'buffer',
          params: {
            source: {
              id: 'a0',
              type: 'source',
              params: {
                'query': 'SELECT * FROM airbnb_listings'
              }
            },
            radio: 300
          }
        }
      ]
    };

    this.vis.load(vizjson);

    // Analyses have been indexed
    expect(this.vis._analysisCollection.size()).toEqual(2);

    var a1 = this.vis.analysis.findNodeById('a1');
    var a0 = this.vis.analysis.findNodeById('a0');

    // Analysis graph has been created correctly
    expect(a1.get('source')).toEqual(a0);
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

      this.vis.load(vizjson);
      var tooltip = this.vis.addOverlay({
        type: 'tooltip',
        template: 'test'
      });

      var layerView = this.vis.getLayers()[1];

      expect(tooltip.options.layer).toEqual(layerView);
    });
  });
});

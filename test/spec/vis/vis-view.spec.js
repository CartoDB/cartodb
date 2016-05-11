var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var View = require('../../../src/core/view');

// required due to implicit dependency in vis --> map-view
var cdb = require('cdb');
_.extend(cdb.geo, require('../../../src/geo/leaflet'));
_.extend(cdb.geo, require('../../../src/geo/gmaps'));

var Overlay = require('../../../src/vis/vis/overlay');
var VisView = require('../../../src/vis/vis-view');
var VizJSON = require('../../../src/api/vizjson');

require('../../../src/vis/overlays'); // Overlay.register calls
require('../../../src/vis/layers'); // Layers.register calls

describe('vis/vis-view', function () {
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

    this.vis = new Backbone.Model();
    this.vis.trackLoadingObject = jasmine.createSpy();
    this.vis.untrackLoadingObject = jasmine.createSpy();
    this.vis.clearLoadingObjects = jasmine.createSpy();

    this.createNewVis = function (attrs) {
      attrs.widgets = new Backbone.Collection();
      attrs.model = this.vis;
      this.visView = new VisView(attrs);
      return this.visView;
    };
    this.createNewVis({
      el: this.container
    });
    this.visView.load(new VizJSON(this.mapConfig));
  });

  afterEach(function () {
    jasmine.clock().uninstall();
  });

  describe('public API', function () {
    describe('dataviews factory', function () {
      it('should be defined', function () {
        expect(this.visView.dataviews).toBeDefined();
      });

      it('should have an api_key when using an api_key option', function () {
        this.visView.load(new VizJSON(this.mapConfig), {
          apiKey: 'API_KEY'
        });

        expect(this.visView.dataviews.get('apiKey')).toEqual('API_KEY');
      });
    });

    describe('analyses factory', function () {
      it('should be defined', function () {
        expect(this.visView.analysis).toBeDefined();
      });
    });
  });

  it('should insert default max and minZoom values when not provided', function () {
    expect(this.visView.mapView._leafletMap.options.maxZoom).toEqual(20);
    expect(this.visView.mapView._leafletMap.options.minZoom).toEqual(0);
  });

  it('should insert user max and minZoom values when provided', function () {
    this.container = $('<div>').css('height', '200px');
    this.mapConfig.maxZoom = 10;
    this.mapConfig.minZoom = 5;
    this.visView.load(new VizJSON(this.mapConfig));

    expect(this.visView.mapView._leafletMap.options.maxZoom).toEqual(10);
    expect(this.visView.mapView._leafletMap.options.minZoom).toEqual(5);
  });

  it('should create a google maps map when provider is google maps', function () {
    this.container = $('<div>').css('height', '200px');
    this.mapConfig.map_provider = 'googlemaps';
    this.visView.load(new VizJSON(this.mapConfig));
    expect(this.visView.mapView._gmapsMap).not.toEqual(undefined);
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
    this.mapConfig.map_provider = 'googlemaps';
    vis.load(new VizJSON(this.mapConfig));
    spyOn(vis, '_onResize');

    $(window).trigger('resize');

    expect(vis._onResize).toHaveBeenCalled();
  });

  it("shouldn't bind resize changes when map height is greater than 0", function () {
    var container = $('<div>').css('height', '200px');
    var vis = this.createNewVis({el: container});
    this.mapConfig.map_provider = 'googlemaps';
    vis.load(new VizJSON(this.mapConfig));
    spyOn(vis, '_onResize');

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
    this.mapConfig.overlays = [{type: 'jaja'}];
    vis.load(new VizJSON(this.mapConfig));
    expect(_map).not.toEqual(undefined);
  });

  it('when https is false all the urls should be transformed to http', function () {
    this.visView.https = false;
    this.mapConfig.layers = [{
      type: 'tiled',
      options: {
        urlTemplate: 'https://dnv9my2eseobd.cloudfront.net/v3/{z}/{x}/{y}.png'
      }
    }];
    this.visView.load(new VizJSON(this.mapConfig));
    expect(this.visView.map.layers.at(0).get('urlTemplate')).toEqual(
      'http://a.tiles.mapbox.com/v3/{z}/{x}/{y}.png'
    );
  });

  it('should return the native map obj', function () {
    expect(this.visView.getNativeMap()).toEqual(this.visView.mapView._leafletMap);
  });

  it('should create a google maps map when provider is google maps', function () {
    this.mapConfig.map_provider = 'googlemaps';
    this.visView.load(new VizJSON(this.mapConfig));
    expect(this.visView.mapView._gmapsMap).not.toEqual(undefined);
  });

  it('should display/hide the loader when \'loading\' changes', function () {
    this.visView.addOverlay({
      type: 'loader'
    });

    this.vis.set('loading', true);

    expect(this.visView.$el.find('.CDB-Loader.is-visible').length).toEqual(1);

    this.vis.set('loading', false);

    expect(this.visView.$el.find('.CDB-Loader:not(.is-visible)').length).toEqual(1);
  });

  describe('.centerMapToOrigin', function () {
    it('should invalidate map size', function () {
      spyOn(this.visView.mapView, 'invalidateSize');
      this.visView.centerMapToOrigin();
      expect(this.visView.mapView.invalidateSize).toHaveBeenCalled();
    });

    it('should re-center the map', function () {
      spyOn(this.visView.map, 'reCenter');
      this.visView.centerMapToOrigin();
      expect(this.visView.map.reCenter).toHaveBeenCalled();
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
    it('should respond to getLayers', function () {
      this.mapConfig.layers = [{
        type: 'tiled',
        options: {
          urlTemplate: 'https://dnv9my2eseobd.cloudfront.net/v3/{z}/{x}/{y}.png'
        }
      }];
      this.visView.load(new VizJSON(this.mapConfig));
      expect(this.visView.getLayers().length).toBe(1);
    });
    it('should respond to getLayerViews', function () {
      this.mapConfig.layers = [{
        type: 'tiled',
        options: {
          urlTemplate: 'https://dnv9my2eseobd.cloudfront.net/v3/{z}/{x}/{y}.png'
        }
      }];
      this.visView.load(new VizJSON(this.mapConfig));
      expect(this.visView.getLayerViews().length).toBe(1);
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
      this.visView.load(new VizJSON(this.mapConfig));

      expect(this.visView.legends.$('.cartodb-legend').length).toEqual(1);
      expect(this.visView.legends.$el.html()).toContain('visible legend item');
      expect(this.visView.legends.$el.html()).not.toContain('invisible legend item');
    });
  });

  it('should retrieve the overlays of a given type', function () {
    Overlay.register('wadus', function (data, vis) {
      return new View();
    });

    var tooltip1 = this.visView.addOverlay({
      type: 'wadus'
    });
    var tooltip2 = this.visView.addOverlay({
      type: 'wadus'
    });
    var tooltip3 = this.visView.addOverlay({
      type: 'wadus'
    });
    var tooltips = this.visView.getOverlaysByType('wadus');
    expect(tooltips.length).toEqual(3);
    expect(tooltips[0]).toEqual(tooltip1);
    expect(tooltips[1]).toEqual(tooltip2);
    expect(tooltips[2]).toEqual(tooltip3);
    tooltip1.clean();
    tooltip2.clean();
    tooltip3.clean();
    expect(this.visView.getOverlaysByType('wadus').length).toEqual(0);
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

    this.visView.load(new VizJSON(vizjson));

    // Analyses have been indexed
    expect(this.visView._analysisCollection.size()).toEqual(2);

    var a1 = this.visView.analysis.findNodeById('a1');
    var a0 = this.visView.analysis.findNodeById('a0');

    // Analysis graph has been created correctly
    expect(a1.get('source')).toEqual(a0);
  });

  describe('polling', function () {
    beforeEach(function () {
      spyOn(_, 'debounce').and.callFake(function (func) { return function () { func.apply(this, arguments); }; });

      this.vizjson = {
        'id': '70af2a72-0709-11e6-a834-080027880ca6',
        'version': '3.0.0',
        'title': 'Untitled Map 1',
        'likes': 0,
        'description': null,
        'scrollwheel': false,
        'legends': true,
        'map_provider': 'leaflet',
        'bounds': [
          [
            41.358088,
            2.089675
          ],
          [
            41.448257,
            2.215129
          ]
        ],
        'center': '[41.4031725,2.1524020000000004]',
        'zoom': 11,
        'updated_at': '2016-04-20T17:05:02+00:00',
        'layers': [
          {
            'type': 'layergroup',
            'options': {
              'user_name': 'cdb',
              'maps_api_template': 'http://{user}.localhost.lan:8181',
              'sql_api_template': 'http://{user}.localhost.lan:8080',
              'filter': 'mapnik',
              'layer_definition': {
                'stat_tag': '70af2a72-0709-11e6-a834-080027880ca6',
                'version': '3.0.0',
                'layers': [
                  {
                    'id': 'e0d06945-74cd-4421-8229-561c3cabc854',
                    'type': 'CartoDB',
                    'infowindow': {
                      'fields': [],
                      'template_name': 'table/views/infowindow_light',
                      'template': '<div class=\'CDB-infowindow CDB-infowindow--light js-infowindow\'>\n  <div class=\'CDB-infowindow-container\'>\n    <div class=\'CDB-infowindow-bg\'>\n      <div class=\'CDB-infowindow-inner\'>\n        <ul class=\'CDB-infowindow-list js-content\'>\n          {{#loading}}\n            <div class=\'CDB-Loader js-loader is-visible\'></div>\n          {{/loading}}\n          {{#content.fields}}\n          <li class=\'CDB-infowindow-listItem\'>\n            {{#title}}<h5 class=\'CDB-infowindow-subtitle\'>{{title}}</h5>{{/title}}\n            {{#value}}<h4 class=\'CDB-infowindow-title\'>{{{ value }}}</h4>{{/value}}\n            {{^value}}<h4 class=\'CDB-infowindow-title\'>null</h4>{{/value}}\n          </li>\n          {{/content.fields}}\n        </ul>\n      </div>\n    </div>\n    <div class=\'CDB-hook\'>\n      <div class=\'CDB-hook-inner\'></div>\n    </div>\n  </div>\n</div>\n',
                      'alternative_names': {},
                      'width': 226,
                      'maxHeight': 180
                    },
                    'tooltip': {
                      'fields': [],
                      'template_name': 'tooltip_light',
                      'template': '<div class=\'CDB-Tooltip CDB-Tooltip--isLight\'>\n  <ul class=\'CDB-Tooltip-list\'>\n    {{#fields}}\n      <li class=\'CDB-Tooltip-listItem\'>\n        {{#title}}\n          <h3 class=\'CDB-Tooltip-listTitle\'>{{{ title }}}</h3>\n        {{/title}}\n        <h4 class=\'CDB-Tooltip-listText\'>{{{ value }}}</h4>\n      </li>\n    {{/fields}}\n  </ul>\n</div>\n',
                      'alternative_names': {},
                      'maxHeight': 180
                    },
                    'legend': {
                      'type': 'none',
                      'show_title': false,
                      'title': '',
                      'template': '',
                      'visible': true
                    },
                    'order': 1,
                    'visible': true,
                    'options': {
                      'layer_name': 'arboles',
                      'cartocss': 'cartocss',
                      'cartocss_version': '2.1.1',
                      'interactivity': 'cartodb_id',
                      'source': 'a2'
                    }
                  }
                ]
              },
              'attribution': ''
            }
          }
        ],
        'overlays': [],
        'widgets': [],
        'datasource': {
          'user_name': 'cdb',
          'maps_api_template': 'http://{user}.localhost.lan:8181',
          'stat_tag': '70af2a72-0709-11e6-a834-080027880ca6'
        },
        'user': {
          'fullname': 'cdb',
          'avatar_url': '//example.com/avatars/avatar_stars_blue.png'
        },
        'analyses': [
          {
            'id': 'a2',
            'type': 'trade-area',
            'params': {
              'source': {
                'id': 'a1',
                'type': 'trade-area',
                'params': {
                  'source': {
                    'id': 'a0',
                    'type': 'source',
                    'params': {
                      'query': 'SELECT * FROM arboles'
                    }
                  },
                  'kind': 'drive',
                  'time': 10
                }
              },
              'kind': 'drive',
              'time': 10
            }
          }
        ],
        'vector': false
      };
      spyOn($, 'ajax');
    });

    it('should start polling for analyses that are not ready', function () {
      this.visView.load(new VizJSON(this.vizjson));
      this.visView.instantiateMap();

      // Response from Maps API is received
      $.ajax.calls.argsFor(0)[0].success({
        'layergroupid': '9d7bf465e45113123bf9949c2a4f0395:0',
        'metadata': {
          'layers': [
            {
              'type': 'mapnik',
              'meta': {
                'stats': [],
                'cartocss': 'cartocss'
              }
            }
          ],
          'dataviews': {
            'cd065428-ed63-4d29-9a09-a9f8384fc8c9': {
              'url': {
                'http': 'http://cdb.localhost.lan:8181/api/v1/map/9d7bf465e45113123bf9949c2a4f0395:0/dataview/cd065428-ed63-4d29-9a09-a9f8384fc8c9'
              }
            }
          },
          'analyses': [
            {
              'nodes': {
                'a0': {
                  'status': 'ready',
                  'query': 'SELECT * FROM arboles',
                  'url': {
                    'http': 'http://cdb.localhost.lan:8181/api/v1/map/9d7bf465e45113123bf9949c2a4f0395:0/analysis/node/5af683d5d8a6f67e11916a31cd76632884d4064f'
                  }
                },
                'a1': {
                  'status': 'pending',
                  'query': 'select * from analysis_trade_area_e65b1ae05854aea96266808ec0686b91f3ee0a81',
                  'url': {
                    'http': 'http://cdb.localhost.lan:8181/api/v1/map/9d7bf465e45113123bf9949c2a4f0395:0/analysis/node/e65b1ae05854aea96266808ec0686b91f3ee0a81'
                  }
                },
                'a2': {
                  'status': 'pending',
                  'query': 'select * from analysis_trade_area_b35b1ae05854aea96266808ec0686b91f3ee0a81',
                  'url': {
                    'http': 'http://cdb.localhost.lan:8181/api/v1/map/9d7bf465e45113123bf9949c2a4f0395:0/analysis/node/b75b1ae05854aea96266808ec0686b91f3ee0a81'
                  }
                }
              }
            }
          ]
        },
        'last_updated': '1970-01-01T00:00:00.000Z'
      });
      expect(this.vis.trackLoadingObject).toHaveBeenCalled();

      // Polling has started
      expect($.ajax.calls.argsFor(1)[0].url).toEqual('http://cdb.localhost.lan:8181/api/v1/map/9d7bf465e45113123bf9949c2a4f0395:0/analysis/node/e65b1ae05854aea96266808ec0686b91f3ee0a81');
      expect($.ajax.calls.argsFor(2)[0].url).toEqual('http://cdb.localhost.lan:8181/api/v1/map/9d7bf465e45113123bf9949c2a4f0395:0/analysis/node/b75b1ae05854aea96266808ec0686b91f3ee0a81');
    });

    it('should NOT start polling for analysis that are "ready" and are the source of a layer', function () {
      this.visView.load(new VizJSON(this.vizjson));
      this.visView.instantiateMap();

      // Response from Maps API is received
      $.ajax.calls.argsFor(0)[0].success({
        'layergroupid': '9d7bf465e45113123bf9949c2a4f0395:0',
        'metadata': {
          'layers': [
            {
              'type': 'mapnik',
              'meta': {
                'stats': [],
                'cartocss': 'cartocss'
              }
            }
          ],
          'dataviews': {
            'cd065428-ed63-4d29-9a09-a9f8384fc8c9': {
              'url': {
                'http': 'http://cdb.localhost.lan:8181/api/v1/map/9d7bf465e45113123bf9949c2a4f0395:0/dataview/cd065428-ed63-4d29-9a09-a9f8384fc8c9'
              }
            }
          },
          'analyses': [
            {
              'nodes': {
                'a0': {
                  'status': 'ready',
                  'query': 'SELECT * FROM arboles',
                  'url': {
                    'http': 'http://cdb.localhost.lan:8181/api/v1/map/9d7bf465e45113123bf9949c2a4f0395:0/analysis/node/5af683d5d8a6f67e11916a31cd76632884d4064f'
                  }
                },
                'a1': {
                  'status': 'ready',
                  'query': 'select * from analysis_trade_area_e65b1ae05854aea96266808ec0686b91f3ee0a81',
                  'url': {
                    'http': 'http://cdb.localhost.lan:8181/api/v1/map/9d7bf465e45113123bf9949c2a4f0395:0/analysis/node/e65b1ae05854aea96266808ec0686b91f3ee0a81'
                  }
                },
                'a2': {
                  'status': 'ready',
                  'query': 'select * from analysis_trade_area_b35b1ae05854aea96266808ec0686b91f3ee0a81',
                  'url': {
                    'http': 'http://cdb.localhost.lan:8181/api/v1/map/9d7bf465e45113123bf9949c2a4f0395:0/analysis/node/b75b1ae05854aea96266808ec0686b91f3ee0a81'
                  }
                }
              }
            }
          ]
        },
        'last_updated': '1970-01-01T00:00:00.000Z'
      });

      // Polling has NOT started, there was only one ajax call to instantiate the map
      expect($.ajax.calls.count()).toEqual(1);
    });

    it("should NOT start polling for analyses that don't have a URL yet", function () {
      this.visView.load(new VizJSON(this.vizjson));
      this.visView.instantiateMap();

      // Analysis node is created using analyse but node is not associated to any layer or dataview
      this.visView.analysis.analyse({
        id: 'something',
        type: 'source',
        params: {
          query: 'SELECT * FROM people'
        }
      });

      // Response from Maps API is received
      $.ajax.calls.argsFor(0)[0].success({
        'layergroupid': '9d7bf465e45113123bf9949c2a4f0395:0',
        'metadata': {
          'layers': [
            {
              'type': 'mapnik',
              'meta': {
                'stats': [],
                'cartocss': 'cartocss'
              }
            }
          ],
          'dataviews': { },
          'analyses': [
            {
              'nodes': {
                'a0': {
                  'status': 'ready',
                  'query': 'SELECT * FROM arboles',
                  'url': {
                    'http': 'http://cdb.localhost.lan:8181/api/v1/map/9d7bf465e45113123bf9949c2a4f0395:0/analysis/node/5af683d5d8a6f67e11916a31cd76632884d4064f'
                  }
                },
                'a1': {
                  'status': 'ready',
                  'query': 'select * from analysis_trade_area_e65b1ae05854aea96266808ec0686b91f3ee0a81',
                  'url': {
                    'http': 'http://cdb.localhost.lan:8181/api/v1/map/9d7bf465e45113123bf9949c2a4f0395:0/analysis/node/e65b1ae05854aea96266808ec0686b91f3ee0a81'
                  }
                },
                'a2': {
                  'status': 'ready',
                  'query': 'select * from analysis_trade_area_b35b1ae05854aea96266808ec0686b91f3ee0a81',
                  'url': {
                    'http': 'http://cdb.localhost.lan:8181/api/v1/map/9d7bf465e45113123bf9949c2a4f0395:0/analysis/node/b75b1ae05854aea96266808ec0686b91f3ee0a81'
                  }
                }
              }
            }
          ]
        },
        'last_updated': '1970-01-01T00:00:00.000Z'
      });

      // Polling has NOT started, there was only one ajax call to instantiate the map
      expect($.ajax.calls.count()).toEqual(1);
    });

    it('should reload the map when analysis is done', function () {
      this.visView.load(new VizJSON(this.vizjson));
      this.visView.instantiateMap();

      // Response from Maps API is received
      $.ajax.calls.argsFor(0)[0].success({
        'layergroupid': '9d7bf465e45113123bf9949c2a4f0395:0',
        'metadata': {
          'layers': [
            {
              'type': 'mapnik',
              'meta': {
                'stats': [],
                'cartocss': 'cartocss'
              }
            }
          ],
          'dataviews': {
            'cd065428-ed63-4d29-9a09-a9f8384fc8c9': {
              'url': {
                'http': 'http://cdb.localhost.lan:8181/api/v1/map/9d7bf465e45113123bf9949c2a4f0395:0/dataview/cd065428-ed63-4d29-9a09-a9f8384fc8c9'
              }
            }
          },
          'analyses': [
            {
              'nodes': {
                'a0': {
                  'status': 'ready',
                  'query': 'SELECT * FROM arboles',
                  'url': {
                    'http': 'http://cdb.localhost.lan:8181/api/v1/map/9d7bf465e45113123bf9949c2a4f0395:0/analysis/node/5af683d5d8a6f67e11916a31cd76632884d4064f'
                  }
                },
                'a1': {
                  'status': 'pending',
                  'query': 'select * from analysis_trade_area_e65b1ae05854aea96266808ec0686b91f3ee0a81',
                  'url': {
                    'http': 'http://cdb.localhost.lan:8181/api/v1/map/9d7bf465e45113123bf9949c2a4f0395:0/analysis/node/e65b1ae05854aea96266808ec0686b91f3ee0a81'
                  }
                },
                'a2': {
                  'status': 'pending',
                  'query': 'select * from analysis_trade_area_b35b1ae05854aea96266808ec0686b91f3ee0a81',
                  'url': {
                    'http': 'http://cdb.localhost.lan:8181/api/v1/map/9d7bf465e45113123bf9949c2a4f0395:0/analysis/node/b75b1ae05854aea96266808ec0686b91f3ee0a81'
                  }
                }
              }
            }
          ]
        },
        'last_updated': '1970-01-01T00:00:00.000Z'
      });
      expect($.ajax.calls.argsFor(0)[0].url).toEqual('http://cdb.localhost.lan:8181/api/v1/map?stat_tag=70af2a72-0709-11e6-a834-080027880ca6');
      expect($.ajax.calls.argsFor(1)[0].url).toEqual('http://cdb.localhost.lan:8181/api/v1/map/9d7bf465e45113123bf9949c2a4f0395:0/analysis/node/e65b1ae05854aea96266808ec0686b91f3ee0a81');
      expect($.ajax.calls.argsFor(2)[0].url).toEqual('http://cdb.localhost.lan:8181/api/v1/map/9d7bf465e45113123bf9949c2a4f0395:0/analysis/node/b75b1ae05854aea96266808ec0686b91f3ee0a81');

      expect($.ajax.calls.count()).toEqual(3);

      // Analysis endpoint for a1 responds
      $.ajax.calls.argsFor(1)[0].success({status: 'ready'});

      // Map is not reloaded because a1 is not the source of a layer
      expect($.ajax.calls.count()).toEqual(3);

      // Analysis endpoint for a2 responds
      $.ajax.calls.argsFor(2)[0].success({status: 'ready'});

      // Map has been reloaded because a2 is the source of a layer
      expect($.ajax.calls.count()).toEqual(4);
      expect($.ajax.calls.argsFor(3)[0].url).toEqual('http://cdb.localhost.lan:8181/api/v1/map?stat_tag=70af2a72-0709-11e6-a834-080027880ca6');
    });
  });

  describe('addOverlay', function () {
    it('should throw an error if no layers are available', function () {
      expect(function () {
        this.visView.addOverlay({
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

      var tooltip = this.visView.addOverlay({
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

      this.visView.load(new VizJSON(vizjson));
      var tooltip = this.visView.addOverlay({
        type: 'tooltip',
        template: 'test'
      });

      var layerView = this.visView.getLayerViews()[1];

      expect(tooltip.options.layer).toEqual(layerView);
    });
  });
});

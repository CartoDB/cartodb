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
var AnalysisPoller = require('../../../src/analysis/analysis-poller');

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

  describe('public API', function () {
    describe('dataviews factory', function () {
      it('should be defined', function () {
        expect(this.vis.dataviews).toBeDefined();
      });

      it('should have an api_key when using an api_key option', function () {
        this.vis.load(new VizJSON(this.mapConfig), {
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
    this.vis.load(new VizJSON(this.mapConfig));

    expect(this.vis.mapView._leafletMap.options.maxZoom).toEqual(10);
    expect(this.vis.mapView._leafletMap.options.minZoom).toEqual(5);
  });

  it('should create a google maps map when provider is google maps', function () {
    this.container = $('<div>').css('height', '200px');
    this.mapConfig.map_provider = 'googlemaps';
    this.vis.load(new VizJSON(this.mapConfig));
    expect(this.vis.mapView._gmapsMap).not.toEqual(undefined);
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

  it('should listen to collection of analysis for polling', function () {
    spyOn(AnalysisPoller, 'poll');

    this.vis.load(new VizJSON(this.mapConfig));

    expect(AnalysisPoller.poll).toHaveBeenCalled();
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

    this.vis.load(new VizJSON(vizjson));

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

      this.vis.load(new VizJSON(vizjson));
      var tooltip = this.vis.addOverlay({
        type: 'tooltip',
        template: 'test'
      });

      var layerView = this.vis.getLayerViews()[1];

      expect(tooltip.options.layer).toEqual(layerView);
    });

    describe('polling', function () {
      beforeEach(function () {
        jasmine.clock().install();

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
        spyOn(AnalysisPoller, 'poll').and.callThrough();
      });

      afterEach(function () {
        jasmine.clock().uninstall();
      });

      it('should start polling for analyses that are not ready and are the source of a layer', function () {
        this.vis.load(new VizJSON(this.vizjson));
        this.vis.instantiateMap();
        jasmine.clock().tick(1000);

        // Instance
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
        $.ajax.calls.reset();

        // Only polling for 'a2' has started cause it's "pending" and it's the source of the layer
        expect(AnalysisPoller.poll.calls.count()).toEqual(1);
        expect(AnalysisPoller.poll.calls.argsFor(0)[0].get('id')).toEqual('a2');

        jasmine.clock().tick(15000);

        expect(AnalysisPoller.poll.calls.count()).toEqual(2);
        expect(AnalysisPoller.poll.calls.argsFor(0)[0].get('id')).toEqual('a2');

      });

      it('should NOT start polling for analysis that are "ready" and are the source of a layer', function () {
        this.vis.load(new VizJSON(this.vizjson));
        this.vis.instantiateMap();
        jasmine.clock().tick(1000);

        // Instance
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
        $.ajax.calls.reset();

        expect(AnalysisPoller.poll.calls.count()).toEqual(0);
      });
    });
  });
});

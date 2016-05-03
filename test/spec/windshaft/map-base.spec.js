var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var Model = require('../../../src/core/model');
var Map = require('../../../src/geo/map');
var TorqueLayer = require('../../../src/geo/map/torque-layer');
var CartoDBLayer = require('../../../src/geo/map/cartodb-layer');
var HistogramDataviewModel = require('../../../src/dataviews/histogram-dataview-model');
var WindshaftMapBase = require('../../../src/windshaft/map-base');
var WindshaftClient = require('../../../src/windshaft/client');
var CategoryFilter = require('../../../src/windshaft/filters/category');

var WindshaftMap = WindshaftMapBase.extend({
  toJSON: function () {
    return {};
  }
});

describe('windshaft/map-base', function () {
  beforeEach(function () {
    jasmine.clock().install();

    // Disable ajax and debounce for these tests
    spyOn($, 'ajax').and.callFake(function () {});
    spyOn(_, 'debounce').and.callFake(function (func) { return function () { func.apply(this, arguments); }; });

    this.windshaftMapInstance = {
      layergroupid: 'layergroupid',
      metadata: {
        layers: [
          {
            'type': 'mapnik',
            'meta': {},
            'widgets': {
              'dataviewId': {
                'url': {
                  'http': 'http://example.com',
                  'https': 'https://example.com'
                }
              }
            }
          }
        ]
      }
    };

    this.dataviewsCollection = new Backbone.Collection();
    this.layersCollection = new Backbone.Collection();
    this.analysisCollection = new Backbone.Collection();
    this.modelUpdater = jasmine.createSpyObj('modelUpdater', ['updateModels']);
    this.client = new WindshaftClient({
      endpoint: 'v1',
      urlTemplate: 'http://{user}.wadus.com',
      userName: 'rambo'
    });
    spyOn(this.client, 'instantiateMap').and.callFake(function (options) {
      options.success(this.windshaftMapInstance);
    }.bind(this));

    this.cartoDBLayerGroup = new Model();
    this.cartoDBLayer1 = new CartoDBLayer({ id: '12345-67890' });
    this.cartoDBLayer2 = new CartoDBLayer({ id: '09876-54321' });
    this.torqueLayer = new TorqueLayer();
  });

  afterEach(function () {
    jasmine.clock().uninstall();
  });

  describe('createInstance', function () {
    beforeEach(function () {
      this.windshaftMap = new WindshaftMap({
        statTag: 'stat_tag'
      }, {
        client: this.client,
        modelUpdater: this.modelUpdater,
        dataviewsCollection: this.dataviewsCollection,
        layersCollection: this.layersCollection,
        analysisCollection: this.analysisCollection
      });

      this.map = new Map({
        view_bounds_sw: [],
        view_bounds_ne: []
      }, {
        windshaftMap: this.windshaftMap
      });

      this.filter = new CategoryFilter({
        dataviewId: 'dataviewId'
      });

      this.dataview = new HistogramDataviewModel({
        id: 'dataviewId',
        type: 'list'
      }, {
        map: this.map,
        windshaftMap: this.windshaftMap,
        layer: this.cartoDBLayer1,
        filter: this.filter
      });

      this.dataviewsCollection.add(this.dataview);
    });

    it('should create an instance of the windshaft map', function () {
      this.layersCollection.reset([ this.cartoDBLayer1, this.cartoDBLayer2, this.torqueLayer ]);
      spyOn(this.windshaftMap, 'toJSON').and.returnValue({ foo: 'bar' });

      this.windshaftMap.createInstance({
        sourceLayerId: 'sourceLayerId'
      });

      var args = this.client.instantiateMap.calls.mostRecent().args[0];
      expect(args.mapDefinition).toEqual({ foo: 'bar' });
      expect(args.params).toEqual({
        stat_tag: 'stat_tag'
      });
    });

    it('should invoke the given callback', function () {
      var successCallback = jasmine.createSpy('success');
      this.windshaftMap.createInstance({
        success: successCallback
      });

      expect(successCallback).toHaveBeenCalledWith(this.windshaftMap);
    });

    it('should trigger the `instanceCreated` event', function () {
      var instanceCreatedCallback = jasmine.createSpy('instanceCreatedCallback');
      this.windshaftMap.bind('instanceCreated', instanceCreatedCallback);
      this.windshaftMap.createInstance();

      expect(instanceCreatedCallback).toHaveBeenCalled();
    });

    it('should serialize the active filters of dataviews in the URL', function () {
      this.layersCollection.reset([ this.cartoDBLayer1, this.cartoDBLayer2, this.torqueLayer ]);
      spyOn(this.windshaftMap, 'toJSON').and.returnValue({ foo: 'bar' });

      this.windshaftMap.createInstance({
        sourceLayerId: 'sourceLayerId'
      });
      var args = this.client.instantiateMap.calls.mostRecent().args[0];

      // Filters are empty because no filter is active yet
      expect(args.params).toEqual({
        stat_tag: 'stat_tag'
      });

      this.filter.accept('category');

      // Recreate the instance again
      this.windshaftMap.createInstance({
        sourceLayerId: 'sourceLayerId'
      });
      args = this.client.instantiateMap.calls.mostRecent().args[0];

      expect(args.params).toEqual({
        stat_tag: 'stat_tag',
        filters: {
          dataviews: {
            dataviewId: {
              accept: [ 'category' ]
            }
          }
        }
      });
    });

    it('should use the given API key when creating a new instance of the windshaft map', function () {
      this.layersCollection.reset([ this.cartoDBLayer1, this.cartoDBLayer2, this.torqueLayer ]);
      spyOn(this.windshaftMap, 'toJSON').and.returnValue({ foo: 'bar' });

      this.windshaftMap = new WindshaftMap({
        apiKey: 'API_KEY',
        statTag: 'stat_tag'
      }, { // eslint-disable-line
        client: this.client,
        modelUpdater: this.modelUpdater,
        dataviewsCollection: this.dataviewsCollection,
        layersCollection: this.layersCollection,
        analysisCollection: this.analysisCollection
      });

      this.windshaftMap.createInstance({
        sourceLayerId: 'sourceLayerId'
      });

      var args = this.client.instantiateMap.calls.mostRecent().args[0];
      expect(args.params).toEqual({
        stat_tag: 'stat_tag',
        api_key: 'API_KEY'
      });
    });

    it('should set the attributes of the new instance', function () {
      this.layersCollection.reset([ this.cartoDBLayer1, this.cartoDBLayer2, this.torqueLayer ]);
      this.windshaftMap.createInstance({
        sourceLayerId: 'sourceLayerId'
      });

      expect(this.windshaftMap.get('layergroupid')).toEqual('layergroupid');
      expect(this.windshaftMap.get('metadata')).toEqual(this.windshaftMapInstance.metadata);
    });

    it('should use the modelUpdater to update internal models', function () {
      this.windshaftMap.createInstance({
        sourceLayerId: 'sourceLayerId',
        forceFetch: 'forceFetch'
      });

      expect(this.modelUpdater.updateModels).toHaveBeenCalledWith(this.windshaftMap, 'sourceLayerId', 'forceFetch');
    });

    describe('.getLayerMetadata', function () {
      it('should return the metadata given an index', function () {
        this.windshaftMap.set({
          layergroupid: 'layergroupid',
          metadata: {
            layers: [
              {
                'type': 'mapnik',
                'meta': 'cartodb-metadata',
                'widgets': {
                  'dataviewId': {
                    'url': {
                      'http': 'http://example.com',
                      'https': 'https://example.com'
                    }
                  }
                }
              },
              {
                'type': 'torque',
                'meta': 'torque-metadata'
              }
            ]
          }
        });

        expect(this.windshaftMap.getLayerMetadata(0)).toEqual('cartodb-metadata');
        expect(this.windshaftMap.getLayerMetadata(1)).toEqual('torque-metadata');
      });

      it('should ignore http layers present in the response', function () {
        this.windshaftMap.set({
          layergroupid: 'layergroupid',
          metadata: {
            layers: [
              {
                'type': 'http'
              },
              {
                'type': 'mapnik',
                'meta': 'cartodb-metadata',
                'widgets': {
                  'dataviewId': {
                    'url': {
                      'http': 'http://example.com',
                      'https': 'https://example.com'
                    }
                  }
                }
              },
              {
                'type': 'torque',
                'meta': 'torque-metadata'
              }
            ]
          }
        });

        expect(this.windshaftMap.getLayerMetadata(0)).toEqual('cartodb-metadata');
        expect(this.windshaftMap.getLayerMetadata(1)).toEqual('torque-metadata');
      });

      it('should ignore plain layers present in the response', function () {
        this.windshaftMap.set({
          layergroupid: 'layergroupid',
          metadata: {
            layers: [
              {
                'type': 'plain'
              },
              {
                'type': 'mapnik',
                'meta': 'cartodb-metadata',
                'widgets': {
                  'dataviewId': {
                    'url': {
                      'http': 'http://example.com',
                      'https': 'https://example.com'
                    }
                  }
                }
              },
              {
                'type': 'torque',
                'meta': 'torque-metadata'
              }
            ]
          }
        });

        expect(this.windshaftMap.getLayerMetadata(0)).toEqual('cartodb-metadata');
        expect(this.windshaftMap.getLayerMetadata(1)).toEqual('torque-metadata');
      });
    });
  });

  describe('#getBaseURL', function () {
    it("should return Windshaft's url if no CDN info is present", function () {
      var windshaftClient = new WindshaftClient({
        urlTemplate: 'https://{user}.example.com:443',
        userName: 'rambo',
        endpoint: 'v2'
      });
      var windshaftMap = new WindshaftMap({
        layergroupid: '0123456789'
      }, {
        client: windshaftClient,
        modelUpdater: this.modelUpdater,
        dataviewsCollection: this.dataviewsCollection,
        layersCollection: this.layersCollection,
        analysisCollection: this.analysisCollection
      });
      expect(windshaftMap.getBaseURL()).toEqual('https://rambo.example.com:443/api/v1/map/0123456789');
    });

    it('should return the CDN URL for http when CDN info is present', function () {
      var windshaftMap = new WindshaftMap({
        layergroupid: '0123456789',
        cdn_url: {
          http: 'cdn.http.example.com',
          https: 'cdn.https.example.com'
        }
      }, {
        client: new WindshaftClient({
          urlTemplate: 'http://{user}.example.com:443',
          userName: 'rambo',
          endpoint: 'v2'
        }),
        modelUpdater: this.modelUpdater,
        dataviewsCollection: this.dataviewsCollection,
        layersCollection: this.layersCollection,
        analysisCollection: this.analysisCollection
      });

      expect(windshaftMap.getBaseURL()).toEqual('http://cdn.http.example.com/rambo/api/v1/map/0123456789');
    });

    it('should return the CDN URL for https when CDN info is present', function () {
      var windshaftMap = new WindshaftMap({
        layergroupid: '0123456789',
        cdn_url: {
          http: 'cdn.http.example.com',
          https: 'cdn.https.example.com'
        }
      }, {
        client: new WindshaftClient({
          urlTemplate: 'https://{user}.example.com:443',
          userName: 'rambo',
          endpoint: 'v2'
        }),
        modelUpdater: this.modelUpdater,
        dataviewsCollection: this.dataviewsCollection,
        layersCollection: this.layersCollection,
        analysisCollection: this.analysisCollection
      });

      expect(windshaftMap.getBaseURL()).toEqual('https://cdn.https.example.com/rambo/api/v1/map/0123456789');
    });
  });

  describe('#getTiles', function () {
    it('should return the URLs for tiles and grids by default or when requesting "mapnik" layers', function () {
      var windshaftMap = new WindshaftMap({
        'layergroupid': '0123456789',
        'metadata': {
          'layers': [
            {
              'type': 'mapnik',
              'meta': {}
            },
            {
              'type': 'torque',
              'meta': {}
            }
          ]
        }
      }, {
        client: new WindshaftClient({
          urlTemplate: 'https://{user}.example.com:443',
          userName: 'rambo',
          endpoint: 'v2'
        }),
        modelUpdater: this.modelUpdater,
        dataviewsCollection: this.dataviewsCollection,
        layersCollection: this.layersCollection,
        analysisCollection: this.analysisCollection
      });

      // No type specified
      expect(windshaftMap.getTiles()).toEqual({
        tiles: [ 'https://rambo.example.com:443/api/v1/map/0123456789/0/{z}/{x}/{y}.png' ],
        grids: [
          [ 'https://rambo.example.com:443/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json' ]
        ]
      });

      // Request tiles for "mapnik" layers specifically
      expect(windshaftMap.getTiles('mapnik')).toEqual({
        tiles: [ 'https://rambo.example.com:443/api/v1/map/0123456789/0/{z}/{x}/{y}.png' ],
        grids: [
          [ 'https://rambo.example.com:443/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json' ]
        ]
      });
    });

    it('should only include grids for "mapnik" layers', function () {
      var windshaftMap = new WindshaftMap({
        'layergroupid': '0123456789',
        'metadata': {
          'layers': [
            {
              'type': 'http',
              'meta': {}
            },
            {
              'type': 'mapnik',
              'meta': {}
            },
            {
              'type': 'mapnik',
              'meta': {}
            }
          ]
        }
      }, {
        client: new WindshaftClient({
          urlTemplate: 'https://{user}.example.com:443',
          userName: 'rambo',
          endpoint: 'v2'
        }),
        modelUpdater: this.modelUpdater,
        dataviewsCollection: this.dataviewsCollection,
        layersCollection: this.layersCollection,
        analysisCollection: this.analysisCollection
      });

      // Request tiles for "mapnik" layers specifically
      expect(windshaftMap.getTiles('mapnik')).toEqual({
        tiles: [ 'https://rambo.example.com:443/api/v1/map/0123456789/1,2/{z}/{x}/{y}.png' ],
        grids: [
          [ 'https://rambo.example.com:443/api/v1/map/0123456789/1/{z}/{x}/{y}.grid.json' ],
          [ 'https://rambo.example.com:443/api/v1/map/0123456789/2/{z}/{x}/{y}.grid.json' ]
        ]
      });
    });

    it('should return the URLs for "torque" layers and no grids', function () {
      var windshaftMap = new WindshaftMap({
        'layergroupid': '0123456789',
        'metadata': {
          'layers': [
            {
              'type': 'mapnik',
              'meta': {}
            },
            {
              'type': 'torque',
              'meta': {}
            }
          ]
        }
      }, {
        client: new WindshaftClient({
          urlTemplate: 'https://{user}.example.com:443',
          userName: 'rambo',
          endpoint: 'v2'
        }),
        modelUpdater: this.modelUpdater,
        dataviewsCollection: this.dataviewsCollection,
        layersCollection: this.layersCollection,
        analysisCollection: this.analysisCollection
      });

      // Request tiles for "torque" layers specifically
      expect(windshaftMap.getTiles('torque')).toEqual({
        tiles: [ 'https://rambo.example.com:443/api/v1/map/0123456789/1/{z}/{x}/{y}.json.torque' ],
        grids: []
      });
    });

    it('should handle layer indexes correctly when a layer type is specified', function () {
      var windshaftMap = new WindshaftMap({
        'layergroupid': '0123456789',
        'metadata': {
          'layers': [
            {
              'type': 'mapnik',
              'meta': {}
            },
            {
              'type': 'torque',
              'meta': {}
            },
            {
              'type': 'mapnik',
              'meta': {}
            },
            {
              'type': 'torque',
              'meta': {}
            }
          ]
        }
      }, {
        client: new WindshaftClient({
          urlTemplate: 'https://{user}.example.com:443',
          userName: 'rambo',
          endpoint: 'v2'
        }),
        modelUpdater: this.modelUpdater,
        dataviewsCollection: this.dataviewsCollection,
        layersCollection: this.layersCollection,
        analysisCollection: this.analysisCollection
      });

      // Request tiles for "mapnik" layers specifically (#0 and #2)
      expect(windshaftMap.getTiles('mapnik')).toEqual({
        tiles: [ 'https://rambo.example.com:443/api/v1/map/0123456789/0,2/{z}/{x}/{y}.png' ],
        grids: [
          [ 'https://rambo.example.com:443/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json' ],
          [ 'https://rambo.example.com:443/api/v1/map/0123456789/2/{z}/{x}/{y}.grid.json' ]
        ]
      });

      // Request tiles for "torque" layers specifically (#1 and #3)
      expect(windshaftMap.getTiles('torque')).toEqual({
        tiles: [ 'https://rambo.example.com:443/api/v1/map/0123456789/1,3/{z}/{x}/{y}.json.torque' ],
        grids: []
      });
    });

    it('should encode and include the API key in the URLs if apiKey is set', function () {
      var windshaftMap = new WindshaftMap({
        'apiKey': 'API_KEY',
        'layergroupid': '0123456789',
        'metadata': {
          'layers': [
            {
              'type': 'mapnik',
              'meta': {}
            },
            {
              'type': 'torque',
              'meta': {}
            }
          ]
        }
      }, {
        client: new WindshaftClient({
          urlTemplate: 'https://{user}.example.com:443',
          userName: 'rambo',
          endpoint: 'v2'
        }),
        modelUpdater: this.modelUpdater,
        dataviewsCollection: this.dataviewsCollection,
        layersCollection: this.layersCollection,
        analysisCollection: this.analysisCollection
      });

      expect(windshaftMap.getTiles()).toEqual({
        tiles: [ 'https://rambo.example.com:443/api/v1/map/0123456789/0/{z}/{x}/{y}.png?api_key=API_KEY' ],
        grids: [
          [ 'https://rambo.example.com:443/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json?api_key=API_KEY' ]
        ]
      });
    });

    describe('when NOT using a CDN', function () {
      it('should return the URLS for tiles and grids for https', function () {
        var windshaftMap = new WindshaftMap({
          'layergroupid': '0123456789',
          'metadata': {
            'layers': [
              {
                'type': 'mapnik',
                'meta': {}
              },
              {
                'type': 'mapnik',
                'meta': {}
              }
            ]
          }
        }, {
          client: new WindshaftClient({
            urlTemplate: 'https://{user}.example.com:443',
            userName: 'rambo',
            endpoint: 'v2'
          }),
          modelUpdater: this.modelUpdater,
          dataviewsCollection: this.dataviewsCollection,
          layersCollection: this.layersCollection,
          analysisCollection: this.analysisCollection
        });
        expect(windshaftMap.getTiles()).toEqual({
          tiles: [ 'https://rambo.example.com:443/api/v1/map/0123456789/0,1/{z}/{x}/{y}.png' ],
          grids: [
            [ 'https://rambo.example.com:443/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json' ],
            [ 'https://rambo.example.com:443/api/v1/map/0123456789/1/{z}/{x}/{y}.grid.json' ]
          ]
        });
      });

      it('should return the URLS for tiles and grids for http', function () {
        var windshaftMap = new WindshaftMap({
          'layergroupid': '0123456789',
          'metadata': {
            'layers': [
              {
                'type': 'mapnik',
                'meta': {}
              },
              {
                'type': 'mapnik',
                'meta': {}
              }
            ]
          }
        }, {
          client: new WindshaftClient({
            urlTemplate: 'http://{user}.example.com:443',
            userName: 'rambo',
            endpoint: 'v2'
          }),
          modelUpdater: this.modelUpdater,
          dataviewsCollection: this.dataviewsCollection,
          layersCollection: this.layersCollection,
          analysisCollection: this.analysisCollection
        });
        expect(windshaftMap.getTiles()).toEqual({
          'tiles': [
            'http://rambo.example.com:443/api/v1/map/0123456789/0,1/{z}/{x}/{y}.png',
            'http://rambo.example.com:443/api/v1/map/0123456789/0,1/{z}/{x}/{y}.png',
            'http://rambo.example.com:443/api/v1/map/0123456789/0,1/{z}/{x}/{y}.png',
            'http://rambo.example.com:443/api/v1/map/0123456789/0,1/{z}/{x}/{y}.png'
          ],
          'grids': [
            [
              'http://rambo.example.com:443/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json',
              'http://rambo.example.com:443/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json',
              'http://rambo.example.com:443/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json',
              'http://rambo.example.com:443/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json'
            ], [
              'http://rambo.example.com:443/api/v1/map/0123456789/1/{z}/{x}/{y}.grid.json',
              'http://rambo.example.com:443/api/v1/map/0123456789/1/{z}/{x}/{y}.grid.json',
              'http://rambo.example.com:443/api/v1/map/0123456789/1/{z}/{x}/{y}.grid.json',
              'http://rambo.example.com:443/api/v1/map/0123456789/1/{z}/{x}/{y}.grid.json'
            ]
          ]
        });
      });
    });

    describe('when using a CDN', function () {
      it('should return the URLS for tiles and grids for https', function () {
        var windshaftMap = new WindshaftMap({
          'layergroupid': '0123456789',
          'cdn_url': {
            http: 'cdn.http.example.com',
            https: 'cdn.https.example.com'
          },
          'metadata': {
            'layers': [
              {
                'type': 'mapnik',
                'meta': {}
              },
              {
                'type': 'mapnik',
                'meta': {}
              }
            ]
          }
        }, {
          client: new WindshaftClient({
            urlTemplate: 'https://{user}.example.com:443',
            userName: 'rambo',
            endpoint: 'v2'
          }),
          modelUpdater: this.modelUpdater,
          dataviewsCollection: this.dataviewsCollection,
          layersCollection: this.layersCollection,
          analysisCollection: this.analysisCollection
        });
        expect(windshaftMap.getTiles()).toEqual({
          'tiles': [ 'https://cdn.https.example.com/rambo/api/v1/map/0123456789/0,1/{z}/{x}/{y}.png' ],
          'grids': [
            [ 'https://cdn.https.example.com/rambo/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json' ],
            [ 'https://cdn.https.example.com/rambo/api/v1/map/0123456789/1/{z}/{x}/{y}.grid.json' ]
          ]
        });
      });

      it('should return the URLS for tiles and grids for http', function () {
        var windshaftMap = new WindshaftMap({
          'layergroupid': '0123456789',
          'cdn_url': {
            http: 'cdn.http.example.com',
            https: 'cdn.https.example.com'
          },
          'metadata': {
            'layers': [
              {
                'type': 'mapnik',
                'meta': {}
              },
              {
                'type': 'mapnik',
                'meta': {}
              }
            ]
          }
        }, {
          client: new WindshaftClient({
            urlTemplate: 'http://{user}.example.com:443',
            userName: 'rambo',
            endpoint: 'v2'
          }),
          modelUpdater: this.modelUpdater,
          dataviewsCollection: this.dataviewsCollection,
          layersCollection: this.layersCollection,
          analysisCollection: this.analysisCollection
        });
        expect(windshaftMap.getTiles()).toEqual({
          'tiles': [
            'http://0.cdn.http.example.com/rambo/api/v1/map/0123456789/0,1/{z}/{x}/{y}.png',
            'http://1.cdn.http.example.com/rambo/api/v1/map/0123456789/0,1/{z}/{x}/{y}.png',
            'http://2.cdn.http.example.com/rambo/api/v1/map/0123456789/0,1/{z}/{x}/{y}.png',
            'http://3.cdn.http.example.com/rambo/api/v1/map/0123456789/0,1/{z}/{x}/{y}.png'
          ],
          'grids': [
            [
              'http://0.cdn.http.example.com/rambo/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json',
              'http://1.cdn.http.example.com/rambo/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json',
              'http://2.cdn.http.example.com/rambo/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json',
              'http://3.cdn.http.example.com/rambo/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json'
            ], [
              'http://0.cdn.http.example.com/rambo/api/v1/map/0123456789/1/{z}/{x}/{y}.grid.json',
              'http://1.cdn.http.example.com/rambo/api/v1/map/0123456789/1/{z}/{x}/{y}.grid.json',
              'http://2.cdn.http.example.com/rambo/api/v1/map/0123456789/1/{z}/{x}/{y}.grid.json',
              'http://3.cdn.http.example.com/rambo/api/v1/map/0123456789/1/{z}/{x}/{y}.grid.json'
            ]
          ]
        });
      });
    });
  });

  describe('#getDataviewMetadata', function () {
    it('should return undefined if dataviews key is not present in the metadata', function () {
      var windshaftMap = new WindshaftMap({
        'layergroupid': '0123456789',
        'metadata': {
          'layers': [
            {
              'type': 'mapnik',
              'meta': {}
            },
            {
              'type': 'torque',
              'meta': {}
            }
          ]
        }
      }, {
        client: new WindshaftClient({
          urlTemplate: 'http://{user}.example.com:443',
          userName: 'rambo',
          endpoint: 'v2'
        }),
        modelUpdater: this.modelUpdater,
        dataviewsCollection: this.dataviewsCollection,
        layersCollection: this.layersCollection,
        analysisCollection: this.analysisCollection
      });

      var dataviewMetadata = windshaftMap.getDataviewMetadata('whatever');
      expect(dataviewMetadata).toBeUndefined();

      windshaftMap = new WindshaftMap({
        'layergroupid': '0123456789',
        'metadata': {
          'layers': [
            {
              'type': 'mapnik',
              'meta': {},
              'widgets': {
                'category_widget_uuid': {
                  'url': {
                    'http': 'http://staging.cartocdn.com/pablo/api/v1/map/a5a4f259c7a6af8b56a182ad1b1635f7:1446650335533.2698/0/widget/category_widget_uuid',
                    'https': 'https://cdb-staging-1.global.ssl.fastly.net/pablo/api/v1/map/a5a4f259c7a6af8b56a182ad1b1635f7:1446650335533.2698/0/widget/category_widget_uuid'
                  }
                }
              }
            },
            {
              'type': 'torque',
              'meta': {}
            }
          ]
        }
      }, {
        client: new WindshaftClient({
          urlTemplate: 'https://{user}.example.com:443',
          userName: 'rambo',
          endpoint: 'v2'
        }),
        modelUpdater: this.modelUpdater,
        dataviewsCollection: this.dataviewsCollection,
        layersCollection: this.layersCollection,
        analysisCollection: this.analysisCollection
      });

      dataviewMetadata = windshaftMap.getDataviewMetadata('whatever');
      expect(dataviewMetadata).toBeUndefined();
    });

    it('should return the URL for the given dataviewId when metadata is under dataview', function () {
      var windshaftMap = new WindshaftMap({
        'layergroupid': '0123456789',
        'metadata': {
          'layers': [
            {
              'type': 'mapnik',
              'meta': {}
            },
            {
              'type': 'torque',
              'meta': {}
            }
          ],
          dataviews: {
            'dataviewId': {
              'url': {
                'http': 'http://example.com',
                'https': 'https://example.com'
              }
            },
            'dataviewId2': {
              'url': {
                'http': 'http://example2.com',
                'https': 'https://example2.com'
              }
            }
          }
        }
      }, {
        client: new WindshaftClient({
          urlTemplate: 'https://{user}.example.com:443',
          userName: 'rambo',
          endpoint: 'v2'
        }),
        modelUpdater: this.modelUpdater,
        dataviewsCollection: this.dataviewsCollection,
        layersCollection: this.layersCollection,
        analysisCollection: this.analysisCollection
      });

      var dataviewMetadata = windshaftMap.getDataviewMetadata('dataviewId');
      expect(dataviewMetadata).toEqual({
        'url': {
          'http': 'http://example.com',
          'https': 'https://example.com'
        }
      });

      dataviewMetadata = windshaftMap.getDataviewMetadata('dataviewId2');
      expect(dataviewMetadata).toEqual({
        'url': {
          'http': 'http://example2.com',
          'https': 'https://example2.com'
        }
      });
    });

    it('should return the URL for the given dataviewId when metadata is under layers', function () {
      var windshaftMap = new WindshaftMap({
        'layergroupid': 'observatory@2168bf86@a71df05e422879e95930bbcb932a9b0a:1460751254653',
        'metadata': {
          'layers': [
            {
              'type': 'http',
              'meta': {
                'stats': [],
                'cartocss': {}
              }
            },
            {
              'type': 'mapnik',
              'meta': {
                'stats': [],
                'cartocss': '/** choropleth visualization */\n\n\n@1 : #5C308C;\n@2 : #833599;\n@3 : #A640A2;\n@4 : #C753A8; \n@5 : #e76cac;\n@6 : #ff8db1  ;\n@7 : #ffc2c7  ;\n\n\n#5C308C,#833599,#A640A2,#C753A8,#E76CAC,#FF8DB1,#FFC2C7\n\n\n#segregated_tracts{\n  polygon-fill: #FFFFB2;\n  polygon-opacity: 0.8;\n}\n#segregated_tracts [ prob_being_same <= 1] {\n   polygon-fill: @7;\n   line-color: lighten(@7,5);\n}\n#segregated_tracts [ prob_being_same <= 0.900302811812] {\n   polygon-fill: @6;\n   line-color: lighten(@6,5);\n}\n#segregated_tracts [ prob_being_same <= 0.807340578641] {\n   polygon-fill: @5;\n   line-color: lighten(@5,5);\n}\n#segregated_tracts [ prob_being_same <= 0.69976803713] {\n   polygon-fill: @4;\n   line-color: lighten(@4,5);\n}\n#segregated_tracts [ prob_being_same <= 0.588361334051] {\n   polygon-fill: @3;\n   line-color: lighten(@3,5);\n}\n#segregated_tracts [ prob_being_same <= 0.487706534839] {\n   polygon-fill: @2;\n   line-color: lighten(@2,5);\n}\n#segregated_tracts [ prob_being_same <= 0.399914994417] {\n   polygon-fill: @1;\n   line-color: lighten(@1,5);\n}'
              },
              'widgets': {
                'dataviewId': {
                  'url': {
                    'http': 'http://example.com',
                    'https': 'https://example.com'
                  }
                },
                'dataviewId2': {
                  'url': {
                    'http': 'http://example2.com',
                    'https': 'https://example2.com'
                  }
                }
              }
            },
            {
              'type': 'mapnik',
              'meta': {
                'stats': [],
                'cartocss': '/** simple visualization */\n\n#us_census_tiger2013_state{\n  polygon-fill: #FF6600;\n  polygon-opacity: 0;\n  line-color: #FFF;\n  line-width: 1;\n  line-opacity: 1;\n}'
              }
            },
            {
              'type': 'mapnik',
              'meta': {
                'stats': [],
                'cartocss': '/** simple visualization */\n\n#detailed_water{\n  polygon-fill: #CDD2D4;\n  polygon-opacity: 1;\n  line-color: #CDD2D4;\n  line-width: 0.5;\n  line-opacity: 1;\n}'
              }
            },
            {
              'type': 'http',
              'meta': {
                'stats': [],
                'cartocss': {}
              }
            }
          ],
          'dataviews': {},
          'analyses': []
        },
        'cdn_url': {
          'http': 'ashbu.cartocdn.com',
          'https': 'cartocdn-ashbu.global.ssl.fastly.net'
        },
        'last_updated': '2016-04-15T20:14:14.653Z'
      }, {
        client: new WindshaftClient({
          urlTemplate: 'https://{user}.example.com:443',
          userName: 'rambo',
          endpoint: 'v2'
        }),
        modelUpdater: this.modelUpdater,
        dataviewsCollection: this.dataviewsCollection,
        layersCollection: this.layersCollection,
        analysisCollection: this.analysisCollection
      });

      var dataviewMetadata = windshaftMap.getDataviewMetadata('dataviewId');
      expect(dataviewMetadata).toEqual({
        'url': {
          'http': 'http://example.com',
          'https': 'https://example.com'
        }
      });

      dataviewMetadata = windshaftMap.getDataviewMetadata('dataviewId2');
      expect(dataviewMetadata).toEqual({
        'url': {
          'http': 'http://example2.com',
          'https': 'https://example2.com'
        }
      });
    });
  });
});

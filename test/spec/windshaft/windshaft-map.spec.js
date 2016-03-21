var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var Model = require('../../../src/core/model');
var Map = require('../../../src/geo/map');
var TorqueLayer = require('../../../src/geo/map/torque-layer');
var CartoDBLayer = require('../../../src/geo/map/cartodb-layer');
var HistogramDataviewModel = require('../../../src/dataviews/histogram-dataview-model');
var WindshaftMap = require('../../../src/windshaft/windshaft-map');
var WindshaftClient = require('../../../src/windshaft/client');
var CategoryFilter = require('../../../src/windshaft/filters/category');

describe('windshaft/map', function () {
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

    this.client = new WindshaftClient({
      endpoint: 'v1',
      urlTemplate: 'http://{user}.wadus.com',
      userName: 'rambo'
    });
    spyOn(this.client, 'instantiateMap').and.callFake(function (options) {
      options.success(this.windshaftMapInstance);
    }.bind(this));

    this.configGenerator = {
      generate: function () {}
    };

    this.map = new Map({
      view_bounds_sw: [],
      view_bounds_ne: []
    });

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
      this.windshaftMap = new WindshaftMap(null, { // eslint-disable-line
        client: this.client,
        configGenerator: this.configGenerator,
        statTag: 'stat_tag',
        dataviewsCollection: this.dataviewsCollection,
        layersCollection: this.layersCollection
      });

      var filter = new CategoryFilter({
        layer: this.cartoDBLayer1
      });
      spyOn(filter, 'isEmpty').and.returnValue(false);
      spyOn(filter, 'toJSON').and.returnValue({ accept: 'category' });

      var dataview = new HistogramDataviewModel({
        id: 'dataviewId',
        type: 'list'
      }, {
        map: this.map,
        windshaftMap: this.windshaftMap,
        layer: this.cartoDBLayer1,
        filter: filter
      });

      this.dataviewsCollection.add(dataview);
    });

    it('should create an instance of the windshaft map', function () {
      this.layersCollection.reset([ this.cartoDBLayer1, this.cartoDBLayer2, this.torqueLayer ]);
      spyOn(this.configGenerator, 'generate').and.returnValue({ foo: 'bar' });

      this.windshaftMap.createInstance({
        sourceLayerId: 'sourceLayerId'
      });

      var args = this.client.instantiateMap.calls.mostRecent().args[0];
      expect(args.mapDefinition).toEqual({ foo: 'bar' });
      expect(args.statTag).toEqual('stat_tag');
      expect(args.filters).toEqual({ layers: [{ accept: 'category' }, {}, {}] });
    });

    it('should use the given API key when creating a new instance of the windshaft map', function () {
      this.layersCollection.reset([ this.cartoDBLayer1, this.cartoDBLayer2, this.torqueLayer ]);
      spyOn(this.configGenerator, 'generate').and.returnValue({ foo: 'bar' });

      this.windshaftMap = new WindshaftMap(null, { // eslint-disable-line
        client: this.client,
        configGenerator: this.configGenerator,
        apiKey: 'API_KEY',
        statTag: 'stat_tag',
        dataviewsCollection: this.dataviewsCollection,
        layersCollection: this.layersCollection
      });

      this.windshaftMap.createInstance({
        sourceLayerId: 'sourceLayerId'
      });

      var args = this.client.instantiateMap.calls.mostRecent().args[0];
      expect(args.mapDefinition).toEqual({ foo: 'bar' });
      expect(args.apiKey).toEqual('API_KEY');
      expect(args.statTag).toEqual('stat_tag');
      expect(args.filters).toEqual({ layers: [{ accept: 'category' }, {}, {}] });
    });

    it('should not send filters linked to hidden layers', function () {
      this.layersCollection.reset([ this.cartoDBLayer1, this.cartoDBLayer2, this.torqueLayer ]);

      // Hide this.cartoDBLayer1 -> Filters of that layer should be ignored
      this.cartoDBLayer1.set('visible', false, { silent: true });

      this.windshaftMap.createInstance({
        sourceLayerId: 'sourceLayerId'
      });

      var args = this.client.instantiateMap.calls.mostRecent().args[0];
      expect(args.filters).toEqual({ });
    });

    it('should trigger an event when the instance is created', function () {
      this.layersCollection.reset([ this.cartoDBLayer1, this.cartoDBLayer2, this.torqueLayer ]);
      var onWindshaftInstanceCreated = jasmine.createSpy('callback');
      this.windshaftMap.bind('instanceCreated', onWindshaftInstanceCreated);

      this.windshaftMap.createInstance({
        sourceLayerId: 'sourceLayerId'
      });

      expect(onWindshaftInstanceCreated).toHaveBeenCalledWith(this.windshaftMap, 'sourceLayerId', undefined);
    });

    it('should set the attributes of the new instance', function () {
      this.layersCollection.reset([ this.cartoDBLayer1, this.cartoDBLayer2, this.torqueLayer ]);
      this.windshaftMap.createInstance({
        sourceLayerId: 'sourceLayerId'
      });

      expect(this.windshaftMap.get('layergroupid')).toEqual('layergroupid');
      expect(this.windshaftMap.get('metadata')).toEqual(this.windshaftMapInstance.metadata);
    });

    describe('metadata', function () {
      beforeEach(function () {
        this.dataviewsCollection = new Backbone.Collection();

        this.client = new WindshaftClient({
          endpoint: 'v1',
          urlTemplate: 'http://{user}.wadus.com',
          userName: 'rambo'
        });
        spyOn(this.client, 'instantiateMap').and.callFake(function (options) {
          options.success(this.windshaftMapInstance);
        }.bind(this));
      });

      describe("when there's an http layer as the first layer of the Windshaft response (Named Map)", function () {
        beforeEach(function () {
          this.windshaftMapInstance = {
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
          };
        });

        it('should set the meta attribute of CartoDB layers from the Windshaft response', function () {
          this.layersCollection.reset([ this.cartoDBLayer1, this.torqueLayer ]);
          this.windshaftMap.createInstance({
            sourceLayerId: 'sourceLayerId'
          });

          // 'meta' attribute of the CartoDB layer has been set
          expect(this.cartoDBLayer1.get('meta')).toEqual('cartodb-metadata');
        });

        it('should set the meta and url attributes of Torque layers from the Windshaft response', function () {
          this.layersCollection.reset([ this.cartoDBLayer1, this.torqueLayer ]);
          this.windshaftMap.createInstance({
            sourceLayerId: 'sourceLayerId'
          });

          // 'meta' and 'urls' of the Torque layer has been set
          expect(this.torqueLayer.get('meta')).toEqual('torque-metadata');
          expect(this.torqueLayer.get('urls')).toEqual({
            tiles: [
              'http://rambo.wadus.com/api/v1/map/layergroupid/2/{z}/{x}/{y}.json.torque',
              'http://rambo.wadus.com/api/v1/map/layergroupid/2/{z}/{x}/{y}.json.torque',
              'http://rambo.wadus.com/api/v1/map/layergroupid/2/{z}/{x}/{y}.json.torque',
              'http://rambo.wadus.com/api/v1/map/layergroupid/2/{z}/{x}/{y}.json.torque'
            ],
            grids: []
          });
        });
      });

      describe("when there isn't a tiled layer as the first layer of the Windshaft response (Anonymous Map)", function () {
        beforeEach(function () {
          this.windshaftMapInstance = {
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
          };
        });

        it('should set the meta attribute of CartoDB layers from the Windshaft response', function () {
          this.layersCollection.reset([ this.cartoDBLayer1, this.torqueLayer ]);
          this.windshaftMap.createInstance({
            sourceLayerId: 'sourceLayerId'
          });

          // 'meta' attribute of the CartoDB layer has been set
          expect(this.cartoDBLayer1.get('meta')).toEqual('cartodb-metadata');
        });

        it('should set the meta and url attributes of Torque layers from the Windshaft response', function () {
          this.layersCollection.reset([ this.cartoDBLayer1, this.torqueLayer ]);
          this.windshaftMap.createInstance({
            sourceLayerId: 'sourceLayerId'
          });

          // 'meta' and 'urls' of the Torque layer has been set
          expect(this.torqueLayer.get('meta')).toEqual('torque-metadata');
          expect(this.torqueLayer.get('urls')).toEqual({
            tiles: [
              'http://rambo.wadus.com/api/v1/map/layergroupid/1/{z}/{x}/{y}.json.torque',
              'http://rambo.wadus.com/api/v1/map/layergroupid/1/{z}/{x}/{y}.json.torque',
              'http://rambo.wadus.com/api/v1/map/layergroupid/1/{z}/{x}/{y}.json.torque',
              'http://rambo.wadus.com/api/v1/map/layergroupid/1/{z}/{x}/{y}.json.torque'
            ],
            grids: []
          });
        });
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
        dataviewsCollection: this.dataviewsCollection,
        layersCollection: this.layersCollection
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
        dataviewsCollection: this.dataviewsCollection,
        layersCollection: this.layersCollection
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
        dataviewsCollection: this.dataviewsCollection,
        layersCollection: this.layersCollection
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
        dataviewsCollection: this.dataviewsCollection,
        layersCollection: this.layersCollection
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
        dataviewsCollection: this.dataviewsCollection,
        layersCollection: this.layersCollection
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
        dataviewsCollection: this.dataviewsCollection,
        layersCollection: this.layersCollection
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
        dataviewsCollection: this.dataviewsCollection,
        layersCollection: this.layersCollection
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
        dataviewsCollection: this.dataviewsCollection,
        layersCollection: this.layersCollection
      });

      windshaftMap.setAPIKey('API_KEY');

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
          dataviewsCollection: this.dataviewsCollection,
          layersCollection: this.layersCollection
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
          dataviewsCollection: this.dataviewsCollection,
          layersCollection: this.layersCollection
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
          dataviewsCollection: this.dataviewsCollection,
          layersCollection: this.layersCollection
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
          dataviewsCollection: this.dataviewsCollection,
          layersCollection: this.layersCollection
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

  describe('#getDataviewURL', function () {
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
        dataviewsCollection: this.dataviewsCollection,
        layersCollection: this.layersCollection
      });

      var dataviewURL = windshaftMap.getDataviewURL({ dataviewId: 'whatever', protocol: 'http' });
      expect(dataviewURL).toBeUndefined();

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
        dataviewsCollection: this.dataviewsCollection,
        layersCollection: this.layersCollection
      });

      dataviewURL = windshaftMap.getDataviewURL({ dataviewId: 'whatever', protocol: 'http' });
      expect(dataviewURL).toBeUndefined();
    });

    it('should return the URL for the given dataviewId and protocol', function () {
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
        dataviewsCollection: this.dataviewsCollection,
        layersCollection: this.layersCollection
      });

      var dataviewURL = windshaftMap.getDataviewURL({ dataviewId: 'dataviewId', protocol: 'http' });
      expect(dataviewURL).toEqual('http://example.com');

      dataviewURL = windshaftMap.getDataviewURL({ dataviewId: 'dataviewId', protocol: 'https' });
      expect(dataviewURL).toEqual('https://example.com');

      dataviewURL = windshaftMap.getDataviewURL({ dataviewId: 'dataviewId2', protocol: 'http' });
      expect(dataviewURL).toEqual('http://example2.com');
    });
  });
});

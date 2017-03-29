var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var log = require('cdb.log');
var Model = require('../../../src/core/model');
var Map = require('../../../src/geo/map');
var VisModel = require('../../../src/vis/vis');
var TorqueLayer = require('../../../src/geo/map/torque-layer');
var CartoDBLayer = require('../../../src/geo/map/cartodb-layer');
var HistogramDataviewModel = require('../../../src/dataviews/histogram-dataview-model');
var DataviewsCollection = require('../../../src/dataviews/dataviews-collection');
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

    // Disable ajax for these tests
    spyOn($, 'ajax').and.callFake(function () {});

    this.windshaftResponse = {
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

    this.vis = new VisModel();
    this.dataviewsCollection = new DataviewsCollection(null, {
      vis: this.vis
    });

    this.layersCollection = new Backbone.Collection();
    this.analysisCollection = new Backbone.Collection();
    this.modelUpdater = jasmine.createSpyObj('modelUpdater', ['updateModels', 'setErrors']);

    this.windshaftSettings = {
      urlTemplate: 'http://{user}.example.com',
      userName: 'rambo'
    };

    this.client = new WindshaftClient(this.windshaftSettings);

    this.cartoDBLayerGroup = new Model();
    this.cartoDBLayer1 = new CartoDBLayer({ id: '12345-67890' }, { vis: this.vis });
    this.cartoDBLayer2 = new CartoDBLayer({ id: '09876-54321' }, { vis: this.vis });
    this.torqueLayer = new TorqueLayer({}, { vis: this.vis });

    this.windshaftMap = new WindshaftMap({
      statTag: 'stat_tag'
    }, {
      client: this.client,
      modelUpdater: this.modelUpdater,
      dataviewsCollection: this.dataviewsCollection,
      layersCollection: this.layersCollection,
      analysisCollection: this.analysisCollection,
      windshaftSettings: this.windshaftSettings
    });
  });

  afterEach(function () {
    jasmine.clock().uninstall();
  });

  describe('.createInstance', function () {
    beforeEach(function () {
      this.map = new Map({
        view_bounds_sw: [],
        view_bounds_ne: []
      }, {
        layersFactory: {}
      });

      this.filter = new CategoryFilter({
        dataviewId: 'dataviewId'
      });

      this.dataview = new HistogramDataviewModel({
        id: 'dataviewId',
        type: 'list',
        source: { id: 'a0' }
      }, {
        map: this.map,
        vis: this.vis,
        windshaftMap: this.windshaftMap,
        layer: this.cartoDBLayer1,
        filter: this.filter,
        analysisCollection: this.analysisCollection
      });

      this.dataviewsCollection.add(this.dataview);
    });

    var MAX_NUMBER_OF_EQUAL_REQUESTS = 3;

    _.each(['success', 'error'], function (result) {
      describe('request limit (' + result + ')', function () {
        beforeEach(function () {
          this.options = { some: 'options' };
        });

        it('should not make the same request more than 3 times if nothing has changed and response is the same', function () {
          spyOn(log, 'error');
          spyOn(this.client, 'instantiateMap').and.callFake(function (options) {
            options[result]({ a: 'b' });
          });

          for (var i = 0; i < MAX_NUMBER_OF_EQUAL_REQUESTS; i++) {
            this.windshaftMap.createInstance(this.options);

            expect(this.client.instantiateMap).toHaveBeenCalled();
            this.client.instantiateMap.calls.reset();
          }

          this.windshaftMap.createInstance(this.options);

          expect(this.client.instantiateMap).not.toHaveBeenCalled();

          expect(log.error).toHaveBeenCalledWith('Maximum number of subsequent equal requests to the Maps API reached (3):', this.windshaftMap.toJSON(), { stat_tag: 'stat_tag' });
        });

        it('should make the request if request was done 3 times and response was different the last time', function () {
          var numberOfRequest = 0;
          spyOn(this.client, 'instantiateMap').and.callFake(function (options) {
            numberOfRequest += 1;
            var response = { a: 'b' };
            if (numberOfRequest === MAX_NUMBER_OF_EQUAL_REQUESTS) {
              response = { a: 'something different' };
            }
            options[result](response);
          });

          for (var i = 0; i < MAX_NUMBER_OF_EQUAL_REQUESTS; i++) {
            this.windshaftMap.createInstance(this.options);

            expect(this.client.instantiateMap).toHaveBeenCalled();
            this.client.instantiateMap.calls.reset();
          }

          this.windshaftMap.createInstance(this.options);

          expect(this.client.instantiateMap).toHaveBeenCalled();
        });

        describe('when max number of subsecuent identical requests (with identical responses) have been performed', function () {
          beforeEach(function () {
            spyOn(this.client, 'instantiateMap').and.callFake(function (options) {
              options[result]({ a: 'b' });
            });
            for (var i = 0; i < 3; i++) {
              this.windshaftMap.createInstance(this.options);
            }

            this.client.instantiateMap.calls.reset();
          });

          it('should make a request if payload has changed', function () {
            spyOn(this.windshaftMap, 'toJSON').and.returnValue({ something: 'different' });

            this.windshaftMap.createInstance(this.options);

            expect(this.client.instantiateMap).toHaveBeenCalled();
          });

          it('should make a request if options are different', function () {
            this.windshaftMap.createInstance({ different: 'options' });

            expect(this.client.instantiateMap).toHaveBeenCalled();
          });

          it('should make a request if filters have changed', function () {
            var options = _.extend(this.options, {includeFilters: true});
            this.filter.accept('something');

            this.windshaftMap.createInstance(options);

            expect(this.client.instantiateMap).toHaveBeenCalled();
          });
        });
      });
    });

    describe('when an exception is thrown/catched', function () {
      beforeEach(function () {
        spyOn(this.windshaftMap, 'toJSON').and.callFake(function () {
          throw new Error('something went wrong!');
        });

        this.successCallback = jasmine.createSpy('success');
        this.errorCallback = jasmine.createSpy('error');
        this.windshaftMap.createInstance({
          success: this.successCallback,
          error: this.errorCallback
        });
      });

      it('should set an error', function () {
        expect(this.modelUpdater.setErrors).toHaveBeenCalled();
        expect(this.modelUpdater.setErrors.calls.argsFor(0)[0][0].message).toEqual('something went wrong!');
      });

      it('should invoke the error callback', function () {
        expect(this.successCallback).not.toHaveBeenCalled();
        expect(this.errorCallback).toHaveBeenCalled();
      });
    });

    describe('when request succeeds', function () {
      beforeEach(function () {
        spyOn(this.client, 'instantiateMap').and.callFake(function (options) {
          options.success(this.windshaftResponse);
        }.bind(this));
      });

      it('should create an instance of the windshaft map', function () {
        this.layersCollection.reset([ this.cartoDBLayer1, this.cartoDBLayer2, this.torqueLayer ]);
        spyOn(this.windshaftMap, 'toJSON').and.returnValue({ foo: 'bar' });

        this.windshaftMap.createInstance({
          sourceId: 'sourceId'
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
          sourceId: 'sourceId',
          includeFilters: true
        });
        var args = this.client.instantiateMap.calls.mostRecent().args[0];

        // Filters are empty because no filter is active yet
        expect(args.params).toEqual({
          stat_tag: 'stat_tag'
        });

        this.filter.accept('category');

        // Recreate the instance again with filters
        this.windshaftMap.createInstance({
          sourceId: 'sourceId',
          includeFilters: true
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
          authToken: 'AUTH_TOKEN',
          statTag: 'stat_tag'
        }, { // eslint-disable-line
          client: this.client,
          modelUpdater: this.modelUpdater,
          dataviewsCollection: this.dataviewsCollection,
          layersCollection: this.layersCollection,
          analysisCollection: this.analysisCollection,
          windshaftSettings: this.windshaftSettings
        });

        this.windshaftMap.createInstance({
          sourceId: 'sourceId'
        });

        var args = this.client.instantiateMap.calls.mostRecent().args[0];
        expect(args.params).toEqual({
          stat_tag: 'stat_tag',
          api_key: 'API_KEY'
        });
      });

      it('should use the given AUTH_TOKEN when creating a new instance of the windshaft map', function () {
        this.layersCollection.reset([ this.cartoDBLayer1, this.cartoDBLayer2, this.torqueLayer ]);
        spyOn(this.windshaftMap, 'toJSON').and.returnValue({ foo: 'bar' });

        this.windshaftMap = new WindshaftMap({
          authToken: 'AUTH_TOKEN',
          statTag: 'stat_tag'
        }, { // eslint-disable-line
          client: this.client,
          modelUpdater: this.modelUpdater,
          dataviewsCollection: this.dataviewsCollection,
          layersCollection: this.layersCollection,
          analysisCollection: this.analysisCollection,
          windshaftSettings: this.windshaftSettings
        });

        this.windshaftMap.createInstance({
          sourceId: 'sourceId'
        });

        var args = this.client.instantiateMap.calls.mostRecent().args[0];
        expect(args.params).toEqual({
          stat_tag: 'stat_tag',
          auth_token: 'AUTH_TOKEN'
        });
      });

      it('should set the attributes of the new instance', function () {
        this.layersCollection.reset([ this.cartoDBLayer1, this.cartoDBLayer2, this.torqueLayer ]);
        this.windshaftMap.createInstance({
          sourceId: 'sourceId'
        });

        expect(this.windshaftMap.get('layergroupid')).toEqual('layergroupid');
        expect(this.windshaftMap.get('metadata')).toEqual(this.windshaftResponse.metadata);
      });

      it('should use the modelUpdater to update internal models', function () {
        this.windshaftMap.createInstance({
          sourceId: 'sourceId',
          forceFetch: 'forceFetch'
        });

        expect(this.modelUpdater.updateModels).toHaveBeenCalledWith(this.windshaftMap, 'sourceId', 'forceFetch');
      });
    });

    describe('when request fails', function () {
      beforeEach(function () {
        spyOn(this.client, 'instantiateMap').and.callFake(function (options) {
          options.error({
            errors: ['something went wrong']
          });
        });
        spyOn(log, 'error');
        this.errorCallback = jasmine.createSpy('errorCallback');

        this.windshaftMap.createInstance({
          error: this.errorCallback
        });
      });

      it('should invoke a given error callback', function () {
        expect(this.errorCallback).toHaveBeenCalledWith();
      });

      it('should should update models and use first error message', function () {
        expect(this.modelUpdater.setErrors).toHaveBeenCalled();
        var errors = this.modelUpdater.setErrors.calls.argsFor(0)[0];

        expect(errors.length).toEqual(1);
        expect(errors[0].message).toEqual('something went wrong');
      });

      it('should use errors with context when present', function () {
        this.modelUpdater.setErrors.calls.reset();
        this.client.instantiateMap.and.callFake(function (options) {
          options.error({
            errors_with_context: [{
              type: 'layer',
              subtype: 'layer-subtype',
              message: 'Something is wrong with this layer',
              layer: {
                id: 'layerID'
              }
            }]
          });
        });

        this.windshaftMap.createInstance();

        var errors = this.modelUpdater.setErrors.calls.argsFor(0)[0];

        expect(errors.length).toEqual(1);
        expect(errors[0].type).toEqual('layer-subtype');
        expect(errors[0].message).toEqual('Something is wrong with this layer');
        expect(errors[0].layerId).toEqual('layerID');
      });
    });
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
  });

  describe('.getBaseURL', function () {
    it("should return Windshaft's url if no CDN info is present", function () {
      this.windshaftMap.set({
        layergroupid: '0123456789'
      });
      expect(this.windshaftMap.getBaseURL()).toEqual('http://rambo.example.com/api/v1/map/0123456789');
    });

    it('should return the CDN URL for http when CDN info is present', function () {
      this.windshaftMap.set({
        layergroupid: '0123456789',
        cdn_url: {
          http: 'cdn.http.example.com',
          https: 'cdn.https.example.com'
        }
      });

      expect(this.windshaftMap.getBaseURL()).toEqual('http://cdn.http.example.com/rambo/api/v1/map/0123456789');
    });

    it('should return the CDN URL for https when CDN info is present', function () {
      this.windshaftSettings.urlTemplate = 'https://{user}.example.com';

      this.windshaftMap.set({
        layergroupid: '0123456789',
        cdn_url: {
          http: 'cdn.http.example.com',
          https: 'cdn.https.example.com'
        }
      });

      expect(this.windshaftMap.getBaseURL()).toEqual('https://cdn.https.example.com/rambo/api/v1/map/0123456789');
    });

    it('should use the CDN template', function () {
      this.windshaftMap.set({
        layergroupid: '0123456789',
        cdn_url: {
          http: 'cdn1.http.example.com',
          https: 'cdn1.https.example.com',
          templates: {
            http: {
              url: 'http://{s}.cdn2.http.example.com',
              subdomains: ['0', '1', '2']
            },
            https: {
              url: 'http://{s}.cdn2.https.example.com',
              subdomains: ['0', '1', '2']
            }
          }
        }
      });

      expect(this.windshaftMap.getBaseURL()).toEqual('http://{s}.cdn2.http.example.com/rambo/api/v1/map/0123456789');
    });
  });

  describe('.getDataviewMetadata', function () {
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
        client: this.client,
        modelUpdater: this.modelUpdater,
        dataviewsCollection: this.dataviewsCollection,
        layersCollection: this.layersCollection,
        analysisCollection: this.analysisCollection,
        windshaftSettings: this.windshaftSettings
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
        client: this.client,
        modelUpdater: this.modelUpdater,
        dataviewsCollection: this.dataviewsCollection,
        layersCollection: this.layersCollection,
        analysisCollection: this.analysisCollection,
        windshaftSettings: this.windshaftSettings
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
        client: this.client,
        modelUpdater: this.modelUpdater,
        dataviewsCollection: this.dataviewsCollection,
        layersCollection: this.layersCollection,
        analysisCollection: this.analysisCollection,
        windshaftSettings: this.windshaftSettings
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
        client: this.client,
        modelUpdater: this.modelUpdater,
        dataviewsCollection: this.dataviewsCollection,
        layersCollection: this.layersCollection,
        analysisCollection: this.analysisCollection,
        windshaftSettings: this.windshaftSettings
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

  describe('.getSupportedSubdomains', function () {
    beforeEach(function () {
      this.windshaftMap.set({
        cdn_url: {
          templates: {
            http: {
              url: 'http://cdn.carto.com',
              subdomains: ['a', 'b']
            },
            https: {
              url: 'http://cdn.carto.com',
              subdomains: ['c', 'd']
            }
          }
        }
      });
    });

    it('should return supported subdomains if urlTemplate uses http', function () {
      this.windshaftSettings.urlTemplate = 'http://{username}.carto.com';

      expect(this.windshaftMap.getSupportedSubdomains()).toEqual(['a', 'b']);
    });

    it('should return not subdomains if urlTemplate uses https', function () {
      this.windshaftSettings.urlTemplate = 'https://{username}.carto.com';

      expect(this.windshaftMap.getSupportedSubdomains()).toEqual(['c', 'd']);
    });
  });
});

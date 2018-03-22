var _ = require('underscore');
var CartoDBLayer = require('../../../src/geo/map/cartodb-layer');
var TorqueLayer = require('../../../src/geo/map/torque-layer');
var LayersCollection = require('../../../src/geo/map/layers');
var Backbone = require('backbone');
var ModelUpdater = require('../../../src/windshaft-integration/model-updater');
var WindshaftError = require('../../../src/windshaft/error');
var ResponseWrapper = require('../../../src/windshaft/response');
var CartoDBLayerGroup = require('../../../src/geo/cartodb-layer-group');
var Dataview = require('../../../src/dataviews/dataview-model-base');
var AnalysisModel = require('../../../src/analysis/analysis-model');
var MapModel = require('../../../src/geo/map');
var createEngine = require('../fixtures/engine.fixture.js');
var BoundingBoxFilter = require('../../../src/windshaft/filters/bounding-box');
var MapModelBoundingBoxAdapter = require('../../../src/geo/adapters/map-model-bounding-box-adapter');

describe('src//model-updater', function () {
  var boundingBoxFilter;
  var engineMock;
  var serverResponse;
  var windshaftSettings;

  beforeEach(function () {
    engineMock = createEngine();

    windshaftSettings = {
      urlTemplate: 'http://{user}.cartodb.com:80',
      userName: 'cartojs-test'
    };

    serverResponse = new ResponseWrapper(windshaftSettings, {
      'layergroupid': '9d7bf465e45113123bf9949c2a4f0395:0',
      'metadata': {
        'layers': [],
        'dataviews': {},
        'analyses': []
      }
    });

    spyOn(serverResponse, 'getBaseURL').and.callFake(function (subdomain) {
      return 'http://' + (subdomain ? subdomain + '.' : '') + 'documentation.carto.com';
    });
    spyOn(serverResponse, 'getLayerIndexesByType').and.returnValue([0]);
    spyOn(serverResponse, 'getSupportedSubdomains').and.returnValue(['']);

    this.layersCollection = new LayersCollection();

    this.layerGroupModel = new CartoDBLayerGroup({}, {
      layersCollection: this.layersCollection
    });
    this.dataviewsCollection = new Backbone.Collection();

    var mapModel = new MapModel({
      bounds: [[40.2813, -3.90592], [40.5611, -3.47532]]
    }, {
      layersFactory: {},
      layersCollection: this.LayersCollection
    });
    boundingBoxFilter = new BoundingBoxFilter(new MapModelBoundingBoxAdapter(mapModel));

    this.modelUpdater = new ModelUpdater({
      layerGroupModel: this.layerGroupModel,
      layersCollection: this.layersCollection,
      dataviewsCollection: this.dataviewsCollection
    });

    // _getProtocol uses window.location.protocol internally, and that returns "file:"
    // when running the test suite using the jasmine test runner, so we need to fake it
    spyOn(this.modelUpdater, '_getProtocol').and.returnValue('http');
  });

  describe('.updateModels', function () {
    beforeEach(function () {
      serverResponse.getBaseURL.and.returnValue('http://{s}.documentation.carto.com/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0');
    });

    describe('layerGroupModel', function () {
      beforeEach(function () {
        var analysis = new AnalysisModel({ id: 'a1', type: 'source', query: 'SELECT * FROM table' }, { engine: engineMock, camshaftReference: camshaftReferenceMock });
        var layer1 = new CartoDBLayer({ source: analysis }, { engine: engineMock });
        var layer2 = new CartoDBLayer({ source: analysis }, { engine: engineMock });

        this.layersCollection.reset([layer1, layer2]);

        serverResponse.getLayerIndexesByType.and.callFake(function (layerType) {
          if (layerType === 'mapnik') {
            return ([1, 2]);
          }
        });
      });

      it('should set indexOfLayersInWindshaft', function () {
        this.modelUpdater.updateModels(serverResponse);
        expect(this.layerGroupModel.get('indexOfLayersInWindshaft')).toEqual([1, 2]);
      });

      var testCases = [{
        name: 'with subdomains',
        baseURL: 'http://{s}.documentation.carto.com/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0',
        supportedSubdomains: ['0', '1', '2', '3'],
        expectedTileURLTemplate: 'http://{s}.documentation.carto.com/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0/1,2/{z}/{x}/{y}.png',
        expectedGridURLTemplatesWithSubdomains: {
          0: [
            'http://0.documentation.carto.com/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0/1/{z}/{x}/{y}.grid.json',
            'http://1.documentation.carto.com/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0/1/{z}/{x}/{y}.grid.json',
            'http://2.documentation.carto.com/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0/1/{z}/{x}/{y}.grid.json',
            'http://3.documentation.carto.com/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0/1/{z}/{x}/{y}.grid.json'
          ],
          1: [
            'http://0.documentation.carto.com/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0/2/{z}/{x}/{y}.grid.json',
            'http://1.documentation.carto.com/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0/2/{z}/{x}/{y}.grid.json',
            'http://2.documentation.carto.com/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0/2/{z}/{x}/{y}.grid.json',
            'http://3.documentation.carto.com/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0/2/{z}/{x}/{y}.grid.json'
          ]
        },
        expectedAttributesBaseURL: {
          0: /http:\/\/[0-3]\.documentation\.carto\.com\/api\/v1\/map\/90e64f1b9145961af7ba36d71b887dd2:0\/1\/attributes/,
          1: /http:\/\/[0-3]\.documentation\.carto\.com\/api\/v1\/map\/90e64f1b9145961af7ba36d71b887dd2:0\/2\/attributes/
        }
      }, {
        name: 'with no subdomains',
        baseURL: 'http://documentation.carto.com/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0',
        supportedSubdomains: [],
        expectedTileURLTemplate: 'http://documentation.carto.com/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0/1,2/{z}/{x}/{y}.png',
        expectedGridURLTemplatesWithSubdomains: {
          0: [
            'http://documentation.carto.com/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0/1/{z}/{x}/{y}.grid.json'
          ],
          1: [
            'http://documentation.carto.com/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0/2/{z}/{x}/{y}.grid.json'
          ]
        },
        expectedAttributesBaseURL: {
          0: /http:\/\/documentation\.carto\.com\/api\/v1\/map\/90e64f1b9145961af7ba36d71b887dd2:0\/1\/attributes/,
          1: /http:\/\/documentation\.carto\.com\/api\/v1\/map\/90e64f1b9145961af7ba36d71b887dd2:0\/2\/attributes/
        }
      }];

      _.each(testCases, function (testCase) {
        describe(testCase.name, function () {
          beforeEach(function () {
            serverResponse.getBaseURL.and.returnValue(testCase.baseURL);
            serverResponse.getSupportedSubdomains.and.returnValue(testCase.supportedSubdomains);
            this.modelUpdater.updateModels(serverResponse);
          });

          describe('tile urls', function () {
            it('should generate tile URLs', function () {
              expect(this.layerGroupModel.getTileURLTemplate()).toEqual(testCase.expectedTileURLTemplate);
            });
          });

          describe('grid urls', function () {
            it('should generate grid URLs', function () {
              expect(this.layerGroupModel.getGridURLTemplatesWithSubdomains(0)).toEqual(testCase.expectedGridURLTemplatesWithSubdomains[0]);
              expect(this.layerGroupModel.getGridURLTemplatesWithSubdomains(1)).toEqual(testCase.expectedGridURLTemplatesWithSubdomains[1]);
            });
          });

          describe('attribute urls', function () {
            it('should generate attribute URLs', function () {
              expect(this.layerGroupModel.getAttributesBaseURL(0)).toMatch(testCase.expectedAttributesBaseURL[0]);
              expect(this.layerGroupModel.getAttributesBaseURL(1)).toMatch(testCase.expectedAttributesBaseURL[1]);
            });
          });
        });
      });
    });

    describe('layer models', function () {
      it('should mark CartoDB and torque layer models as ok', function () {
        var analysis = new AnalysisModel({ id: 'a1', type: 'source', query: 'SELECT * FROM table' }, { engine: engineMock, camshaftReference: camshaftReferenceMock });

        var layer0 = new Backbone.Model({ type: 'Tiled' });
        var layer1 = new CartoDBLayer({ source: analysis }, { engine: engineMock });
        var layer2 = new TorqueLayer({ source: analysis }, { engine: engineMock });

        spyOn(layer1, 'setOk');
        spyOn(layer2, 'setOk');

        this.layersCollection.reset([layer0, layer1, layer2]);
        this.modelUpdater.updateModels(serverResponse);

        expect(layer1.setOk).toHaveBeenCalled();
        expect(layer2.setOk).toHaveBeenCalled();
      });

      it('should set tileURLTemplates attribute of torque layer models', function () {
        var analysis = new AnalysisModel({ id: 'a1', type: 'source', query: 'SELECT * FROM table' }, { engine: engineMock, camshaftReference: camshaftReferenceMock });

        var layer0 = new Backbone.Model({ type: 'Tiled' });
        var layer1 = new CartoDBLayer({ source: analysis }, { engine: engineMock });
        var layer2 = new TorqueLayer({ source: analysis }, { engine: engineMock });
        this.layersCollection.reset([layer0, layer1, layer2]);

        this.modelUpdater.updateModels(serverResponse);

        expect(layer2.get('tileURLTemplates')).toEqual([
          'http://{s}.documentation.carto.com/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0/0/{z}/{x}/{y}.json.torque'
        ]);
      });
    });

    describe('legend models', function () {
      it('should "mark" all legend models as success', function () {
        var analysis = new AnalysisModel({ id: 'a1', type: 'source', query: 'SELECT * FROM table' }, { engine: engineMock, camshaftReference: camshaftReferenceMock });
        var layer = new CartoDBLayer({ source: analysis }, { engine: engineMock });

        this.layersCollection.reset([layer]);
        this.modelUpdater.updateModels(serverResponse, 'sourceId', 'forceFetch');

        expect(layer.legends.choropleth.isSuccess()).toBeTruthy();
        expect(layer.legends.bubble.isSuccess()).toBeTruthy();
        expect(layer.legends.category.isSuccess()).toBeTruthy();
      });

      it('should update model for choropleth legends', function () {
        var analysis = new AnalysisModel({ id: 'a1', type: 'source', query: 'SELECT * FROM table' }, { engine: engineMock, camshaftReference: camshaftReferenceMock });

        serverResponse = new ResponseWrapper(windshaftSettings, {
          'layergroupid': '9d7bf465e45113123bf9949c2a4f0395:0',
          'metadata': {
            layers: [
              {
                type: 'mapnik',
                id: '923b7812-2d56-41c6-ac15-3ce430db090f',
                meta: {
                  stats: [],
                  cartocss: 'cartocss',
                  'cartocss_meta': {
                    rules: [
                      {
                        'selector': '#layer',
                        'prop': 'polygon-fill',
                        'mapping': '>',
                        'buckets': [
                          {
                            'filter': {
                              'type': 'range',
                              'start': 0,
                              'end': 1000
                            },
                            'value': '#AAAAAA'
                          },
                          {
                            'filter': {
                              'type': 'range',
                              'start': 1000,
                              'end': 2000
                            },
                            'value': '#BBBBBB'
                          },
                          {
                            'filter': {
                              'type': 'range',
                              'start': 2000,
                              'end': 3000
                            },
                            'value': '#CCCCCC'
                          }
                        ],
                        'stats': {
                          'filter_avg': 1975
                        }
                      }
                    ]
                  }
                }
              }
            ]
          }
        });

        var layer = new CartoDBLayer({ source: analysis }, { engine: engineMock });

        this.layersCollection.reset([layer]);

        this.modelUpdater.updateModels(serverResponse, 'sourceId', 'forceFetch');

        expect(layer.legends.choropleth.get('colors')).toEqual([
          { label: '0', value: '#AAAAAA' },
          { label: '', value: '#BBBBBB' },
          { label: '3000', value: '#CCCCCC' }
        ]);
        expect(layer.legends.choropleth.isSuccess()).toBeTruthy();
      });

      it('should update model for category legends', function () {
        var analysis = new AnalysisModel({ id: 'a1', type: 'source', query: 'SELECT * FROM table' }, { engine: engineMock, camshaftReference: camshaftReferenceMock });

        serverResponse = new ResponseWrapper(windshaftSettings, {
          'layergroupid': '9d7bf465e45113123bf9949c2a4f0395:0',
          'metadata': {
            layers: [
              {
                'type': 'mapnik',
                'id': '923b7812-2d56-41c6-ac15-b090f3ce430d',
                'meta': {
                  'stats': [],
                  'cartocss': 'cartocss',
                  'cartocss_meta': {
                    'rules': [
                      {
                        'selector': '#layer',
                        'prop': 'marker-fill',
                        'mapping': '=',
                        'buckets': [
                          {
                            'filter': {
                              'type': 'category',
                              'name': 'Category 1'
                            },
                            'value': '#AAAAAA'
                          },
                          {
                            'filter': {
                              'type': 'category',
                              'name': 'Category 2'
                            },
                            'value': '#BBBBBB'
                          },
                          {
                            'filter': {
                              'type': 'default'
                            },
                            'value': '#CCCCCC'
                          }
                        ],
                        'stats': {
                          'filter_avg': 3500
                        }
                      }
                    ]
                  }
                }
              }
            ]
          }
        });

        var layer = new CartoDBLayer({ source: analysis }, { engine: engineMock });

        this.layersCollection.reset([layer]);

        this.modelUpdater.updateModels(serverResponse, 'sourceId', 'forceFetch');

        expect(layer.legends.category.get('categories')).toEqual([
          { title: 'Category 1', icon: '', color: '#AAAAAA' },
          { title: 'Category 2', icon: '', color: '#BBBBBB' }
        ]);
        expect(layer.legends.choropleth.isSuccess()).toBeTruthy();
      });

      it('should update model for bubble legends', function () {
        var analysis = new AnalysisModel({ id: 'a1', type: 'source', query: 'SELECT * FROM table' }, { engine: engineMock, camshaftReference: camshaftReferenceMock });

        serverResponse = new ResponseWrapper(windshaftSettings, {
          'layergroupid': '9d7bf465e45113123bf9949c2a4f0395:0',
          'metadata': {
            layers: [
              {
                'type': 'mapnik',
                'id': '923b7812-2d56-41c6-ac15-b090f3ce430d',
                'meta': {
                  'stats': [],
                  'cartocss': 'cartocss',
                  'cartocss_meta': {
                    'rules': [
                      {
                        'selector': '#layer',
                        'prop': 'marker-width',
                        'mapping': '>',
                        'buckets': [
                          {
                            'filter': {
                              'type': 'range',
                              'start': 10,
                              'end': 1000
                            },
                            'value': 10
                          },
                          {
                            'filter': {
                              'type': 'range',
                              'start': 1000,
                              'end': 2000
                            },
                            'value': 14
                          },
                          {
                            'filter': {
                              'type': 'range',
                              'start': 2000,
                              'end': 3000
                            },
                            'value': 20
                          },
                          {
                            'filter': {
                              'type': 'range',
                              'start': 3000,
                              'end': 4000
                            },
                            'value': 26
                          },
                          {
                            'filter': {
                              'type': 'range',
                              'start': 4000,
                              'end': 5000
                            },
                            'value': 32
                          }
                        ],
                        'stats': {
                          'filter_avg': 3500
                        }
                      }
                    ]
                  }
                }
              }
            ]
          }
        });

        var layer = new CartoDBLayer({ source: analysis }, { engine: engineMock });

        this.layersCollection.reset([layer]);

        this.modelUpdater.updateModels(serverResponse, 'sourceId', 'forceFetch');

        expect(layer.legends.bubble.get('values')).toEqual([
          10, 1000, 2000, 3000, 4000, 5000
        ]);
        expect(layer.legends.bubble.get('sizes')).toEqual([
          10, 14, 20, 26, 32
        ]);
        expect(layer.legends.bubble.get('avg')).toEqual(3500);
        expect(layer.legends.bubble.isSuccess()).toBeTruthy();
      });

      it('should set legend state to "error" if adapter fails to generate attrs from rule', function () {
        var analysis = new AnalysisModel({ id: 'a1', type: 'source', query: 'SELECT * FROM table' }, { engine: engineMock, camshaftReference: camshaftReferenceMock });

        serverResponse = new ResponseWrapper(windshaftSettings, {
          'layergroupid': '9d7bf465e45113123bf9949c2a4f0395:0',
          'metadata': {
            layers: [
              {
                'type': 'mapnik',
                'id': '923b7812-2d56-41c6-ac15-b090f3ce430d',
                'meta': {
                  'stats': [],
                  'cartocss': 'cartocss',
                  'cartocss_meta': {
                    'rules': [
                      {
                        'prop': 'marker-width',
                        'mapping': '>'
                      }
                    ]
                  }
                }
              }
            ]
          }
        });

        var layer = new CartoDBLayer({ source: analysis }, { engine: engineMock });

        this.layersCollection.reset([layer]);

        this.modelUpdater.updateModels(serverResponse, 'sourceId', 'forceFetch');

        expect(layer.legends.bubble.isError()).toBeTruthy();
      });
    });

    describe('dataview models', function () {
      it('should update dataview models', function () {
        var dataview1 = new Dataview({
          id: 'a1',
          source: new AnalysisModel({}, { engine: engineMock, camshaftReference: camshaftReferenceMock })
        }, {
          bboxFilter: boundingBoxFilter,
          engine: engineMock
        });
        var dataview2 = new Dataview({
          id: 'a2',
          source: new AnalysisModel({}, { engine: engineMock, camshaftReference: camshaftReferenceMock })
        }, {
          bboxFilter: boundingBoxFilter,
          engine: engineMock
        });
        this.dataviewsCollection.reset([dataview1, dataview2]);

        serverResponse.getDataviewMetadata = function (dataviewId) {
          if (dataviewId === 'a1') {
            return {
              url: {
                http: 'http://example1.com',
                https: 'https://example1.com'
              }
            };
          }
          if (dataviewId === 'a2') {
            return {
              url: {
                http: 'http://example2.com',
                https: 'https://example2.com'
              }
            };
          }
        };

        spyOn(dataview1, 'set').and.callThrough();

        this.modelUpdater.updateModels(serverResponse, 'sourceId', 'forceFetch');

        expect(dataview1.set).toHaveBeenCalledWith({
          url: 'http://example1.com'
        }, {
          sourceId: 'sourceId',
          forceFetch: 'forceFetch'
        });

        expect(dataview1.get('url')).toEqual('http://example1.com');
        expect(dataview2.get('url')).toEqual('http://example2.com');
      });
    });

    describe('analysis models', function () {
      it('should update analysis models and set analysis state to "ok"', function () {
        var analysis1 = new AnalysisModel({ id: 'a1', type: 'source', query: 'SELECT * FROM table' }, { engine: engineMock, camshaftReference: camshaftReferenceMock });
        var analysis2 = new AnalysisModel({ id: 'a2', type: 'source', query: 'SELECT * FROM table' }, { engine: engineMock, camshaftReference: camshaftReferenceMock });
        var layer = new CartoDBLayer({ source: analysis1 }, { engine: engineMock });
        var dataview = new Dataview({ id: 'a1', source: analysis2 }, { bboxFilter: boundingBoxFilter, engine: engineMock });

        spyOn(analysis1, 'setOk');
        spyOn(analysis2, 'setOk');
        spyOn(serverResponse, 'getAnalysisNodeMetadata').and.callFake(function (analysisId) {
          return { status: 'status_' + analysisId, query: 'query_' + analysisId, url: { http: 'url_' + analysisId } };
        });

        this.layersCollection.reset([layer]);
        this.dataviewsCollection.reset([dataview]);
        this.modelUpdater.updateModels(serverResponse);

        expect(analysis1.get('status')).toEqual('status_a1');
        expect(analysis1.get('query')).toEqual('query_a1');
        expect(analysis1.get('url')).toEqual('url_a1');
        expect(analysis1.setOk).toHaveBeenCalled();
        expect(analysis2.get('status')).toEqual('status_a2');
        expect(analysis2.get('query')).toEqual('query_a2');
        expect(analysis2.get('url')).toEqual('url_a2');
        expect(analysis2.setOk).toHaveBeenCalled();
      });

      it('should update analysis models and set status to "failed"', function () {
        var analysis1 = new AnalysisModel({ id: 'a1', type: 'source', query: 'SELECT * FROM table' }, { engine: engineMock, camshaftReference: camshaftReferenceMock });
        var analysis2 = new AnalysisModel({ id: 'a2', type: 'source', query: 'SELECT * FROM table' }, { engine: engineMock, camshaftReference: camshaftReferenceMock });
        var layer = new CartoDBLayer({ source: analysis1 }, { engine: engineMock });
        var dataview = new Dataview({ id: 'a1', source: analysis2 }, { bboxFilter: boundingBoxFilter, engine: engineMock });

        spyOn(serverResponse, 'getAnalysisNodeMetadata').and.callFake(function (analysisId) {
          return { error_message: 'fake_error_message', status: 'failed', query: 'query_' + analysisId, url: { http: 'url_' + analysisId } };
        });

        this.layersCollection.reset([layer]);
        this.dataviewsCollection.reset([dataview]);
        this.modelUpdater.updateModels(serverResponse);

        expect(analysis1.get('status')).toEqual('failed');
        expect(analysis1.get('error')).toEqual({ message: 'fake_error_message' });
        expect(analysis2.get('status')).toEqual('failed');
        expect(analysis2.get('error')).toEqual({ message: 'fake_error_message' });
      });

      it('should not update attributes that are original params (eg: query)', function () {
        var analysis1 = new AnalysisModel({ id: 'a1', type: 'source', query: 'original_query' }, { engine: engineMock, camshaftReference: camshaftReferenceMock });
        var layer = new CartoDBLayer({ source: analysis1 }, { engine: engineMock });

        spyOn(analysis1, 'getParamNames').and.returnValue(['query']);
        spyOn(serverResponse, 'getAnalysisNodeMetadata').and.callFake(function (analysisId) {
          return { status: 'new_status', query: 'query_' + analysisId, url: { http: 'new_url' } };
        });

        this.layersCollection.reset([layer]);
        this.dataviewsCollection.reset([]);
        this.modelUpdater.updateModels(serverResponse);

        expect(analysis1.get('status')).toEqual('new_status');
        expect(analysis1.get('query')).toEqual('original_query');
        expect(analysis1.get('url')).toEqual('new_url');
      });
    });
  });

  describe('.setErrors', function () {
    it('should set analysis status to "error"', function () {
      var analysisModel = new AnalysisModel({ id: 'a1', type: 'source', query: 'SELECT * FROM table' }, { engine: engineMock, camshaftReference: camshaftReferenceMock });
      var layer = new CartoDBLayer({ source: analysisModel }, { engine: engineMock });

      spyOn(analysisModel, 'setError');

      this.layersCollection.reset([layer]);
      this.dataviewsCollection.reset([]);

      this.modelUpdater.setErrors([
        new WindshaftError({
          type: 'analysis',
          message: 'fake_error_mesagge"',
          analysis: {
            id: 'fake_analysis_id',
            node_id: 'a1',
            context: {
              something: 'fake_error_context'
            }
          }
        })
      ]);

      expect(analysisModel.setError).toHaveBeenCalled();
      var error = analysisModel.setError.calls.argsFor(0)[0];
      expect(error.analysisId).toEqual('a1');
      expect(error.message).toEqual('fake_error_mesagge"');
      expect(error.context).toEqual({ something: 'fake_error_context' });
    });

    it('should "mark" layer as erroroneus', function () {
      var layer = new Backbone.Model({
        id: 'LAYER_ID'
      });
      layer.setError = jasmine.createSpy('setError');

      this.layersCollection.reset([layer]);

      this.modelUpdater.setErrors([
        new WindshaftError({
          type: 'layer',
          subtype: 'turbo-carto',
          message: 'turbo-carto: something went wrong',
          layer: {
            index: 0,
            id: 'LAYER_ID',
            type: 'cartodb',
            context: {
              selector: '#layer',
              source: {
                start: {
                  line: 1,
                  column: 10
                },
                end: {
                  line: 1,
                  column: 61
                }
              }
            }
          }
        })
      ]);

      expect(layer.setError).toHaveBeenCalled();
      var error = layer.setError.calls.argsFor(0)[0];

      expect(error.type).toEqual('layer');
      expect(error.subtype).toEqual('turbo-carto');
      expect(error.layerId).toEqual('LAYER_ID');
      expect(error.message).toEqual('turbo-carto: something went wrong');
      expect(error.context).toEqual({
        selector: '#layer',
        source: {
          start: {
            line: 1,
            column: 10
          },
          end: {
            line: 1,
            column: 61
          }
        }
      });
    });

    it('should "mark" legend models as erroroneus', function () {
      var layer1 = new CartoDBLayer({}, { engine: engineMock });
      var layer2 = new CartoDBLayer({}, { engine: engineMock });

      expect(layer1.legends.bubble.isError()).toBeFalsy();
      expect(layer1.legends.category.isError()).toBeFalsy();
      expect(layer1.legends.choropleth.isError()).toBeFalsy();

      expect(layer2.legends.bubble.isError()).toBeFalsy();
      expect(layer2.legends.category.isError()).toBeFalsy();
      expect(layer2.legends.choropleth.isError()).toBeFalsy();

      this.layersCollection.reset([layer1, layer2]);

      this.modelUpdater.setErrors();

      expect(layer1.legends.bubble.isError()).toBeTruthy();
      expect(layer1.legends.category.isError()).toBeTruthy();
      expect(layer1.legends.choropleth.isError()).toBeTruthy();

      expect(layer2.legends.bubble.isError()).toBeTruthy();
      expect(layer2.legends.category.isError()).toBeTruthy();
      expect(layer2.legends.choropleth.isError()).toBeTruthy();
    });
  });
});

var camshaftReferenceMock = {
  getSourceNamesForAnalysisType: function (analysisType) {
    var map = {
      'analysis-type-1': ['source1', 'source2'],
      'trade-area': ['source'],
      'estimated-population': ['source'],
      'sql-function': ['source', 'target']
    };
    return map[analysisType];
  },
  getParamNamesForAnalysisType: function (analysisType) {
    var map = {
      'analysis-type-1': ['attribute1', 'attribute2'],
      'trade-area': ['kind', 'time'],
      'estimated-population': ['columnName']
    };

    return map[analysisType];
  }
};

var CartoDBLayer = require('../../../src/geo/map/cartodb-layer');
var LayersCollection = require('../../../src/geo/map/layers');
var Backbone = require('backbone');
var ModelUpdater = require('../../../src/vis/model-updater');
var WindshaftError = require('../../../src/windshaft/error');

describe('src/vis/model-updater', function () {
  beforeEach(function () {
    this.fakeVis = jasmine.createSpyObj('vis', ['reload']);

    // TODO: Use the real things
    this.windshaftMap = new Backbone.Model({
      urlTemplate: 'http://{user}.carto.com:80',
      userName: 'documentation'
    });
    this.windshaftMap.getBaseURL = jasmine.createSpy('getBaseURL').and.returnValue('http://documentation.carto.com');
    this.windshaftMap.getLayerMetadata = jasmine.createSpy('getLayerMetadata').and.callFake(function () {
      return 'metadata';
    });
    this.windshaftMap.getTiles = jasmine.createSpy('getTiles').and.returnValue('tileJSON');
    this.windshaftMap.getLayerIndexesByType = jasmine.createSpy('getLayerIndexesByType').and.returnValue([0]);
    this.windshaftMap.getSupportedSubdomains = jasmine.createSpy('getSupportedSubdomains').and.returnValue(['']);

    this.visModel = new Backbone.Model();
    this.visModel.setOk = jasmine.createSpy('setOk');
    this.visModel.setError = jasmine.createSpy('setError');
    this.layerGroupModel = new Backbone.Model();
    this.layerGroupModel.layers = new Backbone.Collection();
    this.layersCollection = new LayersCollection();
    this.analysisCollection = new Backbone.Collection();
    this.dataviewsCollection = new Backbone.Collection();

    this.modelUpdater = new ModelUpdater({
      visModel: this.visModel,
      layerGroupModel: this.layerGroupModel,
      layersCollection: this.layersCollection,
      dataviewsCollection: this.dataviewsCollection,
      analysisCollection: this.analysisCollection
    });

    // _getProtocol uses window.location.protocol internally, and that returns "file:"
    // when running the test suite using the jasmine test runner, so we need to fake it
    spyOn(this.modelUpdater, '_getProtocol').and.returnValue('http');
  });

  describe('.updateModels', function () {
    beforeEach(function () {
      // TODO: Remove this!
      this.windshaftMap.getTiles.and.returnValue({
        tiles: [
          'http://documentation.carto.com/{z}/{x}/{y}.png'
        ],
        grids: [
          'http://documentation.carto.com/{z}/{x}/{y}/grid.json'
        ]
      });
      this.windshaftMap.getBaseURL.and.returnValue('http://documentation.carto.com/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0');
    });

    describe('layerGroupModel', function () {
      it('should set the baseURL the layerGroupModel', function () {
        expect(this.layerGroupModel.get('baseURL')).not.toBeDefined();

        this.modelUpdater.updateModels(this.windshaftMap);

        // Assert that layerGroup has been updated
        expect(this.layerGroupModel.get('baseURL')).toEqual('http://documentation.carto.com/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0');
      });

      describe('tile urls', function () {
        it('should generate tile URLs', function () {
          var layer1 = new CartoDBLayer({}, { vis: this.visModel });
          var layer2 = new CartoDBLayer({}, { vis: this.visModel });

          this.layersCollection.reset([ layer1, layer2 ]);
          this.layerGroupModel.layers.reset([ layer1, layer2 ]);

          // For Windshaft, layers are in positions 0 and 1
          this.windshaftMap.getLayerIndexesByType.and.returnValue([0, 1]);

          this.modelUpdater.updateModels(this.windshaftMap);

          expect(this.layerGroupModel.get('urls').tiles.length).toEqual(1);

          // Tile URL template will fetch tiles for layers #0 and #1
          expect(this.layerGroupModel.get('urls').tiles[0]).toEqual('http://documentation.carto.com/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0/0,1/{z}/{x}/{y}.png');
        });

        it('should not include indexes for hidden layers in tile URLs', function () {
          var layer1 = new CartoDBLayer({}, { vis: this.visModel });
          var layer2 = new CartoDBLayer({}, { vis: this.visModel });

          // Hide the first CartoDB layer
          layer1.set('visible', false, { silent: true });

          this.layersCollection.reset([ layer1, layer2 ]);
          this.layerGroupModel.layers.reset([ layer1, layer2 ]);

          // For Windshaft, layers are in positions 1 and 2
          this.windshaftMap.getLayerIndexesByType.and.returnValue([1, 2]);

          this.modelUpdater.updateModels(this.windshaftMap);

          expect(this.layerGroupModel.get('urls').tiles.length).toEqual(1);

          // Tile URL template will only fetch tiles for layer #2
          expect(this.layerGroupModel.get('urls').tiles[0]).toEqual('http://documentation.carto.com/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0/2/{z}/{x}/{y}.png');
        });

        it('when all layers are hidden', function () {
          var layer1 = new CartoDBLayer({}, { vis: this.visModel });
          var layer2 = new CartoDBLayer({}, { vis: this.visModel });

          // Hide all layers
          layer1.set('visible', false, { silent: true });
          layer2.set('visible', false, { silent: true });

          this.layersCollection.reset([ layer1, layer2 ]);
          this.layerGroupModel.layers.reset([ layer1, layer2 ]);

          // For Windshaft, layers are in positions 1 and 2
          this.windshaftMap.getLayerIndexesByType.and.returnValue([1, 2]);

          this.modelUpdater.updateModels(this.windshaftMap);

          // No URLs have been generated (no tiles should be fetched)
          expect(this.layerGroupModel.get('urls').tiles.length).toEqual(0);
        });

        it('should include subdomains if map supports it', function () {
          this.windshaftMap.getSupportedSubdomains.and.returnValue(['0', '1', '2', '3']);

          var layer1 = new CartoDBLayer({}, { vis: this.visModel });

          this.layersCollection.reset([ layer1 ]);
          this.layerGroupModel.layers.reset([ layer1 ]);

          // For Windshaft, layers are in positions 1 and 2
          this.windshaftMap.getLayerIndexesByType.and.returnValue([1]);

          this.modelUpdater.updateModels(this.windshaftMap);

          // No URLs have been generated (no tiles should be fetched)
          expect(this.layerGroupModel.get('urls').tiles).toEqual([
            'http://documentation.carto.com/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0/1/{z}/{x}/{y}.png',
            'http://documentation.carto.com/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0/1/{z}/{x}/{y}.png',
            'http://documentation.carto.com/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0/1/{z}/{x}/{y}.png',
            'http://documentation.carto.com/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0/1/{z}/{x}/{y}.png'
          ]);
        });
      });
    });

    it('should update layer models', function () {
      var layer0 = new Backbone.Model({ type: 'Tiled' });
      var layer1 = new CartoDBLayer({}, { vis: this.visModel });
      layer1.setOk = jasmine.createSpy();
      var layer2 = new Backbone.Model({ type: 'torque' });
      layer2.setOk = jasmine.createSpy();
      this.layersCollection.reset([ layer0, layer1, layer2 ]);

      this.windshaftMap.getLayerMetadata.and.callFake(function (index) {
        if (index === 0) {
          return 'metadataLayer0';
        }
        if (index === 1) {
          return 'metadataLayer1';
        }
      });

      this.windshaftMap.getTiles.and.callFake(function (layerType) {
        if (layerType === 'torque') {
          return {
            tiles: [
              'http://documentation.carto.com/{z}/{x}/{y}.torque'
            ]
          };
        }
        if (layerType === 'mapnik') {
          return {
            tiles: [
              'http://documentation.carto.com/{z}/{x}/{y}.png'
            ],
            grids: [
              'http://documentation.carto.com/{z}/{x}/{y}/grid.json'
            ]
          };
        }
      });

      this.modelUpdater.updateModels(this.windshaftMap);

      expect(layer1.get('meta')).toEqual('metadataLayer0');
      expect(layer1.setOk).toHaveBeenCalled();
      expect(layer2.get('meta')).toEqual('metadataLayer1');
      expect(layer2.get('tileURLTemplates')).toEqual([
        'http://documentation.carto.com/{z}/{x}/{y}.torque'
      ]);
      expect(layer2.setOk).toHaveBeenCalled();
    });

    it('should update dataview models', function () {
      var dataview1 = new Backbone.Model({ id: 'a1' });
      var dataview2 = new Backbone.Model({ id: 'a2' });
      this.dataviewsCollection.reset([ dataview1, dataview2 ]);

      this.windshaftMap.getDataviewMetadata = function (dataviewId) {
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

      this.modelUpdater.updateModels(this.windshaftMap, 'sourceId', 'forceFetch');

      expect(dataview1.set).toHaveBeenCalledWith({
        url: 'http://example1.com'
      }, {
        sourceId: 'sourceId',
        forceFetch: 'forceFetch'
      });

      expect(dataview1.get('url')).toEqual('http://example1.com');
      expect(dataview2.get('url')).toEqual('http://example2.com');
    });

    it('should update analysis models and "mark" them as ok', function () {
      var getParamNames = function () { return []; };
      var analysis1 = new Backbone.Model({ id: 'a1' });
      analysis1.setOk = jasmine.createSpy('setOk');
      var analysis2 = new Backbone.Model({ id: 'a2' });
      analysis2.setOk = jasmine.createSpy('setOk');
      this.analysisCollection.reset([ analysis1, analysis2 ]);
      analysis1.getParamNames = analysis2.getParamNames = getParamNames;

      this.windshaftMap.getAnalysisNodeMetadata = function (analysisId) {
        if (analysisId === 'a1') {
          return {
            status: 'status_a1',
            query: 'query_a1',
            url: {
              http: 'url_a1'
            }
          };
        }
        if (analysisId === 'a2') {
          return {
            status: 'status_a2',
            query: 'query_a2',
            url: {
              http: 'url_a2'
            }
          };
        }
      };

      this.modelUpdater.updateModels(this.windshaftMap);

      expect(analysis1.get('status')).toEqual('status_a1');
      expect(analysis1.get('query')).toEqual('query_a1');
      expect(analysis1.get('url')).toEqual('url_a1');
      expect(analysis1.setOk).toHaveBeenCalled();
      expect(analysis2.get('status')).toEqual('status_a2');
      expect(analysis2.get('query')).toEqual('query_a2');
      expect(analysis2.get('url')).toEqual('url_a2');
      expect(analysis2.setOk).toHaveBeenCalled();
    });

    it('should not update attributes that are original params (eg: query)', function () {
      var analysis1 = new Backbone.Model({ id: 'a1', query: 'original_query' });
      analysis1.getParamNames = function () { return ['query']; };
      analysis1.setOk = jasmine.createSpy('setOk');
      this.analysisCollection.reset([ analysis1 ]);

      this.windshaftMap.getAnalysisNodeMetadata = function (analysisId) {
        if (analysisId === 'a1') {
          return {
            status: 'new_status',
            query: 'new_query',
            url: {
              http: 'new_url'
            }
          };
        }
      };

      this.modelUpdater.updateModels(this.windshaftMap);

      expect(analysis1.get('status')).toEqual('new_status');
      expect(analysis1.get('query')).toEqual('original_query');
      expect(analysis1.get('url')).toEqual('new_url');
    });

    it('should set vis state to ok', function () {
      this.modelUpdater.updateModels(this.windshaftMap);

      expect(this.visModel.setOk).toHaveBeenCalled();
    });
  });

  describe('.setErrors', function () {
    it('should set vis state to error', function () {
      this.modelUpdater.setErrors([
        new WindshaftError({
          type: 'unknown',
          message: 'something went wrong!'
        })
      ]);

      expect(this.visModel.setError).toHaveBeenCalled();
      var error = this.visModel.setError.calls.argsFor(0)[0];

      expect(error.type).toBeUndefined();
      expect(error.message).toEqual('something went wrong!');
      expect(error.context).toBeUndefined();
    });

    it('should "mark" analysis as erroneous', function () {
      var analysis = new Backbone.Model({
        id: 'ANALYSIS_NODE_ID'
      });
      analysis.setError = jasmine.createSpy('setError');

      this.analysisCollection.reset([ analysis ]);

      this.modelUpdater.setErrors([
        new WindshaftError({
          type: 'analysis',
          message: 'Missing required param "radius"',
          analysis: {
            id: 'ANALYSIS_ID',
            node_id: 'ANALYSIS_NODE_ID',
            context: {
              something: 'else'
            }
          }
        })
      ]);

      expect(analysis.setError).toHaveBeenCalled();
      var error = analysis.setError.calls.argsFor(0)[0];

      expect(error.type).toBeUndefined();
      expect(error.analysisId).toEqual('ANALYSIS_NODE_ID');
      expect(error.message).toEqual('Missing required param "radius"');
      expect(error.context).toEqual({
        something: 'else'
      });
    });

    it('should "mark" layer as erroroneus', function () {
      var layer = new Backbone.Model({
        id: 'LAYER_ID'
      });
      layer.setError = jasmine.createSpy('setError');

      this.layersCollection.reset([ layer ]);

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

      expect(error.type).toEqual('turbo-carto');
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
  });
});

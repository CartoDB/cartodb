var Backbone = require('backbone');
var ModelUpdater = require('../../../src/vis/model-updater');

describe('src/vis/model-updater', function () {
  beforeEach(function () {
    this.windshaftMap = new Backbone.Model();
    this.windshaftMap.getBaseURL = function () {
      return 'baseURL';
    };
    this.windshaftMap.getTiles = function () {
      return 'tileJSON';
    };

    this.layerGroupModel = new Backbone.Model();
    this.layersCollection = new Backbone.Collection();
    this.analysisCollection = new Backbone.Collection();
    this.dataviewsCollection = new Backbone.Collection();

    this.modelUpdater = new ModelUpdater({
      layerGroupModel: this.layerGroupModel,
      layersCollection: this.layersCollection,
      dataviewsCollection: this.dataviewsCollection,
      analysisCollection: this.analysisCollection
    });
  });

  describe('.updateModels', function () {
    it('should update the layerGroupModel', function () {
      expect(this.layerGroupModel.get('baseURL')).not.toBeDefined();
      expect(this.layerGroupModel.get('urls')).not.toBeDefined();

      this.modelUpdater.updateModels(this.windshaftMap);

      // Assert that layerGroup has been updated
      expect(this.layerGroupModel.get('baseURL')).toEqual('baseURL');
      expect(this.layerGroupModel.get('urls')).toEqual('tileJSON');
    });

    it('should update layer models', function () {
      var layer0 = new Backbone.Model({ type: 'Tiled' });
      var layer1 = new Backbone.Model({ type: 'CartoDB' });
      var layer2 = new Backbone.Model({ type: 'torque' });
      this.layersCollection.reset([ layer0, layer1, layer2 ]);

      this.windshaftMap.getLayerMetadata = function (index) {
        if (index === 0) {
          return 'metadataLayer0';
        }
        if (index === 1) {
          return 'metadataLayer1';
        }
      };

      this.windshaftMap.getTiles = function (layerType) {
        if (layerType === 'torque') {
          return 'tileURLS';
        }
      };

      this.modelUpdater.updateModels(this.windshaftMap);

      expect(layer1.get('meta')).toEqual('metadataLayer0');
      expect(layer2.get('meta')).toEqual('metadataLayer1');
      expect(layer2.get('urls')).toEqual('tileURLS');
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

      this.modelUpdater.updateModels(this.windshaftMap, 'sourceLayerId', 'forceFetch');

      expect(dataview1.set).toHaveBeenCalledWith({
        url: 'http://example1.com'
      }, {
        sourceLayerId: 'sourceLayerId',
        forceFetch: 'forceFetch'
      });

      expect(dataview1.get('url')).toEqual('http://example1.com');
      expect(dataview2.get('url')).toEqual('http://example2.com');
    });

    it('should update analysis models', function () {
      var analysis1 = new Backbone.Model({ id: 'a1' });
      var analysis2 = new Backbone.Model({ id: 'a2' });
      this.analysisCollection.reset([ analysis1, analysis2 ]);

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
      expect(analysis2.get('status')).toEqual('status_a2');
      expect(analysis2.get('query')).toEqual('query_a2');
      expect(analysis2.get('url')).toEqual('url_a2');
    });
  });
});

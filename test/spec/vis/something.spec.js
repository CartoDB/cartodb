var _ = require('underscore');
var Backbone = require('backbone');
var Something = require('../../../src/vis/something');

describe('src/vis/something', function () {
  beforeEach(function () {
    this.windshaftMap = new Backbone.Model();
    this.windshaftMap.getBaseURL = function () {
      return 'baseURL';
    };
    this.windshaftMap.getTiles = function () {
      return 'tileJSON';
    };

    this.layerGroupModel = new Backbone.Model();
    this.analysisCollection = new Backbone.Collection();
  });

  it('should update the layerGroupModel when a new instance of the map is created', function () {
    expect(this.layerGroupModel.get('baseURL')).not.toBeDefined();
    expect(this.layerGroupModel.get('urls')).not.toBeDefined();

    Something.sync({
      windshaftMap: this.windshaftMap,
      layerGroupModel: this.layerGroupModel,
      analysisCollection: this.analysisCollection
    });

    // A new instance is created
    this.windshaftMap.trigger('instanceCreated', this.windshaftMap, {});

    // Assert that layerGroup has been updated
    expect(this.layerGroupModel.get('baseURL')).toEqual('baseURL');
    expect(this.layerGroupModel.get('urls')).toEqual('tileJSON');
  });

  it('should update analysis models when a new instance of the map is created', function (done) {
    var analysis1 = new Backbone.Model({ id: 'a1' });
    var analysis2 = new Backbone.Model({ id: 'a2' });
    this.analysisCollection.reset([ analysis1, analysis2 ]);

    Something.sync({
      windshaftMap: this.windshaftMap,
      layerGroupModel: this.layerGroupModel,
      analysisCollection: this.analysisCollection
    });

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

    this.windshaftMap.trigger('instanceCreated');

    _.defer(function () {
      expect(analysis1.get('status')).toEqual('status_a1');
      expect(analysis1.get('query')).toEqual('query_a1');
      expect(analysis1.get('url')).toEqual('url_a1');
      expect(analysis2.get('status')).toEqual('status_a2');
      expect(analysis2.get('query')).toEqual('query_a2');
      expect(analysis2.get('url')).toEqual('url_a2');
      done();
    });
  });
});

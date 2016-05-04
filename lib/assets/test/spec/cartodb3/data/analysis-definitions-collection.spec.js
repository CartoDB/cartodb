var Backbone = require('backbone');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var AnalysisDefinitionsCollection = require('../../../../javascripts/cartodb3/data/analysis-definitions-collection');
var AnalysisDefinitionNodesCollection = require('../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var createDefaultVis = require('../create-default-vis');

describe('data/analysis-definitions-collection', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var vis = createDefaultVis();

    var analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      sqlAPI: {},
      configModel: {},
      vis: vis
    });

    this.collection = new AnalysisDefinitionsCollection(null, {
      vizId: 'v-123',
      analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
      configModel: configModel
    });
    spyOn(Backbone, 'sync');
  });

  describe('.url', function () {
    it('should return URL', function () {
      expect(this.collection.url()).toMatch(/\/analyses$/);
    });
  });
});

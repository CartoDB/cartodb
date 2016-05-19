var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var AnalysisDefinitionNodesCollection = require('../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var AnalysisDefinitionsCollection = require('../../../../javascripts/cartodb3/data/analysis-definitions-collection');

describe('data/analysis-definition-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: {}
    });

    this.collection = new AnalysisDefinitionsCollection(null, {
      configModel: configModel,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      vizId: 'v-123'
    });

    this.collection.add({
      id: 'xyz123',
      analysis_definition: {
        id: 'a0',
        type: 'source',
        table_name: 'foo',
        params: {
          query: 'SELECT * FROM foo'
        },
        options: {
          custom: 'value'
        }
      }
    });
    this.model = this.collection.get('xyz123');
    this.analysisDefinitionNodesCollection.add({
      id: 'b0',
      type: 'source',
      params: {
        query: 'SELECT * FROM other'
      }
    });
  });

  describe('.containsNode', function () {
    it('should return true if given node is contained in the analysis', function () {
      expect(this.model.containsNode(this.analysisDefinitionNodesCollection.get('a0'))).toBe(true);
      expect(this.model.containsNode(this.analysisDefinitionNodesCollection.get('b0'))).toBe(false);
      expect(this.model.containsNode()).toBe(false);
    });
  });

  describe('.toJSON', function () {
    it('should return serialized model with custom options', function () {
      expect(this.model.toJSON()).toEqual({
        id: 'xyz123',
        analysis_definition: {
          id: 'a0',
          type: 'source',
          params: {
            query: 'SELECT * FROM foo'
          },
          options: {
            table_name: 'foo',
            custom: 'value'
          }
        }
      });
    });
  });
});

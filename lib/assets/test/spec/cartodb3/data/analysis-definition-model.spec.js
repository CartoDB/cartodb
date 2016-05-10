var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var AnalysisDefinitionNodesCollection = require('../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var AnalysisDefinitionsCollection = require('../../../../javascripts/cartodb3/data/analysis-definitions-collection');

describe('data/analysis-definition-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      sqlAPI: {},
      configModel: {}
    });

    this.collection = new AnalysisDefinitionsCollection(null, {
      configModel: configModel,
      analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
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
  });

  it('should have created corresponding source node from analysis definition', function () {
    expect(this.collection.analysisDefinitionNodesCollection.get('a0')).toBeDefined();
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

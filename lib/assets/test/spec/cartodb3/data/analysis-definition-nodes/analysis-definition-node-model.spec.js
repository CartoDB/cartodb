var AnalysisDefinitionNodesCollection = require('../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var AnalysisDefinitionNodeModel = require('../../../../../javascripts/cartodb3/data/analysis-definition-nodes/analysis-definition-node-model');

describe('data/analysis-definition-nodes/estimated-population-analysis-definition-node-model', function () {
  beforeEach(function () {
    this.collection = new AnalysisDefinitionNodesCollection([{
      id: 'a3',
      type: 'source',
      params: {
        query: 'SELECT * FROM foo'
      }
    }]);
    this.model = new AnalysisDefinitionNodeModel({
      source_id: 'a3'
    }, {
      collection: this.collection
    });
  });

  it('should generate id from source', function () {
    expect(this.model.id).toEqual('a4');
  });

  describe('.sourceModel', function () {
    it('should return the source model', function () {
      expect(this.model.sourceModel()).toBe(this.collection.get('a3'));
    });
  });
});

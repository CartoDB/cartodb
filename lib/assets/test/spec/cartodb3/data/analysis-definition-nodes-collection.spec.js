var AnalysisDefinitionNodesCollection = require('../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');

describe('data/analysis-definitions-collection', function () {
  beforeEach(function () {
    this.collection = new AnalysisDefinitionNodesCollection(null, {
      vizId: 'v-123',
      configModel: {}
    });
  });

  it('should have an node IDs object', function () {
    expect(this.collection.ids).toBeDefined();
  });
});

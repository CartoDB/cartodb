var SourceAnalysisDefinitionNodeModel = require('../../../../../javascripts/cartodb3/data/analysis-definition-nodes/source-analysis-definition-node-model');

describe('data/analysis-definition-nodes/source-analysis-definition-node-model', function () {
  beforeEach(function () {
    this.originalAttrs = {
      id: 'a0',
      params: {
        query: 'SELECT * FROM foo_bar'
      }
    };
    this.model = new SourceAnalysisDefinitionNodeModel(this.originalAttrs, {
      parse: true
    });
  });

  it('should have flattened the response data', function () {
    expect(this.model.attributes).toEqual({
      id: 'a0',
      type: 'source',
      query: 'SELECT * FROM foo_bar'
    });
  });

  describe('.toJSON', function () {
    beforeEach(function () {
      this.json = this.model.toJSON();
    });

    it('should return serialized result expected by API endpoint', function () {
      expect(this.json).toEqual({
        id: 'a0',
        type: 'source',
        params: {
          query: 'SELECT * FROM foo_bar'
        }
      });
    });
  });
});

var AnalysisDefinitionsCollection = require('../../../../../javascripts/cartodb3/data/analysis-definitions-collection');

describe('data/analysis-definitions/analysis-trade-area-definition-model', function () {
  beforeEach(function () {
    this.collection = new AnalysisDefinitionsCollection(null, {
      configModel: {},
      vizId: 'v-123'
    });
    this.originalAnalysisData = {
      id: 'a1',
      type: 'trade-area',
      params: {
        kind: 'car',
        time: 1337,
        source: {
          id: 'a0',
          type: 'source',
          params: {
            table_name: 'foo_bar',
            query: 'SELECT * FROM foo_bar'
          }
        }
      }
    };
    this.collection.add(this.originalAnalysisData);
    this.model = this.collection.get('a1');
  });

  it('should have recovered the source analysis to a model too', function () {
    expect(this.collection.length).toEqual(2);
    expect(this.collection.first().get('id')).toEqual('a0');
  });

  it('should have source reference', function () {
    expect(this.model.get('source')).toEqual('a0');
  });

  describe('.toJSON', function () {
    it('should return serialized object', function () {
      expect(this.model.toJSON()).toEqual(this.originalAnalysisData);
    });
  });
});

var AnalysisDefinitionNodesCollection = require('../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');

describe('data/analysis-definition-nodes/trade-area-analysis-definition-node-model', function () {
  beforeEach(function () {
    this.collection = new AnalysisDefinitionNodesCollection();
    this.collection.add({
      type: 'trade-area',
      params: {
        kind: 'car',
        time: 1337,
        source: {
          id: 'a0',
          type: 'source',
          params: {
            query: 'SELECT * FROM foo_bar'
          }
        }
      }
    });
    this.model = this.collection.get('a1');
  });

  it('should have recovered the source analysis to a model too', function () {
    expect(this.collection.length).toEqual(2);
    expect(this.collection.first().id).toEqual('a0');
    expect(this.collection.last().id).toEqual('a1');
  });

  it('should have reference to the source', function () {
    expect(this.model.get('source_id')).toEqual('a0');
  });

  it('should flattened the data', function () {
    expect(this.model.attributes).toEqual({
      id: 'a1',
      kind: 'car',
      source_id: 'a0',
      time: 1337,
      type: 'trade-area'
    });
  });

  describe('.toJSON', function () {
    it('should return serialized object', function () {
      expect(this.model.toJSON()).toEqual({
        id: 'a1',
        type: 'trade-area',
        params: {
          kind: 'car',
          time: 1337,
          source: {
            id: 'a0',
            type: 'source',
            params: {
              query: 'SELECT * FROM foo_bar'
            }
          }
        }
      });
    });
  });
});

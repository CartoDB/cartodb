var AnalysisDefinitionNodesCollection = require('../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');

describe('data/analysis-definition-nodes/routing-n-to-n-analysis-definition-node-model', function () {
  beforeEach(function () {
    this.collection = new AnalysisDefinitionNodesCollection();
    this.collection.add({
      type: 'routing-n-to-n',
      params: {
        origin_source: {
          id: 'a0',
          type: 'source',
          params: {
            query: 'SELECT * FROM foo'
          }
        },
        destination_source: {
          id: 'a1-second',
          type: 'source',
          params: {
            query: 'SELECT * FROM bar'
          }
        }
      }
    });
    this.model = this.collection.get('a1');
  });

  it('should flattened the data', function () {
    expect(this.model.attributes).toEqual({
      id: 'a1',
      origin_source_id: 'a0',
      destination_source_id: 'a1-second',
      type: 'routing-n-to-n'
    });
  });

  it('should have recovered the source analysis to a model too', function () {
    expect(this.collection.length).toEqual(3);
    expect(this.collection.get('a0')).toBeDefined();
    expect(this.collection.get('a1-second')).toBeDefined();
  });

  it('should have reference to the origin source', function () {
    expect(this.model.get('origin_source_id')).toEqual('a0');
  });

  it('should have reference to the destination source', function () {
    expect(this.model.get('destination_source_id')).toEqual('a1-second');
  });

  describe('.toJSON', function () {
    it('should return serialized object', function () {
      expect(this.model.toJSON()).toEqual({
        id: 'a1',
        type: 'routing-n-to-n',
        params: {
          origin_source: {
            id: 'a0',
            type: 'source',
            params: {
              query: 'SELECT * FROM foo'
            }
          },
          destination_source: {
            id: 'a1-second',
            type: 'source',
            params: {
              query: 'SELECT * FROM bar'
            }
          }
        }
      });
    });
  });
});

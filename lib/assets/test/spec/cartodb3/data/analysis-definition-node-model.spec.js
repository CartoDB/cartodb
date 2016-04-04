var AnalysisDefinitionNodesCollection = require('../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var AnalysisDefinitionNodeModel = require('../../../../javascripts/cartodb3/data/analysis-definition-node-model');

describe('data/analysis-definition-node-model', function () {
  beforeEach(function () {
    this.collection = new AnalysisDefinitionNodesCollection(null);
    this.model = new AnalysisDefinitionNodeModel({
      id: 'g0',
      type: 'source',
      params: {
        query: 'SELECT * FROM bar'
      }
    }, {
      parse: true,
      collection: this.collection
    });
    this.collection.add(this.model);
  });

  it('should have no source ids', function () {
    expect(this.model.sourceIds()).toEqual([]);
  });

  describe('.destroy', function () {
    beforeEach(function () {
      expect(this.collection.pluck('id')).toEqual(['g0']);
      this.model.destroy();
    });

    it('should remove the node from the collection', function () {
      expect(this.collection.pluck('id')).toEqual([]);
    });
  });

  describe('.toJSON', function () {
    it('should serialize the model', function () {
      expect(this.model.toJSON()).toEqual({
        id: 'g0',
        type: 'source',
        params: {
          query: 'SELECT * FROM bar'
        }
      });
    });
  });

  describe('when an analysis with sources is created', function () {
    beforeEach(function () {
      this.model = new AnalysisDefinitionNodeModel({
        id: 'x1',
        type: 'trade-area',
        params: {
          source: {
            id: 'g0',
            type: 'source',
            params: {
              query: 'SELECT * FROM bar'
            }
          },
          kind: 'walk',
          time: 300
        }
      }, {
        parse: true,
        collection: this.collection
      });
    });

    it('should create individual models for source node', function () {
      expect(this.collection.get('g0')).toBeDefined();
    });

    it('should have source ids', function () {
      expect(this.model.sourceIds()).toEqual(['g0']);
    });

    it('should flatten the data for the model', function () {
      expect(this.model.attributes).toEqual({
        id: 'x1',
        type: 'trade-area',
        source_id: 'g0',
        kind: 'walk',
        time: 300
      });
    });

    describe('.toJSON', function () {
      it('should unflatten the data again', function () {
        expect(this.model.toJSON()).toEqual({
          id: 'x1',
          type: 'trade-area',
          params: {
            source: {
              id: 'g0',
              type: 'source',
              params: {
                query: 'SELECT * FROM bar'
              }
            },
            kind: 'walk',
            time: 300
          }
        });
      });
    });
  });
});

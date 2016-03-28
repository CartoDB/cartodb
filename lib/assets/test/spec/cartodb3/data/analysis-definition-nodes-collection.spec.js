var AnalysisDefinitionNodesCollection = require('../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');

describe('data/analysis-definition-nodes-collection', function () {
  beforeEach(function () {
    this.collection = new AnalysisDefinitionNodesCollection(null, {
      sqlAPI: {}
    });
  });

  describe('when sources are added', function () {
    beforeEach(function () {
      this.collection.add([{
        id: 'a0',
        type: 'source',
        params: {
          query: 'SELECT * FROM foo'
        }
      }, {
        id: 'b0',
        type: 'source',
        params: {
          query: 'SELECT * FROM bar'
        }
      }]);
    });

    it('should have created a model for each item', function () {
      expect(this.collection.pluck('id')).toEqual(['a0', 'b0']);
    });

    describe('when adding an analysis that contains references to existing sources', function () {
      beforeEach(function () {
        this.collection.add({
          id: 'd1',
          type: 'point-in-polygon',
          params: {
            polygons_source: {
              id: 'b0',
              type: 'source',
              params: {
                query: 'SELECT * FROM bar'
              }
            },
            points_source: {
              id: 'c0',
              type: 'source',
              params: {
                query: 'SELECT * FROM baz'
              }
            }
          }
        });
      });

      it('should have created a model for the new analysis node and source nodes if not already existing', function () {
        expect(this.collection.pluck('id')).toEqual(['a0', 'b0', 'c0', 'd1']);
      });
    });
  });
});

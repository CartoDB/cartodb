var Backbone = require('backbone');
var AnalysisDefinitionNodesCollection = require('../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');

describe('data/analysis-definition-nodes-collection', function () {
  beforeEach(function () {
    this.analysisCollection = new Backbone.Collection([]);
    this.collection = new AnalysisDefinitionNodesCollection(null, {
      sqlAPI: {},
      configModel: {},
      analysisCollection: this.analysisCollection
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
        id: 'a1',
        type: 'buffer',
        radio: 300,
        distance: 'meters',
        source: 'a0'
      }, {
        id: 'b0',
        type: 'source',
        params: {
          query: 'SELECT * FROM bar'
        }
      }, {
        id: 'b1',
        type: 'buffer',
        radio: 300,
        distance: 'meters',
        source: 'b0'
      }]);
    });

    it('should have created a model for each item', function () {
      expect(this.collection.pluck('id')).toEqual(['a0', 'a1', 'b0', 'b1']);
    });

    describe('when analysis are updated', function () {
      beforeEach(function () {
        this.analysisCollection.add([{
          id: 'a1',
          query: 'SELECT * FROM librerias_pos',
          status: 'ready',
          type: 'source'
        }, {
          id: 'b1',
          query: 'SELECT * FROM librerias_pos',
          status: 'ready',
          type: 'source'
        }]);
      });

      it('should update the analysis nodes with a table model', function () {
        expect(this.collection.at(1).analysisTableModel).toBeDefined();
        expect(this.collection.at(1).analysisMetadata).toBeDefined();
      });
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
        expect(this.collection.pluck('id')).toEqual(['a0', 'a1', 'b0', 'b1', 'c0', 'd1']);
      });
    });
  });
});

var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var AnalysisDefinitionsCollection = require('../../../../javascripts/cartodb3/data/analysis-definitions-collection');
var AnalysisDefinitionNodesCollection = require('../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');

describe('data/analysis-definitions-collection', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: {}
    });

    this.collection = new AnalysisDefinitionsCollection(null, {
      vizId: 'v-123',
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      configModel: configModel
    });
  });

  describe('.url', function () {
    it('should return URL', function () {
      expect(this.collection.url()).toMatch(/\/analyses$/);
    });
  });

  describe('when there are some nodes and analysis', function () {
    beforeEach(function () {
      this.collection.add([
        {
          id: 'layerC',
          analysis_definition: {
            id: 'c1',
            type: 'buffer',
            params: {
              source: {
                id: 'b1',
                type: 'buffer',
                params: {
                  source: {
                    id: 'a1',
                    type: 'buffer',
                    params: {
                      source: {
                        id: 'a0',
                        type: 'source',
                        params: {
                          query: 'SELECT * FROM something'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      ]);
      this.collection.add({
        id: 'layerA',
        analysis_definition: this.analysisDefinitionNodesCollection.get('a1').toJSON()
      });
      this.collection.add({
        id: 'layerB',
        analysis_definition: this.analysisDefinitionNodesCollection.get('b1').toJSON()
      });
    });

    describe('when a node that has a source is removed', function () {
      beforeEach(function (done) {
        this.analysisDefinitionNodesCollection.get('b1').destroy();
        setTimeout(done, 20); // not ideal, but enough for _.defer call to be executed as expected
      });

      it('should only keep a single analysis pointing to the source node of the removed node', function () {
        expect(this.collection.length).toEqual(1);
        expect(this.collection.first().get('node_id')).toEqual('a1');
      });

      it('should remove orphaned nodes', function () {
        expect(this.analysisDefinitionNodesCollection.pluck('id')).toEqual(['a0', 'a1']);
      });
    });

    describe('when a source node is removed', function () {
      beforeEach(function (done) {
        this.analysisDefinitionNodesCollection.get('a0').destroy();
        setTimeout(done, 20); // not ideal, but enough for _.defer call to be executed as expected
      });

      it('should remove all analysis', function () {
        expect(this.collection.length).toEqual(0);
      });

      it('should remove orphaned nodes', function () {
        expect(this.analysisDefinitionNodesCollection.pluck('id')).toEqual([]);
      });
    });
  });
});

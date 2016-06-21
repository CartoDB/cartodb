var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var AnalysisDefinitionsCollection = require('../../../../javascripts/cartodb3/data/analysis-definitions-collection');
var AnalysisDefinitionNodesCollection = require('../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');

describe('cartodb/data/analysis-definitions-collection', function () {
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
  });

  describe('.url', function () {
    it('should return URL', function () {
      expect(this.collection.url()).toMatch(/\/analyses$/);
    });
  });

  describe('.findAnalysisThatContainsNode', function () {
    describe('when given a node that does not have any analysis', function () {
      it('should return undefined', function () {
        expect(this.collection.findAnalysisThatContainsNode({id: 'x123'})).toBeUndefined();
      });
    });

    describe('when given a node is root', function () {
      it('should return the analysis', function () {
        expect(this.collection.findAnalysisThatContainsNode({id: 'c1'})).toBeDefined();
      });
    });

    describe('when given a node is contained in an analysis', function () {
      it('should return the analysis', function () {
        expect(this.collection.findAnalysisThatContainsNode({id: 'a0'})).toBeDefined();
      });
    });
  });
});

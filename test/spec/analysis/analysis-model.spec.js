var Backbone = require('backbone');
var AnalysisFactory = require('../../../src/analysis/analysis-factory.js');

describe('src/analysis/analysis-model.js', function () {
  describe('.findAnalysisById', function () {
    it('should find a node in the graph', function () {
      var analysisFactory = new AnalysisFactory({
        analysisCollection: new Backbone.Collection(),
        sourceNamesMap: {
          'analysis-type-1': ['source1', 'source2'],
          'analysis-type-2': [],
          'analysis-type-3': ['source3'],
          'analysis-type-4': []
        }
      });
      var analysisModel = analysisFactory.analyse({
        id: 'a1',
        type: 'analysis-type-1',
        params: {
          a: 1,
          source1: {
            id: 'a2',
            type: 'analysis-type-2',
            params: {
              a2: 2
            }
          },
          source2: {
            id: 'a3',
            type: 'analysis-type-3',
            params: {
              source3: {
                id: 'a4',
                type: 'analysis-type-4',
                params: {
                  a4: 4
                }
              }
            }
          }
        }
      });

      expect(analysisModel.findAnalysisById('a1')).toEqual(analysisModel);
      expect(analysisModel.findAnalysisById('a2').get('id')).toEqual('a2');
      expect(analysisModel.findAnalysisById('a3').get('id')).toEqual('a3');
      expect(analysisModel.findAnalysisById('b9')).toBeUndefined();
    });
  });
});

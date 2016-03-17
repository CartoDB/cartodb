var Backbone = require('backbone');
var AnalysisModel = require('../../../src/analysis/analysis-model.js');
var AnalysisFactory = require('../../../src/analysis/analysis-factory.js');

describe('src/analysis/analysis-model.js', function () {
  it('should reload the map when params change', function () {
    var map = jasmine.createSpyObj('map', ['reload']);

    var analysisModel = new AnalysisModel({
      type: 'type',
      params: {
        param1: 'value1',
        param2: 'value2'
      }
    }, {
      map: map,
      camshaftReference: jasmine.createSpyObj('camshaftReference', ['something'])
    });

    analysisModel.set({
      type: 'type',
      params: {
        param1: 'newValue1',
        param2: 'newValue2'
      }
    });

    expect(map.reload).toHaveBeenCalled();
  });

  describe('.findAnalysisById', function () {
    it('should find a node in the graph', function () {
      var fakeCamshaftReference = {
        getSourceNamesForAnalysisType: function (analysType) {
          var map = {
            'analysis-type-1': ['source1', 'source2'],
            'analysis-type-2': [],
            'analysis-type-3': ['source3'],
            'analysis-type-4': []
          };
          return map[analysType];
        }
      };
      var analysisFactory = new AnalysisFactory({
        analysisCollection: new Backbone.Collection(),
        camshaftReference: fakeCamshaftReference
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

  describe('.toJSON', function () {
    xit('should serialize the graph', function () {

    });
  });
});

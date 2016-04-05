var Backbone = require('backbone');
var AnalysisModel = require('../../../src/analysis/analysis-model.js');
var AnalysisFactory = require('../../../src/analysis/analysis-factory.js');

describe('src/analysis/analysis-model.js', function () {
  it('should reload the map when params change', function () {
    var map = jasmine.createSpyObj('map', ['reload']);
    var fakeCamshaftReference = {
      getSourceNamesForAnalysisType: function (analysisType) {
        var map = {
          'analysis-type-1': ['source1', 'source2']
        };
        return map[analysisType];
      },
      getParamNamesForAnalysisType: function (analysisType) {
        var map = {
          'analysis-type-1': ['attribute1', 'attribute2']
        };

        return map[analysisType];
      }
    };

    var analysisModel = new AnalysisModel({
      type: 'analysis-type-1',
      attribute1: 'value1',
      attribute2: 'value2'
    }, {
      map: map,
      camshaftReference: fakeCamshaftReference
    });

    analysisModel.set({
      attribute1: 'newValue1'
    });

    expect(map.reload).toHaveBeenCalled();
    map.reload.calls.reset();

    analysisModel.set({
      attribute2: 'newValue2'
    });

    expect(map.reload).toHaveBeenCalled();
    map.reload.calls.reset();

    analysisModel.set({
      attribute900: 'something'
    });

    expect(map.reload).not.toHaveBeenCalled();
  });

  describe('.findAnalysisById', function () {
    it('should find a node in the graph', function () {
      var map = jasmine.createSpyObj('map', ['reload']);
      var fakeCamshaftReference = {
        getSourceNamesForAnalysisType: function (analysisType) {
          var map = {
            'analysis-type-1': ['source1', 'source2'],
            'analysis-type-2': [],
            'analysis-type-3': ['source3'],
            'analysis-type-4': []
          };
          return map[analysisType];
        },
        getParamNamesForAnalysisType: function (analysisType) {
          var map = {
            'analysis-type-1': ['a'],
            'analysis-type-2': [],
            'analysis-type-3': [],
            'analysis-type-4': ['a4']
          };

          return map[analysisType];
        }
      };

      var analysisFactory = new AnalysisFactory({
        map: map,
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
    it('should serialize the graph', function () {
      var map = jasmine.createSpyObj('map', ['reload']);
      var fakeCamshaftReference = {
        getSourceNamesForAnalysisType: function (analysisType) {
          var map = {
            'analysis-type-1': ['source1', 'source2'],
            'analysis-type-2': [],
            'analysis-type-3': ['source3'],
            'analysis-type-4': []
          };
          return map[analysisType];
        },
        getParamNamesForAnalysisType: function (analysisType) {
          var map = {
            'analysis-type-1': ['a'],
            'analysis-type-2': ['a2'],
            'analysis-type-3': [],
            'analysis-type-4': ['a4']
          };

          return map[analysisType];
        }
      };

      var analysisFactory = new AnalysisFactory({
        map: map,
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

      expect(analysisModel.toJSON()).toEqual({
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
    });
  });
});

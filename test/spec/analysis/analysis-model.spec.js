var _ = require('underscore');
var Backbone = require('backbone');
var AnalysisModel = require('../../../src/analysis/analysis-model.js');
var AnalysisService = require('../../../src/analysis/analysis-service.js');

var fakeCamshaftReference = {
  getSourceNamesForAnalysisType: function (analysisType) {
    var map = {
      'analysis-type-1': ['source1', 'source2'],
      'trade-area': ['source'],
      'estimated-population': ['source'],
      'sql-function': ['source', 'target']
    };
    return map[analysisType];
  },
  getParamNamesForAnalysisType: function (analysisType) {
    var map = {
      'analysis-type-1': ['attribute1', 'attribute2'],
      'trade-area': ['kind', 'time'],
      'estimated-population': ['columnName']
    };

    return map[analysisType];
  }
};

var createFakeEngine = function () {
  var engine = new Backbone.Model();
  engine.reload = jasmine.createSpy('reload');
  return engine;
};

var createFakeAnalysis = function (attrs, engine) {
  return new AnalysisModel(attrs, {
    engine: engine,
    camshaftReference: fakeCamshaftReference
  });
};

describe('src/analysis/analysis-model.js', function () {
  var engineMock;

  beforeEach(function () {
    engineMock = createFakeEngine();
    this.analysisModel = createFakeAnalysis({
      type: 'analysis-type-1',
      attribute1: 'value1',
      attribute2: 'value2'
    }, engineMock);
  });

  describe('.url', function () {
    it('should append the api_key param if present (and not use the authToken)', function () {
      this.analysisModel.set({
        url: 'http://example.com',
        apiKey: 'THE_API_KEY',
        authToken: 'THE_AUTH_TOKEN'
      });

      expect(this.analysisModel.url()).toEqual('http://example.com?api_key=THE_API_KEY');
    });

    it('should append the auth_token param if present (and not use the authToken)', function () {
      this.analysisModel.set({
        url: 'http://example.com',
        authToken: 'THE_AUTH_TOKEN'
      });

      expect(this.analysisModel.url()).toEqual('http://example.com?auth_token=THE_AUTH_TOKEN');
    });
  });

  describe('bindings', function () {
    describe('on params change', function () {
      it('should reload the map', function () {
        this.analysisModel.set({
          attribute1: 'newValue1'
        });

        expect(engineMock.reload).toHaveBeenCalled();
        engineMock.reload.calls.reset();

        this.analysisModel.set({
          attribute2: 'newValue2'
        });

        expect(engineMock.reload).toHaveBeenCalled();
        engineMock.reload.calls.reset();

        this.analysisModel.set({
          attribute900: 'something'
        });

        expect(engineMock.reload).not.toHaveBeenCalled();
      });

      it('should be marked as failed if request to reload the map fails', function () {
        this.analysisModel.set({
          attribute1: 'newValue1',
          status: AnalysisModel.STATUS.READY
        });

        // Request to the Maps API fails and error callback is invoked...
        engineMock.reload.calls.argsFor(0)[0].error('something bad just happened');

        expect(this.analysisModel.get('status')).toEqual(AnalysisModel.STATUS.FAILED);
      });
    });

    describe('on type change', function () {
      it('should unbind old params and bind new params', function () {
        spyOn(this.analysisModel, '_initBinds').and.callThrough();
        spyOn(this.analysisModel, 'unbind').and.callThrough();
        this.analysisModel.set('type', 'new!');
        expect(this.analysisModel.unbind).toHaveBeenCalled();
        expect(this.analysisModel._initBinds).toHaveBeenCalled();
      });

      it('should reload the map', function () {
        this.analysisModel.set('type', 'something');
        expect(engineMock.reload).toHaveBeenCalled();
      });

      it('should keep listening type change again', function () {
        this.analysisModel.set('type', 'something');
        expect(engineMock.reload).toHaveBeenCalled();
        engineMock.reload.calls.reset();
        this.analysisModel.set('type', 'something else');
        expect(engineMock.reload).toHaveBeenCalled();
      });
    });

    describe('on status change', function () {
      var createAnalysisModelNoStatusNoReferences = function (engine) {
        var analysisModel = createFakeAnalysis({ id: 'a0' }, engine);
        return analysisModel;
      };

      var createAnalysisModelNoStatusWithReferences = function (engine) {
        var analysisModel = createFakeAnalysis({ id: 'a0' }, engine);
        analysisModel.markAsSourceOf(new Backbone.Model());
        return analysisModel;
      };

      var createAnalysisModelWithStatusNoReferences = function (engine) {
        var analysisModel = createFakeAnalysis({ id: 'a0', status: 'foo' }, engine);
        return analysisModel;
      };

      var createAnalysisModelWithStatusWithReferences = function (engine) {
        var analysisModel = createFakeAnalysis({ id: 'a0', status: 'foo' }, engine);
        analysisModel.markAsSourceOf(new Backbone.Model());
        return analysisModel;
      };

      var testCases = [
        {
          testName: 'analysis with no previous status and no references',
          createAnalysisFn: createAnalysisModelNoStatusNoReferences,
          expectedVisReloadWhenStatusIn: [] // no relaod is expected
        },
        {
          testName: 'analysis with no previous status and some references',
          createAnalysisFn: createAnalysisModelNoStatusWithReferences,
          expectedVisReloadWhenStatusIn: [] // no reload is expected
        },
        {
          testName: 'analysis with previous status and no references',
          createAnalysisFn: createAnalysisModelWithStatusNoReferences,
          expectedVisReloadWhenStatusIn: [] // no reload is expected
        },
        {
          testName: 'analysis with previous status and references',
          createAnalysisFn: createAnalysisModelWithStatusWithReferences,
          expectedVisReloadWhenStatusIn: [ AnalysisModel.STATUS.READY ]
        }
      ];

      _.forEach(testCases, function (testCase) {
        var testName = testCase.testName;
        var createAnalysisFn = testCase.createAnalysisFn;
        var expectedVisReloadWhenStatusIn = testCase.expectedVisReloadWhenStatusIn;
        var notExpectedVisReloadWhenStatusIn = [];

        describe(testName, function () {
          var analysisModel;
          var engineMock;

          beforeEach(function () {
            engineMock = createFakeEngine();
            analysisModel = createAnalysisFn(engineMock);
          });

          _.forEach(AnalysisModel.STATUS, function (status) {
            if (expectedVisReloadWhenStatusIn.indexOf(status) < 0) {
              notExpectedVisReloadWhenStatusIn.push(status);
            }
          });

          _.each(expectedVisReloadWhenStatusIn, function (status) {
            it("should reload the engine if analysis is now '" + status + "'", function () {
              expect(engineMock.reload).not.toHaveBeenCalled();
              analysisModel.set('status', status);
              expect(engineMock.reload).toHaveBeenCalled();
            });
          }, this);

          _.each(notExpectedVisReloadWhenStatusIn, function (status) {
            it("should NOT reload the engine if analysis is now '" + status + "'", function () {
              expect(engineMock.reload).not.toHaveBeenCalled();
              analysisModel.set('status', status);
              expect(engineMock.reload).not.toHaveBeenCalled();
            });
          }, this);
        });
      });
    });
  });

  describe('.findAnalysisById', function () {
    it('should find a node in the graph', function () {
      var fakeCamshaftReference = {
        getSourceNamesForAnalysisType: function (analysisType) {
          var map = {
            'analysis-type-1': ['source1', 'source2'],
            'analysis-type-2': [],
            'analysis-type-3': ['source3'],
            'analysis-type-4': [],
            'analysis-type-5': ['source4', 'source5']
          };
          return map[analysisType];
        },
        getParamNamesForAnalysisType: function (analysisType) {
          var map = {
            'analysis-type-1': ['a'],
            'analysis-type-2': [],
            'analysis-type-3': [],
            'analysis-type-4': ['a4'],
            'analysis-type-5': []
          };

          return map[analysisType];
        }
      };

      var analysisService = new AnalysisService({
        engine: engineMock,
        camshaftReference: fakeCamshaftReference
      });
      var analysisModel = analysisService.analyse({
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
                id: 'a5',
                type: 'analysis-type-5',
                params: {
                  source4: {
                    id: 'a4',
                    type: 'analysis-type-4',
                    params: {
                      a4: 4
                    }
                  }
                }
              }
            }
          }
        }
      });

      expect(analysisModel.findAnalysisById('a1')).toEqual(analysisModel);
      expect(analysisModel.findAnalysisById('a2').get('id')).toEqual('a2');
      expect(analysisModel.findAnalysisById('a3').get('id')).toEqual('a3');
      expect(analysisModel.findAnalysisById('a5').get('id')).toEqual('a5');
      expect(analysisModel.findAnalysisById('b9')).toBeUndefined();
    });
  });

  describe('.toJSON', function () {
    it('should serialize the graph', function () {
      var fakeCamshaftReference = {
        getSourceNamesForAnalysisType: function (analysisType) {
          var map = {
            'analysis-type-1': ['source1', 'source2'],
            'analysis-type-2': [],
            'analysis-type-3': ['source3'],
            'analysis-type-4': [],
            'analysis-type-5': ['source4', 'source5']
          };
          return map[analysisType];
        },
        getParamNamesForAnalysisType: function (analysisType) {
          var map = {
            'analysis-type-1': ['a'],
            'analysis-type-2': ['a2'],
            'analysis-type-3': [],
            'analysis-type-4': ['a4'],
            'analysis-type-5': []
          };

          return map[analysisType];
        },
        isSourceNameOptionalForAnalysisType: function (analysisType, sourceName) {
          return (analysisType === 'analysis-type-5' && sourceName === 'source5');
        }
      };

      var analysisService = new AnalysisService({
        engine: engineMock,
        camshaftReference: fakeCamshaftReference
      });
      var analysisModel = analysisService.analyse({
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
                  a4: {
                    id: 'a5',
                    type: 'analysis-type-5',
                    params: {
                      source4: {
                        id: 'a6',
                        type: 'analysis-type-2',
                        params: {
                          a2: 2
                        }
                      }
                    }
                  }
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
                  a4: {
                    id: 'a5',
                    type: 'analysis-type-5',
                    params: {
                      source4: {
                        id: 'a6',
                        type: 'analysis-type-2',
                        params: {
                          a2: 2
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });
    });
  });

  describe('.isDone', function () {
    it('should return true if analysis has been calculated', function () {
      this.analysisModel.set('status', AnalysisModel.STATUS.READY);
      expect(this.analysisModel.isDone()).toEqual(true);

      this.analysisModel.set('status', AnalysisModel.STATUS.FAILED);
      expect(this.analysisModel.isDone()).toEqual(true);
    });

    it('should return false if analysis has NOT been calculated', function () {
      this.analysisModel.set('status', AnalysisModel.STATUS.PENDING);
      expect(this.analysisModel.isDone()).toEqual(false);

      this.analysisModel.set('status', AnalysisModel.STATUS.WAITING);
      expect(this.analysisModel.isDone()).toEqual(false);

      this.analysisModel.set('status', AnalysisModel.STATUS.RUNNING);
      expect(this.analysisModel.isDone()).toEqual(false);
    });
  });

  describe('.setOk', function () {
    it('should unset error attribute', function () {
      this.analysisModel.set('error', 'error');
      this.analysisModel.setOk();
      expect(this.analysisModel.get('error')).toBeUndefined();
    });
  });

  describe('.setError', function () {
    it('should set error attribute', function () {
      this.analysisModel.setError('wadus');

      expect(this.analysisModel.get('error')).toEqual('wadus');
    });

    it('should set analyis as failed', function () {
      this.analysisModel.setError('wadus');

      expect(this.analysisModel.get('status')).toEqual(AnalysisModel.STATUS.FAILED);
    });
  });

  describe('.getNodes', function () {
    var analysisService;
    beforeEach(function () {
      analysisService = new AnalysisService({
        engine: engineMock,
        camshaftReference: fakeCamshaftReference
      });
    });
    it('Should return a list of nodes from an analysis', function () {
      var analysis = analysisService.analyse(
        {
          id: 'a2',
          type: 'estimated-population',
          params: {
            columnName: 'estimated_people',
            source: {
              id: 'a1',
              type: 'trade-area',
              params: {
                kind: 'walk',
                time: 300,
                source: {
                  id: 'a0',
                  type: 'source',
                  params: {
                    query: 'SELECT * FROM subway_stops'
                  }
                }
              }
            }
          }
        }
      );
      var actual = analysis.getNodes();
      expect(actual.length).toEqual(3);
    });
  });

  describe('references tracking', function () {
    it('should allow keeping track of models that reference this object', function () {
      var model1 = new Backbone.Model();
      var model2 = new Backbone.Model();

      expect(this.analysisModel.isSourceOfAnyModel()).toBe(false);

      this.analysisModel.markAsSourceOf(model1);

      expect(this.analysisModel.isSourceOfAnyModel()).toBe(true);

      this.analysisModel.markAsSourceOf(model1);

      expect(this.analysisModel.isSourceOfAnyModel()).toBe(true);

      this.analysisModel.markAsSourceOf(model2);

      expect(this.analysisModel.isSourceOfAnyModel()).toBe(true);

      this.analysisModel.unmarkAsSourceOf(model1);

      expect(this.analysisModel.isSourceOfAnyModel()).toBe(true);

      this.analysisModel.unmarkAsSourceOf(model2);

      expect(this.analysisModel.isSourceOfAnyModel()).toBe(false);
    });
  });
});

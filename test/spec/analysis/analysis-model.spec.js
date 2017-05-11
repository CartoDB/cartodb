var Backbone = require('backbone');
var AnalysisModel = require('../../../src/analysis/analysis-model.js');
var AnalysisFactory = require('../../../src/analysis/analysis-factory.js');

describe('src/analysis/analysis-model.js', function () {
  beforeEach(function () {
    this.vis = new Backbone.Model();
    this.vis.reload = jasmine.createSpy('reload');
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

    this.analysisModel = new AnalysisModel({
      type: 'analysis-type-1',
      attribute1: 'value1',
      attribute2: 'value2'
    }, {
      vis: this.vis,
      camshaftReference: fakeCamshaftReference
    });
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

        expect(this.vis.reload).toHaveBeenCalled();
        this.vis.reload.calls.reset();

        this.analysisModel.set({
          attribute2: 'newValue2'
        });

        expect(this.vis.reload).toHaveBeenCalled();
        this.vis.reload.calls.reset();

        this.analysisModel.set({
          attribute900: 'something'
        });

        expect(this.vis.reload).not.toHaveBeenCalled();
      });

      it('should be marked as failed if request to reload the map fails', function () {
        this.analysisModel.set({
          attribute1: 'newValue1',
          status: AnalysisModel.STATUS.READY
        });

        // Request to the Maps API fails and error callback is invoked...
        this.vis.reload.calls.argsFor(0)[0].error('something bad just happened');

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
        expect(this.vis.reload).toHaveBeenCalled();
      });

      it('should keep listening type change again', function () {
        this.analysisModel.set('type', 'something');
        expect(this.vis.reload).toHaveBeenCalled();
        this.vis.reload.calls.reset();
        this.analysisModel.set('type', 'something else');
        expect(this.vis.reload).toHaveBeenCalled();
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

      var analysisFactory = new AnalysisFactory({
        vis: this.vis,
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

      var analysisFactory = new AnalysisFactory({
        vis: this.vis,
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
});

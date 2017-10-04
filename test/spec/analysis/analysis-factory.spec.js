var Backbone = require('backbone');
var AnalysisService = require('../../../src/analysis/analysis-service');

describe('src/analysis/analysis-service.js', function () {
  beforeEach(function () {
    this.fakeCamshaftReference = {
      getSourceNamesForAnalysisType: function (analysisType) {
        var map = {
          'trade-area': ['source'],
          'estimated-population': ['source'],
          'sql-function': ['source', 'target']
        };
        return map[analysisType];
      },
      getParamNamesForAnalysisType: function (analysisType) {
        var map = {
          'trade-area': ['kind', 'time'],
          'estimated-population': ['columnName']
        };
        return map[analysisType];
      }
    };
    this.vis = new Backbone.Model();
    this.analysisCollection = new Backbone.Collection();
    this.analysisService = new AnalysisService({
      camshaftReference: this.fakeCamshaftReference,
      analysisCollection: this.analysisCollection,
      vis: this.vis
    });
  });

  describe('.analyse', function () {
    it('should generate and return a new analysis', function () {
      var subwayStops = this.analysisService.analyse({
        id: 'a0',
        type: 'source',
        query: 'SELECT * FROM subway_stops'
      });

      expect(subwayStops.attributes).toEqual({
        id: 'a0',
        type: 'source',
        query: 'SELECT * FROM subway_stops'
      });
    });

    it('should set attrs on the analysis models', function () {
      this.analysisService = new AnalysisService({
        apiKey: 'THE_API_KEY',
        authToken: 'THE_AUTH_TOKEN',
        camshaftReference: this.fakeCamshaftReference,
        analysisCollection: this.analysisCollection,
        vis: this.vis
      });

      var analysisModel = this.analysisService.analyse({
        id: 'a0',
        type: 'source',
        query: 'SELECT * FROM subway_stops'
      });

      expect(analysisModel.get('apiKey')).toEqual('THE_API_KEY');
      expect(analysisModel.get('authToken')).toEqual('THE_AUTH_TOKEN');
    });

    it('should add new analysis to the collection of analysis', function () {
      var subwayStops = this.analysisService.analyse({
        id: 'a0',
        type: 'source',
        query: 'SELECT * FROM subway_stops'
      });

      expect(this.analysisCollection.at(0)).toEqual(subwayStops);
    });

    it('should not create a new analysis if an analysis with the same id was created already', function () {
      var subwayStops1 = this.analysisService.analyse({
        id: 'a0',
        type: 'source',
        params: {
          query: 'SELECT * FROM subway_stops'
        }
      });

      var subwayStops2 = this.analysisService.analyse({
        id: 'a0',
        type: 'source',
        params: {
          query: 'SELECT * FROM subway_stops '
        }
      });

      expect(subwayStops1.cid).toEqual(subwayStops2.cid);
    });

    it('should recursively build the anlysis graph', function () {
      var estimatedPopulation = this.analysisService.analyse(
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
      var tradeArea = estimatedPopulation.get('source');
      var subwayStops = tradeArea.get('source');
      expect(tradeArea.get('id')).toEqual('a1');
      expect(subwayStops.get('id')).toEqual('a0');
    });

    it('analysis should be re-created after it has been removed', function () {
      var subwayStops1 = this.analysisService.analyse({
        id: 'a0',
        type: 'source',
        params: {
          query: 'SELECT * FROM subway_stops'
        }
      });

      subwayStops1.remove();

      var subwayStops2 = this.analysisService.analyse({
        id: 'a0',
        type: 'source',
        params: {
          query: 'SELECT * FROM subway_stops '
        }
      });

      expect(subwayStops1.cid).not.toEqual(subwayStops2.cid);
    });

    it('should remove the analysis from the collection when analysis is removed', function () {
      var subwayStops1 = this.analysisService.analyse({
        id: 'a0',
        type: 'source',
        params: {
          query: 'SELECT * FROM subway_stops'
        }
      });

      expect(this.analysisCollection.size()).toEqual(1);

      subwayStops1.remove();

      expect(this.analysisCollection.size()).toEqual(0);
    });
  });

  describe('.findNodeById', function () {
    it('should traverse the analysis and return an existing node', function () {
      this.analysisService.analyse(
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

      expect(this.analysisService.findNodeById('a2').get('id')).toEqual('a2');
      expect(this.analysisService.findNodeById('a1').get('id')).toEqual('a1');
      expect(this.analysisService.findNodeById('a0').get('id')).toEqual('a0');
    });

    it('should return undefined if node is not found', function () {
      expect(this.analysisService.findNodeById('something')).toBeUndefined();

      this.analysisService.analyse(
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

      expect(this.analysisService.findNodeById('something')).toBeUndefined();
    });
  });

  describe('._getAnalysisAttributesFromAnalysisDefinition', function () {
    it('should analyse all source nodes if everyone has params', function () {
      var analysisDefinition = {
        type: 'trade-area',
        params: {
          source: 'a0'
        }
      };
      spyOn(this.analysisService, 'analyse').and.returnValue('node');

      var result = this.analysisService._getAnalysisAttributesFromAnalysisDefinition(analysisDefinition);

      expect(this.analysisService.analyse.calls.count()).toEqual(1);
      expect(this.analysisService.analyse).toHaveBeenCalledWith('a0');
      expect(result).toEqual({
        type: 'trade-area',
        source: 'node'
      });
    });

    it('should analyse only source nodes that has params', function () {
      var analysisDefinition = {
        type: 'sql-function',
        params: {
          source: 'a0'
        }
      };
      spyOn(this.analysisService, 'analyse').and.returnValue('node');

      var result = this.analysisService._getAnalysisAttributesFromAnalysisDefinition(analysisDefinition);

      expect(this.analysisService.analyse.calls.count()).toEqual(1);
      expect(this.analysisService.analyse).toHaveBeenCalledWith('a0');
      expect(result).toEqual({
        type: 'sql-function',
        source: 'node'
      });
    });
  });
});

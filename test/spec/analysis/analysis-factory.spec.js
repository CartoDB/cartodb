var Backbone = require('backbone');
var AnalysisFactory = require('../../../src/analysis/analysis-factory');
var ANALYSIS_TYPE_TO_SOURCE_PARAM_NAMES_MAP = require('../../../src/analysis/source-names-map');

describe('src/analysis/analysis-factory.js', function () {
  beforeEach(function () {
    this.analysisCollection = new Backbone.Collection();
    this.analysisFactory = new AnalysisFactory({
      sourceNamesMap: ANALYSIS_TYPE_TO_SOURCE_PARAM_NAMES_MAP,
      analysisCollection: this.analysisCollection
    });
  });

  describe('.analyse', function () {
    it('should generate and return a new analysis', function () {
      var subwayStops = this.analysisFactory.analyse({
        id: 'a0',
        type: 'source',
        params: {
          query: 'SELECT * FROM subway_stops'
        }
      });

      expect(subwayStops.attributes).toEqual({
        id: 'a0',
        type: 'source',
        params: {
          query: 'SELECT * FROM subway_stops'
        }
      });
    });

    it('should not create a new analysis if an analysis with the same id was created already', function () {
      var subwayStops1 = this.analysisFactory.analyse({
        id: 'a0',
        type: 'source',
        params: {
          query: 'SELECT * FROM subway_stops'
        }
      });

      var subwayStops2 = this.analysisFactory.analyse({
        id: 'a0',
        type: 'source',
        params: {
          query: 'SELECT * FROM subway_stops '
        }
      });

      expect(subwayStops1.cid).toEqual(subwayStops2.cid);
    });

    it('should recursively build the anlysis graph', function () {
      var estimatedPopulation = this.analysisFactory.analyse(
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
      var tradeArea = estimatedPopulation.get('params').source;
      var subwayStops = tradeArea.get('params').source;
      expect(tradeArea.get('id')).toEqual('a1');
      expect(subwayStops.get('id')).toEqual('a0');
    });

    it('analysis should be re-created if after it has been removed', function () {
      var subwayStops1 = this.analysisFactory.analyse({
        id: 'a0',
        type: 'source',
        params: {
          query: 'SELECT * FROM subway_stops'
        }
      });

      subwayStops1.remove();

      var subwayStops2 = this.analysisFactory.analyse({
        id: 'a0',
        type: 'source',
        params: {
          query: 'SELECT * FROM subway_stops '
        }
      });

      expect(subwayStops1.cid).not.toEqual(subwayStops2.cid);
    });
  });

  describe('.findNodeById', function () {
    it('should traverse the analysis and return an existing node', function () {
      this.analysisFactory.analyse(
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

      expect(this.analysisFactory.findNodeById('a2').get('id')).toEqual('a2');
      expect(this.analysisFactory.findNodeById('a1').get('id')).toEqual('a1');
      expect(this.analysisFactory.findNodeById('a0').get('id')).toEqual('a0');
    });

    it('should return undefined if node is not found', function () {
      expect(this.analysisFactory.findNodeById('something')).toBeUndefined();

      this.analysisFactory.analyse(
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

      expect(this.analysisFactory.findNodeById('something')).toBeUndefined();
    });
  });
});

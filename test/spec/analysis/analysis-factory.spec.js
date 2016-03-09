var AnalysisFactory = require('../../../src/analysis/analysis-factory');

describe('src/analysis/analysis-factory.js', function () {
  describe('.analyse', function () {
    it('should generate and return a new analysis', function () {
      var analysisFactory = new AnalysisFactory();

      var subwayStops = analysisFactory.analyse({
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
      var analysisFactory = new AnalysisFactory();

      var subwayStops1 = analysisFactory.analyse({
        id: 'a0',
        type: 'source',
        params: {
          query: 'SELECT * FROM subway_stops'
        }
      });

      var subwayStops2 = analysisFactory.analyse({
        id: 'a0',
        type: 'source',
        params: {
          query: 'SELECT * FROM subway_stops '
        }
      });

      expect(subwayStops1.cid).toEqual(subwayStops2.cid);
    });

    it('should recursively build the anlysis graph', function () {
      var analysisFactory = new AnalysisFactory();

      var estimatedPopulation = analysisFactory.analyse(
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

      var tradeArea = estimatedPopulation.findAnalysisById('a1');
      var subwayStops = tradeArea.findAnalysisById('a0');
      expect(estimatedPopulation.get('params').source).toEqual(tradeArea);
      expect(tradeArea.get('params').source).toEqual(subwayStops);
    });

    it('analysis should be re-created if after it has been removed', function () {
      var analysisFactory = new AnalysisFactory();

      var subwayStops1 = analysisFactory.analyse({
        id: 'a0',
        type: 'source',
        params: {
          query: 'SELECT * FROM subway_stops'
        }
      });

      subwayStops1.remove();

      var subwayStops2 = analysisFactory.analyse({
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
      var analysisFactory = new AnalysisFactory();
      analysisFactory.analyse(
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

      expect(analysisFactory.findNodeById('a2').get('id')).toEqual('a2');
      expect(analysisFactory.findNodeById('a1').get('id')).toEqual('a1');
      expect(analysisFactory.findNodeById('a0').get('id')).toEqual('a0');
    });

    it('should return undefined if node is not found', function () {
      var analysisFactory = new AnalysisFactory();
      expect(analysisFactory.findNodeById('something')).toBeUndefined();

      analysisFactory.analyse(
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

      expect(analysisFactory.findNodeById('something')).toBeUndefined();
    });
  });
});

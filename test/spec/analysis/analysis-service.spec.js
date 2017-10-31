var Backbone = require('backbone');
var _ = require('underscore');
var AnalysisService = require('../../../src/analysis/analysis-service');
var CartoDBLayer = require('../../../src/geo/map/cartodb-layer');
var Dataview = require('../../../src/dataviews/dataview-model-base');

describe('src/analysis/analysis-service.js', function () {
  var engineMock = new Backbone.Model();
  var fakeCamshaftReference = {
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
  beforeEach(function () {
    this.analysisService = new AnalysisService({
      engine: engineMock,
      camshaftReference: fakeCamshaftReference
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
      var analysisService = new AnalysisService({
        engine: new Backbone.Model(),
        apiKey: 'THE_API_KEY',
        authToken: 'THE_AUTH_TOKEN',
        camshaftReference: fakeCamshaftReference
      });

      var analysisModel = analysisService.analyse({
        id: 'a0',
        type: 'source',
        query: 'SELECT * FROM subway_stops'
      });

      expect(analysisModel.get('apiKey')).toEqual('THE_API_KEY');
      expect(analysisModel.get('authToken')).toEqual('THE_AUTH_TOKEN');
    });

    it('should recursively build the analysis graph', function () {
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
  });

  describe('.findNodeById', function () {
    it('should traverse the analysis and return an existing node', function () {
      var analysisA = this.analysisService.analyse(
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
      var analysisANodes = analysisA.getNodesCollection();

      var analysisB = this.analysisService.analyse(
        {
          id: 'b0',
          type: 'source',
          params: {
            query: 'SELECT * FROM bus_stops'
          }
        }
      );

      // This specs make easy to know what went wrong when the test fails
      expect(this.analysisService.findNodeById('a2').get('id')).toBe('a2');
      expect(this.analysisService.findNodeById('a1').get('id')).toBe('a1');
      expect(this.analysisService.findNodeById('a0').get('id')).toBe('a0');
      expect(this.analysisService.findNodeById('b0').get('id')).toBe('b0');

      expect(this.analysisService.findNodeById('a2')).toBe(analysisANodes.get('a2'));
      expect(this.analysisService.findNodeById('a1')).toBe(analysisANodes.get('a1'));
      expect(this.analysisService.findNodeById('a0')).toBe(analysisANodes.get('a0'));
      expect(this.analysisService.findNodeById('b0')).toBe(analysisB);

      expect(this.analysisService.findNodeById('c0')).toBeUndefined();
    });

    it('should return undefined if node is not found', function () {
      pending('Included in previous tests. TODO: create new test for this');
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

      var result = this.analysisService._getAnalysisAttributesFromAnalysisDefinition(analysisDefinition, this.analysisService.analyse.bind(this));

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

      var result = this.analysisService._getAnalysisAttributesFromAnalysisDefinition(analysisDefinition, this.analysisService.analyse.bind(this));

      expect(this.analysisService.analyse.calls.count()).toEqual(1);
      expect(this.analysisService.analyse).toHaveBeenCalledWith('a0');
      expect(result).toEqual({
        type: 'sql-function',
        source: 'node'
      });
    });
  });

  describe('.getUniqueAnalysisNodes', function () {
    it('should return the analysis nodes: (single analysis node in a single layer)', function () {
      var analysis = this.analysisService.analyse({
        id: 'a0',
        type: 'source',
        query: 'SELECT * FROM subway_stops'
      });
      var layer = new CartoDBLayer({ source: analysis }, { engine: engineMock });
      var layersCollection = new Backbone.Collection([layer]);
      var dataviewsCollection = new Backbone.Collection();

      var expected = analysis;
      var actual = AnalysisService.getUniqueAnalysisNodes(layersCollection, dataviewsCollection);

      expect(actual[0]).toEqual(expected);
    });

    it('should return the analysis nodes: (2 analysis nodes, 1 dataview, 1 layer)', function () {
      var analysis0 = this.analysisService.analyse({
        id: 'a0',
        type: 'source',
        query: 'SELECT * FROM subway_stops'
      });

      var analysis1 = this.analysisService.analyse({
        id: 'a1',
        type: 'source',
        query: 'SELECT * FROM bus_stops'
      });

      var layer = new CartoDBLayer({ source: analysis0 }, { engine: engineMock });
      var dataview = new Dataview({ id: 'dataview1', source: analysis1 }, { map: {}, engine: engineMock });

      var layersCollection = new Backbone.Collection([layer]);
      var dataviewsCollection = new Backbone.Collection([dataview]);

      var expected = [analysis0, analysis1];
      var actual = AnalysisService.getUniqueAnalysisNodes(layersCollection, dataviewsCollection);

      expect(actual.length).toEqual(expected.length);
      expect(actual).toEqual(expected);
    });

    it('should return the analysis nodes: (2 analysis nodes, 1 dataview, 1 layer)', function () {
      var analysis0 = this.analysisService.analyse({
        id: 'a0',
        type: 'source',
        query: 'SELECT * FROM subway_stops'
      });

      var analysis1 = this.analysisService.analyse({
        id: 'a1',
        type: 'source',
        query: 'SELECT * FROM bus_stops'
      });

      var layer = new CartoDBLayer({ source: analysis0 }, { engine: engineMock });
      var dataview = new Dataview({ id: 'dataview1', source: analysis1 }, { map: {}, engine: engineMock });

      var layersCollection = new Backbone.Collection([layer]);
      var dataviewsCollection = new Backbone.Collection([dataview]);

      var expected = [analysis0, analysis1];
      var actual = AnalysisService.getUniqueAnalysisNodes(layersCollection, dataviewsCollection);

      expect(actual.length).toEqual(expected.length);
      expect(actual).toEqual(expected);
    });

    it('Should return the analysis nodes: (3 analysis nodes, 1 dataview, 2 layers)', function () {
      var analysisA = this.analysisService.analyse(
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
      var analysisNodes = analysisA.getNodesCollection();

      var analysis0 = analysisNodes.get('a0');
      var analysis1 = analysisNodes.get('a1');
      var analysis2 = analysisNodes.get('a2');

      var layer0 = new CartoDBLayer({ source: analysis0 }, { engine: engineMock });
      var layer1 = new CartoDBLayer({ source: analysis2 }, { engine: engineMock });
      var dataview = new Dataview({ id: 'dataview1', source: analysis1 }, { map: {}, engine: engineMock });

      var layersCollection = new Backbone.Collection([layer0, layer1]);
      var dataviewsCollection = new Backbone.Collection([dataview]);

      var expected = [analysis0, analysis2, analysis1];
      var actual = AnalysisService.getUniqueAnalysisNodes(layersCollection, dataviewsCollection);

      // This specs make easy to know what went wrong when the test fails.
      expect(actual.length).toEqual(expected.length);
      expect(actual[0].id).toEqual(expected[0].id);
      expect(actual[1].id).toEqual(expected[1].id);
      expect(actual[2].id).toEqual(expected[2].id);

      expect(actual).toEqual(expected);
    });

    it('should compact layers and dataviews if they do not have sources. It happens in named maps.', function () {
      var analysis = this.analysisService.analyse({
        id: 'a0',
        type: 'source',
        params: {
          query: 'SELECT * FROM subway_stops'
        }
      });
      var layer = new CartoDBLayer({ source: analysis }, { engine: engineMock });
      var dataview = new Dataview({ id: 'dataview1', source: analysis }, { map: {}, engine: engineMock });
      layer.set('source', undefined, { silent: true });
      dataview.set('source', undefined, { silent: true });
      var layersCollection = new Backbone.Collection([layer]);
      var dataviewsCollection = new Backbone.Collection([dataview]);

      var nodes = AnalysisService.getUniqueAnalysisNodes(layersCollection, dataviewsCollection);

      expect(_.isArray(nodes)).toBe(true);
      expect(nodes.length).toBe(0);
    });
  });
});

var AnalysisSerializer = require('../../../../../src/windshaft/map-serializer/anonymous-map-serializer/analysis-serializer');
var AnalysisFactory = require('../../../../../src/analysis/analysis-factory.js');
var Backbone = require('backbone');
var CartoDBLayer = require('../../../../../src/geo/map/cartodb-layer');
var VisModel = require('../../../../../src/vis/vis');

fdescribe('analysis-serializer', function () {
  var analysisFactory;
  beforeEach(function () {
    analysisFactory = new AnalysisFactory({
      analysisCollection: new Backbone.Collection(),
      camshaftReference: fakeCamshaftReference,
      vis: new Backbone.Model()
    });
  });
  describe('.serialize', function () {
    it('should serialize a single analysis', function () {
      var analysisDefinition = {
        id: 'd0',
        type: 'source',
        params: {
          query: 'select * from subway_stops'
        }
      };

      var analysis = analysisFactory.analyse(analysisDefinition);

      var cartoDBLayer = new CartoDBLayer({
        id: 'l1',
        source: analysis,
        cartocss: 'cartocssMock',
        cartocss_version: '2.0'
      }, {
        vis: new VisModel(),
        analysisCollection: new Backbone.Collection()
      });

      var layersCollection = new Backbone.Collection([cartoDBLayer]);
      var dataViewsCollection = new Backbone.Collection([]);
      var actual = AnalysisSerializer.serialize(layersCollection, dataViewsCollection);
      var expected = [analysisDefinition];
      expect(actual).toEqual(expected);
    });

    fit("should NOT include an analysis if it's part of the analysis of another layer", function () {
      var analysis1 = analysisFactory.analyse({
        id: 'b1',
        type: 'union',
        params: {
          join_on: 'cartodb_id',
          source: {
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
                      query: 'select * from subway_stops'
                    }
                  }
                }
              }
            }
          }
        }
      });
      var analysis2 = analysisFactory.analyse({
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
                  query: 'select * from subway_stops'
                }
              }
            }
          }
        }
      });

      var cartoDBLayer1 = new CartoDBLayer({
        id: 'l1',
        source: analysis1,
        cartocss: 'cartocssMock',
        cartocss_version: '2.0'
      }, {
        vis: new VisModel(),
        analysisCollection: new Backbone.Collection()
      });

      var cartoDBLayer2 = new CartoDBLayer({
        id: 'l2',
        source: analysis2,
        cartocss: 'cartocssMock',
        cartocss_version: '2.0'
      }, {
        vis: new VisModel(),
        analysisCollection: new Backbone.Collection()
      });

      var layersCollection = new Backbone.Collection([cartoDBLayer1, cartoDBLayer2]);
      var dataViewsCollection = new Backbone.Collection([]);
      var actual = AnalysisSerializer.serialize(layersCollection, dataViewsCollection);
      var expected = [{
        'id': 'b1',
        'type': 'union',
        'params': {
          'join_on': 'cartodb_id',
          'source': {
            'id': 'a2',
            'type': 'estimated-population',
            'params': {
              'columnName': 'estimated_people',
              'source': {
                'id': 'a1',
                'type': 'trade-area',
                'params': {
                  'kind': 'walk',
                  'time': 300,
                  'source': {
                    'id': 'a0',
                    'type': 'source',
                    'params': {
                      'query': 'select * from subway_stops'
                    }
                  }
                }
              }
            }
          }
        }
      }];
      expect(actual.length).toEqual(1);
      expect(actual).toEqual(expected);
    });
  });
});

var fakeCamshaftReference = {
  getSourceNamesForAnalysisType: function (analysisType) {
    var map = {
      'source': [],
      'trade-area': ['source'],
      'estimated-population': ['source'],
      'point-in-polygon': ['points_source', 'polygons_source'],
      'union': ['source']
    };
    if (!map[analysisType]) {
      throw new Error('analysis type ' + analysisType + ' not supported');
    }
    return map[analysisType];
  },

  getParamNamesForAnalysisType: function (analysisType) {
    var map = {
      'source': ['query'],
      'trade-area': ['kind', 'time'],
      'estimated-population': ['columnName'],
      'point-in-polygon': [],
      'union': ['join_on']
    };
    if (!map[analysisType]) {
      throw new Error('analysis type ' + analysisType + ' not supported');
    }
    return map[analysisType];
  }
};

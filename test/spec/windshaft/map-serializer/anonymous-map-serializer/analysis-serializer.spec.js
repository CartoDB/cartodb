var AnalysisSerializer = require('../../../../../src/windshaft/map-serializer/anonymous-map-serializer/analysis-serializer');
var AnalysisFactory = require('../../../../../src/analysis/analysis-factory.js');
var Backbone = require('backbone');
var CartoDBLayer = require('../../../../../src/geo/map/cartodb-layer');
var VisModel = require('../../../../../src/vis/vis');

describe('analysis-serializer', function () {
  describe('.serialize', function () {
    it('should serialize a single analysis', function () {
      var analysisDefinition = {
        id: 'd0',
        type: 'source',
        params: {
          query: 'select * from subway_stops'
        }
      };

      var analysisFactory = new AnalysisFactory({
        analysisCollection: new Backbone.Collection(),
        camshaftReference: fakeCamshaftReference,
        vis: new Backbone.Model()
      });

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

    it('should serialize a single analysis', function () {
      var analysisDefinition = {
        id: 'd0',
        type: 'source',
        params: {
          query: 'select * from subway_stops'
        }
      };

      var analysisFactory = new AnalysisFactory({
        analysisCollection: new Backbone.Collection(),
        camshaftReference: fakeCamshaftReference,
        vis: new Backbone.Model()
      });

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

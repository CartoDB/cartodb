var AnalysisSerializer = require('../../../../../src/windshaft/map-serializer/anonymous-map-serializer/analysis-serializer');
var AnalysisFactory = require('../../../../../src/analysis/analysis-factory.js');
var Backbone = require('backbone');

fdescribe('analysis-serializer', function () {
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
      var analysisCollection = new Backbone.Collection([analysis]);
      var actual = AnalysisSerializer.serialize(analysisCollection, new Backbone.Collection(), new Backbone.Collection());
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

var _ = require('underscore');
var VisModel = require('../../src/vis/vis');
var AnalysisModel = require('../../src/analysis/analysis-model');

// We use a "fake" reference instead of the one in src/analysis/camshaft-reference
// to ensure that tests won't break if the real thing changes
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

var createAnalysisModel = function (attrs) {
  if (!_.has(attrs, 'type')) {
    attrs.type = 'source';
  }

  var model = new AnalysisModel(attrs, {
    camshaftReference: fakeCamshaftReference,
    engine: {
      reload: function () {}
    }
  });

  return model;
};

function createVisModel () {
  return new VisModel();
}

module.exports = {
  createAnalysisModel: createAnalysisModel,
  createVisModel: createVisModel
};

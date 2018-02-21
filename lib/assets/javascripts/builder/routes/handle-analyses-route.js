var AnalysesService = require('builder/editor/layers/layer-content-views/analyses/analyses-service');

module.exports = function (currentRoute) {
  var routeName = currentRoute[0];
  var analysisNode = currentRoute[2];

  if (routeName === 'layer_analyses' && !analysisNode) {
    AnalysesService.clearNotAppliedAnalysis();
  }
};

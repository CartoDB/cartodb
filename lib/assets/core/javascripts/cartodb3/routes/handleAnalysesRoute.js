var AnalysesService = require('../editor/layers/layer-content-views/analyses/analyses-service')

var handleAnalysesRoute = function (routeModel) {
  var currentRoute = routeModel.get('currentRoute');
  var routeName = currentRoute[0];
  var analysisNode = currentRoute[2];

  if (routeName === 'layer_analyses' && !analysisNode) {
    AnalysesService.clearNotAppliedAnalysis();
  }
};

module.exports = handleAnalysesRoute;

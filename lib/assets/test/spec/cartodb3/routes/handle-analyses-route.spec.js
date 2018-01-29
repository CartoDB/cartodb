var handleAnalysesRoute = require('../../../../javascripts/cartodb3/routes/handle-analyses-route');
var AnalysesService = require('../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analyses-service');

describe('routes/handleAnalysesRoute', function () {
  it('should handle analyses route', function () {
    spyOn(AnalysesService, 'clearNotAppliedAnalysis');

    handleAnalysesRoute(['layer_analyses', 'l1-1', null, null]);

    expect(AnalysesService.clearNotAppliedAnalysis).toHaveBeenCalled();
  });
});

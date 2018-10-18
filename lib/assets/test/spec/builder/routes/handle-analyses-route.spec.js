var handleAnalysesRoute = require('builder/routes/handle-analyses-route');
var AnalysesService = require('builder/editor/layers/layer-content-views/analyses/analyses-service');

describe('routes/handleAnalysesRoute', function () {
  it('should handle analyses route', function () {
    spyOn(AnalysesService, 'clearNotAppliedAnalysis');

    handleAnalysesRoute(['layer_analyses', 'l1-1', null, null]);

    expect(AnalysesService.clearNotAppliedAnalysis).toHaveBeenCalled();
  });
});

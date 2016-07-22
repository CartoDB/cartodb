var AnalysisTooltip = require('../../../../../../javascripts/cartodb3/editor/layers/analysis-views/analyses-tooltip-error');
var $ = require('jquery');

describe('editor/layers/analysis-views/analysis-tooltip-error', function () {
  var view;
  var analysisNode;

  beforeEach(function () {
    view = $('<div></div>');

    analysisNode = {
      get: function (what) {
        if (what === 'status') return 'failed';
        if (what === 'error') return false;
        if (what === 'id') return 'a1';
      }
    };

    spyOn(AnalysisTooltip, 'showTooltip').and.callThrough();
    spyOn(AnalysisTooltip, 'destroyTooltip').and.callThrough();
    spyOn(AnalysisTooltip, 'createTooltip').and.callThrough();

    AnalysisTooltip.track(analysisNode, view, null);
  });

  it('should create the tooltip on mouseover', function () {
    view.trigger('mouseover');
    expect(AnalysisTooltip.showTooltip).toHaveBeenCalled();
    expect(AnalysisTooltip.createTooltip).toHaveBeenCalled();
    expect(AnalysisTooltip.tooltip).toBeDefined();
  });

  it('should destroy the tooltip on mouseout', function () {
    view.trigger('mouseover');
    expect(AnalysisTooltip.tooltip).toBeDefined();
    view.trigger('mouseout');
    expect(AnalysisTooltip.destroyTooltip).toHaveBeenCalled();
  });

  it('should not have any leaks', function () {
    AnalysisTooltip.destroy();
    view.trigger('mouseover');
    expect(AnalysisTooltip.showTooltip).not.toHaveBeenCalled();
  });
});

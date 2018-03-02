var $ = require('jquery');
var AnalysisTooltip = require('builder/editor/layers/analysis-views/analyses-tooltip-error');

describe('editor/layers/analysis-views/analysis-tooltip-error', function () {
  beforeEach(function () {
    this.view = $('<div class="view"><div class="Error" style="width:10px; height: 10px; background: red; "></div></div>');
    $('body').append(this.view);

    this.analysisNode = {
      get: function (what) {
        if (what === 'status') return 'failed';
        if (what === 'error') return false;
        if (what === 'id') return 'a1';
      }
    };

    this._analysisTooltip = new AnalysisTooltip({
      analysisNode: this.analysisNode,
      element: this.view,
      triggerSelector: '.Error'
    });
  });

  it('should not have any leaks', function () {
    expect(this._analysisTooltip).toHaveNoLeaks();
  });

  it('should create the tooltip on mouseover', function () {
    this.view.find('.Error').trigger('mouseover');
    expect(this._analysisTooltip.tooltip).toBeDefined();
  });

  it('should destroy the tooltip on mouseout', function () {
    this.view.find('.Error').trigger('mouseover');
    expect(this._analysisTooltip.tooltip).toBeDefined();
    this.view.find('.Error').trigger('mouseout');
    expect(this._analysisTooltip.tooltip).not.toBeDefined();
  });

  afterEach(function () {
    $('.view').remove();
  });
});

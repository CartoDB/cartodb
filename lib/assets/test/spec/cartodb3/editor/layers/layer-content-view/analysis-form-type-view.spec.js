var _ = require('underscore');
var AnalysisFormTypeView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses-form-types/analysis-form-type-view');
var AnalysisDefinitionNodeModel = require('../../../../../../javascripts/cartodb3/data/analysis-definition-node-model');

describe('editor/layers/layer-content-view/analyses-form-type-view', function () {
  beforeEach(function () {
    // "Removed" debounce for not conflict with tests
    spyOn(_, 'debounce').and.callFake(function (func) {
      return func;
    });

    this.model = new AnalysisDefinitionNodeModel({
      id: 'a1',
      type: 'trade-area',
      kind: 'walk',
      source: 'a0',
      time: 100
    }, {
      sqlAPI: {}
    });

    this.view = new AnalysisFormTypeView({
      analysisDefinitionNode: this.model
    });
    this.view.render();
  });

  it('should render a form properly', function () {
    expect(this.view.$('form').length).toBe(1);
    expect(_.size(this.view._subviews)).toBe(0);
  });

  it('should update model if there is any form change', function () {
    expect(this.model.get('time')).toBe(100);

    var $input = this.view.$('input[name="time"]');
    $input.val('1000');
    $input.trigger('keyup');

    expect(this.model.get('time')).toBe(1000);
    expect(this.model.get('kind')).toBe('walk');
  });

  it('should remove form when view is cleaned', function () {
    spyOn(this.view._analysisFormView, 'remove');
    this.view.clean();
    expect(this.view._analysisFormView.remove).toHaveBeenCalled();
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});

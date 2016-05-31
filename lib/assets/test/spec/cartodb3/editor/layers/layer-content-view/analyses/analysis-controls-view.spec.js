var Backbone = require('backbone');
var BaseAnalysisFormModel = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-form-models/base-analysis-form-model');
var AnalysisControlsView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-controls-view');

describe('editor/layers/layer-content-view/analyses/analysis-controls-view', function () {
  beforeEach(function () {
    this.formModel = new BaseAnalysisFormModel({
      id: 'a1'
    }, {
      layerDefinitionModel: {},
      analysisSourceOptionsModel: {}
    });
    spyOn(this.formModel, 'save');
    spyOn(this.formModel, 'isValid').and.returnValue(false);

    this.view = new AnalysisControlsView({
      formModel: this.formModel
    });
    this.view.render();
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render a apply button disabled', function () {
    expect(this.view.$el.html()).toContain('is-disabled');
  });

  it('should not allow to apply changes', function () {
    this.view.$('.js-apply').click();
    expect(this.formModel.save).not.toHaveBeenCalled();
  });

  describe('when form is valid', function () {
    beforeEach(function () {
      this.formModel.isValid.and.returnValue(true);
      this.formModel.set('foo', 'just to trigger re-render');
    });

    it('should enable button', function () {
      expect(this.view.$el.html()).not.toContain('is-disabled');
    });

    describe('when apply is clicked', function () {
      beforeEach(function () {
        this.view.$('.js-apply').click();
      });

      it('should apply changes', function () {
        expect(this.formModel.save).toHaveBeenCalled();
      });
    });
  });
});

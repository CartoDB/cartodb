var cdb = require('cartodb.js');
var AnalysisControlsView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analysis-controls-view');

describe('editor/layers/layer-content-view/analysis-controls-view', function () {
  beforeEach(function () {
    this.formModel = new cdb.core.Model({
      errors: {}
    });
    this.analysisDefinitionNodeModel = new cdb.core.Model();

    this.formModel.applyChanges = jasmine.createSpy('applyChanges');

    this.view = new AnalysisControlsView({
      formModel: this.formModel,
      analysisDefinitionNodeModel: this.analysisDefinitionNodeModel
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
    expect(this.formModel.applyChanges).not.toHaveBeenCalled();
  });

  describe('when form is valid', function () {
    beforeEach(function () {
      this.formModel.set('errors', undefined);
    });

    it('should enable button', function () {
      expect(this.view.$el.html()).not.toContain('is-disabled');
    });

    describe('when apply is clicked', function () {
      beforeEach(function () {
        this.view.$('.js-apply').click();
      });

      it('should apply changes', function () {
        expect(this.formModel.applyChanges).toHaveBeenCalled();
        expect(this.formModel.applyChanges).toHaveBeenCalledWith(this.analysisDefinitionNodeModel);
      });
    });
  });
});

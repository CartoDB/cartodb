var userActions = require('../../../../../../../javascripts/cartodb3/data/user-actions');
var UserModel = require('../../../../../../../javascripts/cartodb3/data/user-model');
var BaseAnalysisFormModel = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-form-models/base-analysis-form-model');
var AnalysisControlsView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-controls-view');

describe('editor/layers/layer-content-view/analyses/analysis-controls-view', function () {
  beforeEach(function () {
    var userModel = new UserModel({
      username: 'pepe',
      actions: {
        private_tables: true
      }
    }, {
      configModel: 'c'
    });
    spyOn(userModel, 'fetch');

    this.formModel = new BaseAnalysisFormModel({
      id: 'a1'
    }, {
      configModel: {},
      layerDefinitionModel: {},
      analysisSourceOptionsModel: {}
    });
    spyOn(this.formModel, 'isValid').and.returnValue(false);

    this.userActions = userActions({
      userModel: userModel,
      analysisDefinitionsCollection: {},
      analysisDefinitionNodesCollection: {},
      layerDefinitionsCollection: {},
      widgetDefinitionsCollection: {}
    });
    spyOn(this.userActions, 'saveAnalysis');

    this.view = new AnalysisControlsView({
      userModel: userModel,
      userActions: this.userActions,
      formModel: this.formModel,
      stackLayoutModel: {}
    });
    this.view.render();
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render a save button disabled', function () {
    expect(this.view.$el.html()).toContain('is-disabled');
  });

  it('should not allow to save', function () {
    this.view.$('.js-save').click();
    expect(this.userActions.saveAnalysis).not.toHaveBeenCalled();
  });

  it('should have create label since not persisted yet', function () {
    expect(this.view.$('.js-save').html()).toContain('create');
  });

  describe('when form is valid', function () {
    beforeEach(function () {
      this.formModel.isValid.and.returnValue(true);
      this.formModel.set('foo', 'just to trigger re-render');
    });

    it('should enable button', function () {
      expect(this.view.$el.html()).not.toContain('is-disabled');
    });

    describe('when save button is clicked', function () {
      beforeEach(function () {
        this.view.$('.js-save').click();
      });

      it('should save changes', function () {
        expect(this.userActions.saveAnalysis).toHaveBeenCalledWith(this.formModel);
      });
    });
  });

  describe('when model is persisted', function () {
    beforeEach(function () {
      this.formModel.set('persisted', true);
    });

    it('should change label to aplpy', function () {
      expect(this.view.$('.js-save').html()).toContain('apply');
    });
  });
});

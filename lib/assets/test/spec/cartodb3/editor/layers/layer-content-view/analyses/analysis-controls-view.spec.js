var userActions = require('../../../../../../../javascripts/cartodb3/data/user-actions');
var UserModel = require('../../../../../../../javascripts/cartodb3/data/user-model');
var BaseAnalysisFormModel = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-form-models/base-analysis-form-model');
var AnalysisControlsView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-controls-view');

describe('editor/layers/layer-content-view/analyses/analysis-controls-view', function () {
  beforeEach(function () {
    this.userModel = new UserModel({
      username: 'pepe',
      actions: {
        private_tables: true
      }
    }, {
      configModel: 'c'
    });
    spyOn(this.userModel, 'fetch').and.callThrough();
    this.userModel.sync = function (a, b, opts) {};

    this.formModel = new BaseAnalysisFormModel({
      id: 'a1'
    }, {
      configModel: {},
      layerDefinitionModel: {},
      analysisSourceOptionsModel: {}
    });
    spyOn(this.formModel, 'isValid').and.returnValue(false);

    this.userActions = userActions({
      userModel: this.userModel,
      analysisDefinitionsCollection: {},
      analysisDefinitionNodesCollection: {},
      layerDefinitionsCollection: {},
      widgetDefinitionsCollection: {}
    });
    spyOn(this.userActions, 'saveAnalysis');

    this.stackLayoutModel = jasmine.createSpyObj('stackLayoutModel', ['prevStep']);

    this.view = new AnalysisControlsView({
      userModel: this.userModel,
      userActions: this.userActions,
      formModel: this.formModel,
      stackLayoutModel: this.stackLayoutModel
    });
    this.view.render();
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  describe('analysis without quota', function () {
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

  describe('analysis with quota', function () {
    beforeEach(function () {
      this.formModel.set('type', 'trade-area');
      this.view.render();
    });

    it('should render quota component', function () {
      expect(this.view.$('.Infobox-wrapper').length).toBe(1);
      expect(this.view.$('.Infobox .CDB-LoaderIcon').length).toBe(1); // Loading state
    });

    it('should fetch user model', function () {
      expect(this.userModel.fetch).toHaveBeenCalled();
    });

    it('should not fetch user model if it has been fetched', function () {
      expect(this.userModel.fetch.calls.count()).toBe(1);
      expect(this.view._userFetchModelState).toBe('loading');
      this.view.render();
      expect(this.userModel.fetch.calls.count()).toBe(1);
      expect(this.view._userFetchModelState).toBe('loading');
    });

    describe('on user quotas updated', function () {
      beforeEach(function () {
        this.userModel.sync = function (a, b, opts) {
          opts.success();
        };
        this.view._userFetchModelState = 'idle';
        this.view.render();
      });

      it('should change userFetchModelState when user model is fetched', function () {
        expect(this.view._userFetchModelState).toBe('ready');
        expect(this.view.$('.Infobox.is-alert').length).toBe(1);
        expect(this.view.$('.Infobox-buttons').length).toBe(1);
      });

      it('should not let user run the analysis if form is not valid', function () {
        this.formModel.isValid.and.returnValue(false);
        this.userActions.saveAnalysis.calls.reset();
        this.view.render();
        this.view.$('.js-secondary .js-action').click();
        expect(this.userActions.saveAnalysis).not.toHaveBeenCalled();
      });

      it('should not let user run the analysis if user doesn\'t any credit', function () {
        this.formModel.isValid.and.returnValue(true);
        this.userModel.set('here_isolines', {
          quota: 100,
          monthly_use: 100,
          block_price: 1
        });
        this.userActions.saveAnalysis.calls.reset();
        this.view.render();
        this.view.$('.js-secondary .js-action').click();
        expect(this.userActions.saveAnalysis).not.toHaveBeenCalled();
      });

      it('should get back to analyses list when cancel is clicked', function () {
        this.view.$('.js-primary .js-action').click();
        expect(this.stackLayoutModel.prevStep).toHaveBeenCalled();
      });

      it('should save changes', function () {
        this.formModel.isValid.and.returnValue(true);
        this.userModel.set('here_isolines', {
          quota: 100,
          monthly_use: 0,
          block_price: 1
        });
        this.view.render();
        this.view.$('.js-secondary .js-action').click();
        console.log(this.view.$el.html());
        expect(this.userActions.saveAnalysis).toHaveBeenCalledWith(this.formModel);
      });
    });
  });
});

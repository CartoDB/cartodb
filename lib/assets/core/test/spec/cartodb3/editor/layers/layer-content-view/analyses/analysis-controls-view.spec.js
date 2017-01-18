var Backbone = require('backbone');
var userActions = require('../../../../../../../javascripts/cartodb3/data/user-actions');
var UserModel = require('../../../../../../../javascripts/cartodb3/data/user-model');
var BaseAnalysisFormModel = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-form-models/base-analysis-form-model');
var AnalysisControlsView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-controls-view');
var analyses = require('../../../../../../../javascripts/cartodb3/data/analyses');
var AnalysesServicesQuota = require('../../../../../../../javascripts/cartodb3/data/analyses-services-quota');
var cdb = require('cartodb.js');

describe('editor/layers/layer-content-view/analyses/analysis-controls-view', function () {
  var sqlExecuteOriginal = cdb.SQL.prototype.execute;

  beforeEach(function () {
    cdb.SQL.prototype.execute = function (query, vars, params) {
      params.success({
        rows: [{
          cdb_enough_quota: true
        }]
      });
    };

    var configModel = new Backbone.Model({
      user_name: 'cdb',
      sql_api_template: 'wadus',
      api_key: 'wadus'
    });

    AnalysesServicesQuota.initialize({
      configModel: configModel
    });

    AnalysesServicesQuota.serviceQuotasCollection = new Backbone.Collection([{
      service: 'isolines',
      monthly_quota: 0,
      used_quota: 0,
      soft_limit: false,
      provider: 'heremaps'
    }]);

    this.analysisNode = new Backbone.Model();
    this.analysisNode.hasFailed = function () {
      return this.analysisNode.get('status') === 'failed';
    }.bind(this);

    this.analysisNode.isDone = function () {
      return this.analysisNode.get('status');
    }.bind(this);

    this.analysis = jasmine.createSpyObj('vis.analysis', ['findNodeById']);
    this.analysis.findNodeById.and.returnValue(this.analysisNode);

    this.userModel = new UserModel({
      username: 'pepe',
      isolines_provider: 'heremaps',
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
      analyses: analyses,
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
      analysisNode: this.analysisNode,
      userModel: this.userModel,
      userActions: this.userActions,
      formModel: this.formModel,
      stackLayoutModel: this.stackLayoutModel
    });
    this.view.render();
  });

  afterEach(function () {
    cdb.SQL.prototype.execute = sqlExecuteOriginal;
  });

  it('should generate a viewModel', function () {
    expect(this.view._viewModel).toBeDefined();
    expect(this.view._viewModel.get('isNewAnalysis')).toBeFalsy();
    expect(this.view._viewModel.get('userFetchModelState')).toBe('idle');
    expect(this.view._viewModel.get('hasChanges')).toBeFalsy();
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

    it('should have create label since it is not persisted yet', function () {
      expect(this.view.$('.js-save').html()).toContain('create');
    });

    describe('when form is valid', function () {
      beforeEach(function () {
        this.formModel.isValid.and.returnValue(true);
        this.formModel.set('foo', 'just to trigger re-render');
      });

      it('should enable button when analysis node\'s status is ready', function () {
        expect(this.view.$el.html()).toContain('is-disabled');
        this.analysisNode.set('status', 'ready');
        expect(this.view.$el.html()).not.toContain('is-disabled');
      });

      describe('when save button is clicked', function () {
        beforeEach(function () {
          this.analysisNode.set('status', 'ready');
          this.view.$('.js-save').click();
        });

        it('should save changes', function () {
          expect(this.userActions.saveAnalysis).toHaveBeenCalledWith(this.formModel);
        });
      });
    });

    describe('when the analysis failed', function () {
      beforeEach(function () {
        this.formModel.isValid.and.returnValue(true);
        this.formModel.set('foo', 'just to trigger re-render');
      });

      it('should enable button when analysis node\'s status is ready', function () {
        expect(this.view.$el.html()).toContain('is-disabled');
        this.analysisNode.set('status', 'failed');
        expect(this.view.$el.html()).not.toContain('is-disabled');
      });

      describe('when save button is clicked', function () {
        beforeEach(function () {
          this.analysisNode.set('status', 'failed');
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

      it('should change label to apply', function () {
        expect(this.view.$('.js-save').html()).toContain('apply');
      });
    });
  });

  describe('analysis with quota', function () {
    beforeEach(function () {
      spyOn(this.view, '_canSave').and.returnValue(true);
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
      expect(this.view._viewModel.get('userFetchModelState')).toBe('loading');
      this.view.render();
      expect(this.userModel.fetch.calls.count()).toBe(1);
      expect(this.view._viewModel.get('userFetchModelState')).toBe('loading');
    });

    describe('on user quotas updated', function () {
      beforeEach(function () {
        this.userModel.sync = function (a, b, opts) {
          opts.success();
        };
        this.view._viewModel.set('userFetchModelState', 'idle');
        this.view.render();
      });

      it('should change userFetchModelState when user model is fetched', function () {
        expect(this.view._viewModel.get('userFetchModelState')).toBe('ready');
        expect(this.view.$('.Infobox.is-alert').length).toBe(1);
        expect(this.view.$('.Infobox-buttons').length).toBe(1);
      });

      it('should not let user run the analysis if form is not valid', function () {
        this.formModel.isValid.and.returnValue(false);
        this.userActions.saveAnalysis.calls.reset();
        this.view._viewModel.set('userFetchModelState', 'idle');
        this.view.render();
        this.view.$('.js-mainAction').click();
        expect(this.userActions.saveAnalysis).not.toHaveBeenCalled();
      });

      it('should not let user run the analysis if user doesn\'t any credit', function () {
        this.formModel.isValid.and.returnValue(true);
        AnalysesServicesQuota.serviceQuotasCollection = new Backbone.Collection([{
          service: 'isolines',
          monthly_quota: 100,
          used_quota: 100,
          soft_limit: false,
          provider: 'heremaps'
        }]);

        this.userModel.set('here_isolines', {
          block_price: 1
        });
        this.userActions.saveAnalysis.calls.reset();
        this.view._viewModel.set('userFetchModelState', 'idle');
        this.view.render();
        this.view.$('.js-mainAction').click();
        expect(this.userActions.saveAnalysis).not.toHaveBeenCalled();
      });

      it('should show the correct message if user doesn\'t any credit but has quota', function () {
        this.formModel.isValid.and.returnValue(true);
        AnalysesServicesQuota.serviceQuotasCollection = new Backbone.Collection([{
          service: 'isolines',
          monthly_quota: 100,
          used_quota: 100,
          soft_limit: false,
          provider: 'heremaps'
        }]);

        this.userModel.set('here_isolines', {
          block_price: 1
        });
        this.view._viewModel.set('userFetchModelState', 'idle');
        this.view.render();
        expect(this.view.$el.text()).toContain('no-credits-body');
      });

      it('should show the correct message if user doesn\'t have any quota', function () {
        this.formModel.isValid.and.returnValue(true);
        AnalysesServicesQuota.serviceQuotasCollection = new Backbone.Collection([{
          service: 'isolines',
          monthly_quota: 0,
          used_quota: 0,
          soft_limit: false,
          provider: 'heremaps'
        }]);

        this.userModel.set('here_isolines', {
          block_price: 1
        });
        this.view._viewModel.set('userFetchModelState', 'idle');
        this.view.render();
        expect(this.view.$el.text()).toContain('no-quota-assigned-body');
      });

      it('should get back to analyses list when cancel is clicked', function () {
        this.view.$('.js-secondAction').click();
        expect(this.stackLayoutModel.prevStep).toHaveBeenCalled();
      });

      it('should save changes', function () {
        this.formModel.isValid.and.returnValue(true);
        this.analysisNode.set('status', 'ready');
        AnalysesServicesQuota.serviceQuotasCollection = new Backbone.Collection([{
          service: 'isolines',
          monthly_quota: 100,
          used_quota: 0,
          soft_limit: false,
          provider: 'heremaps'
        }]);

        this.userModel.set('here_isolines', {
          block_price: 1
        });
        this.view._viewModel.set('userFetchModelState', 'idle');
        this.view.render();
        this.view.$('.js-mainAction').click();
        expect(this.userActions.saveAnalysis).toHaveBeenCalledWith(this.formModel);
      });

      it('should show the right message for not quota enough', function () {
        cdb.SQL.prototype.execute = function (query, vars, params) {
          params.success({
            rows: [{
              cdb_enough_quota: false
            }]
          });
        };

        this.view._viewModel.set('userFetchModelState', 'idle');
        this.view.render();
        expect(this.view.$el.text()).toContain('no-credits-enough-body');
      });
    });
  });
});

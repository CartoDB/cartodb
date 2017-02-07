var Backbone = require('backbone');
var userActions = require('../../../../../../../javascripts/cartodb3/data/user-actions');
var UserModel = require('../../../../../../../javascripts/cartodb3/data/user-model');
var BaseAnalysisFormModel = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-form-models/base-analysis-form-model');
var AnalysisControlsView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-controls-view');
var analyses = require('../../../../../../../javascripts/cartodb3/data/analyses');
var AnalysesQuotaInfo = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analyses-quota/analyses-quota-info');
var AnalysesQuotaEnough = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analyses-quota/analyses-quota-enough');
var AnalysesQuotaEstimation = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analyses-quota/analyses-quota-estimation-input');
var mockSQL = require('./analyses-quota/mock-sql');

describe('editor/layers/layer-content-view/analyses/analysis-controls-view', function () {
  beforeEach(function () {
    var configModel = new Backbone.Model({
      user_name: 'foo',
      sql_api_template: 'foo',
      api_key: 'foo'
    });

    var querySchemaModel = new Backbone.Model({
      query: 'SELECT * from foo'
    });

    this.quotaInfo = new AnalysesQuotaInfo([], {
      configModel: configModel
    });

    mockSQL.mock(this.quotaInfo, 'success', {
      rows: [
        {service: 'isolines', monthly_quota: 2000, used_quota: 23, soft_limit: false, provider: 'heremaps'},
        {service: 'hires_geocoder', monthly_quota: 1000, used_quota: 0, soft_limit: true, provider: 'heremaps'},
        {service: 'routing', monthly_quota: 1000, used_quota: 0, soft_limit: false, provider: 'mapzen'},
        {service: 'observatory', monthly_quota: 1000, used_quota: 0, soft_limit: false, provider: 'data observatory'}
      ]
    });

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
      stackLayoutModel: this.stackLayoutModel,
      configModel: configModel,
      quotaInfo: this.quotaInfo,
      querySchemaModel: querySchemaModel
    });
    // this.view.render();
  });

  it('should generate a viewModel', function () {
    expect(this.view._viewModel).toBeDefined();
    expect(this.view._viewModel.get('isNewAnalysis')).toBeFalsy();
    expect(this.view._viewModel.get('userFetchModelState')).toBe('fetched');
    expect(this.view._viewModel.get('hasChanges')).toBeFalsy();
  });

  it('should render loading when fetching', function () {
    this.view._viewModel.set('userFetchModelState', 'fetching');
    expect(this.view.$('.Infobox-wrapper').length).toBe(1);
    expect(this.view.$('.Infobox .CDB-LoaderIcon').length).toBe(1); // Loading state
  });

  it('should render when form changes', function () {
    spyOn(this.view, 'render');
    this.formModel.set('type', 'foo');
    expect(this.view.render).toHaveBeenCalled();
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  describe('analysis without quota', function () {
    beforeEach(function () {
      this.formModel.set('type', 'centroid');
    });

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
      mockSQL.mock(AnalysesQuotaEstimation, 'success', {
        rows: [{'QUERY PLAN': 'Seq Scan on foo (cost=0.00..6.97 rows=325 width=108)'}]
      });

      mockSQL.mock(AnalysesQuotaEnough, 'success', {
        rows: [{'cdb_enough_quota': true}]
      });

      this.formModel.set('type', 'trade-area');
    });

    it('should not let user run the analysis if form is not valid', function () {
      this.formModel.isValid.and.returnValue(false);
      this.userActions.saveAnalysis.calls.reset();
      this.view.render();
      this.view.$('.js-mainAction').click();
      expect(this.userActions.saveAnalysis).not.toHaveBeenCalled();
    });

    it('should not let user run the analysis if user doesn\'t any credit', function () {
      spyOn(this.view, '_canSave').and.returnValue(true);
      this.formModel.isValid.and.returnValue(true);

      var isolines = this.quotaInfo.getService('isolines');
      isolines.set({
        monthly_quota: 2000,
        used_quota: 2000
      });

      mockSQL.mock(AnalysesQuotaEnough, 'success', {
        rows: [{'cdb_enough_quota': false}]
      });

      this.userModel.set('here_isolines', {
        block_price: 1
      });

      this.userActions.saveAnalysis.calls.reset();
      this.view.render();
      this.view.$('.js-mainAction').click();
      expect(this.userActions.saveAnalysis).not.toHaveBeenCalled();
    });

    it('should get back to analyses list when cancel is clicked', function () {
      spyOn(this.view, '_canSave').and.returnValue(true);
      var isolines = this.quotaInfo.getService('isolines');
      isolines.set({
        monthly_quota: 2000,
        used_quota: 1900
      });
      this.view.render();

      this.view.$('.js-secondAction').click();
      expect(this.stackLayoutModel.prevStep).toHaveBeenCalled();
    });

    it('should save changes', function () {
      spyOn(this.view, '_canSave').and.returnValue(true);
      this.formModel.isValid.and.returnValue(true);
      this.analysisNode.set('status', 'ready');

      var isolines = this.quotaInfo.getService('isolines');
      isolines.set({
        monthly_quota: 2000,
        used_quota: 0
      });

      this.userModel.set('here_isolines', {
        block_price: 1
      });

      this.view.render();
      this.view.$('.js-mainAction').click();
      expect(this.userActions.saveAnalysis).toHaveBeenCalledWith(this.formModel);
    });
  });
});

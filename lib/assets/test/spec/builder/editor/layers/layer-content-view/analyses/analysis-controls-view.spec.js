var Backbone = require('backbone');
var _ = require('underscore');
var userActions = require('builder/data/user-actions');
var UserModel = require('builder/data/user-model');
var BaseAnalysisFormModel = require('builder/editor/layers/layer-content-views/analyses/analysis-form-models/base-analysis-form-model');
var AnalysisControlsView = require('builder/editor/layers/layer-content-views/analyses/analysis-controls-view');
var analyses = require('builder/data/analyses');
var AnalysesQuotaOptions = require('builder/editor/layers/layer-content-views/analyses/analyses-quota/analyses-quota-options');
var AnalysesQuotaInfo = require('builder/editor/layers/layer-content-views/analyses/analyses-quota/analyses-quota-info');
var AnalysesQuotaEnough = require('builder/editor/layers/layer-content-views/analyses/analyses-quota/analyses-quota-enough');
var AnalysesQuotaEstimation = require('builder/editor/layers/layer-content-views/analyses/analyses-quota/analyses-quota-estimation-input');
var AnalysisFormsCollection = require('builder/editor/layers/layer-content-views/analyses/analysis-forms-collection');
var mockSQL = require('./analyses-quota/mock-sql');

describe('editor/layers/layer-content-view/analyses/analysis-controls-view', function () {
  beforeEach(function () {
    spyOn(_, 'debounce').and.callFake(function (func) {
      return function () {
        func.apply(this, arguments);
      };
    });

    this.configModel = new Backbone.Model({
      user_name: 'foo',
      sql_api_template: 'foo',
      api_key: 'foo'
    });

    this.querySchemaModel = new Backbone.Model({
      query: 'SELECT * from foo'
    });

    this.quotaInfo = AnalysesQuotaInfo.get(this.configModel);

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
      return this.analysisNode.get('status') === 'ready';
    }.bind(this);
    this.analysisNode.canBeDeletedByUser = function () {
      return true;
    };

    this.userModel = new UserModel({
      username: 'pepe',
      isolines_provider: 'heremaps',
      actions: {
        private_tables: true
      }
    }, {
      configModel: 'c'
    });

    this.formModel = new BaseAnalysisFormModel({
      id: 'a1',
      type: 'routing'
    }, {
      analyses: analyses,
      configModel: {},
      layerDefinitionModel: {},
      analysisSourceOptionsModel: {}
    });

    spyOn(this.formModel, 'isValid').and.returnValue(true);

    this.userActions = userActions({
      userModel: this.userModel,
      analysisDefinitionsCollection: {},
      analysisDefinitionNodesCollection: {},
      layerDefinitionsCollection: {},
      widgetDefinitionsCollection: {}
    });
    spyOn(this.userActions, 'saveAnalysis');

    this.analysisFormsCollection = new AnalysisFormsCollection(null, {
      userActions: this.userActions,
      configModel: this.configModel,
      layerDefinitionModel: {},
      analysisSourceOptionsModel: {}
    });
    spyOn(this.analysisFormsCollection, 'deleteNode');

    this.analysisFormsCollection.add([
      {id: 'a1'}
    ]);

    this.stackLayoutModel = jasmine.createSpyObj('stackLayoutModel', ['prevStep']);

    this._layerDefinitionModel = {
      canBeGeoreferenced: function () {
      },
      hasAnalyses: function () {}
    };

    spyOn(this._layerDefinitionModel, 'canBeGeoreferenced').and.returnValue(Promise.resolve(true));
    spyOn(this._layerDefinitionModel, 'hasAnalyses');
  });

  it('should not fetch quota if no analysis node', function () {
    spyOn(AnalysisControlsView.prototype, '_fetchQuotaIfNeeded').and.callThrough();

    var view = new AnalysisControlsView({
      analysisFormsCollection: this.analysisFormsCollection,
      userModel: this.userModel,
      userActions: this.userActions,
      formModel: this.formModel,
      stackLayoutModel: this.stackLayoutModel,
      configModel: this.configModel,
      quotaInfo: this.quotaInfo,
      querySchemaModel: this.querySchemaModel,
      layerDefinitionModel: this._layerDefinitionModel
    });

    expect(view._viewModel).toBeDefined();
    expect(AnalysisControlsView.prototype._fetchQuotaIfNeeded).toHaveBeenCalled();
  });

  describe('.initialize', function () {
    beforeEach(function () {
      this.view = new AnalysisControlsView({
        analysisNode: this.analysisNode,
        analysisFormsCollection: this.analysisFormsCollection,
        userModel: this.userModel,
        userActions: this.userActions,
        formModel: this.formModel,
        stackLayoutModel: this.stackLayoutModel,
        configModel: this.configModel,
        quotaInfo: this.quotaInfo,
        querySchemaModel: this.querySchemaModel,
        layerDefinitionModel: this._layerDefinitionModel
      });
    });

    it('should generate a viewModel', function () {
      expect(this.view._viewModel).toBeDefined();
      expect(this.view._viewModel.get('isNewAnalysis')).toBeFalsy();
      expect(this.view._viewModel.get('hasChanges')).toBeFalsy();
    });

    describe('._initViewState', function () {
      it('should initialize viewState properly', function () {
        spyOn(this.view, '_setViewState');

        this.view._initViewState();

        expect(this.view._viewState).toBeDefined();
        expect(this.view._viewState.get('canBeGeoreferenced')).toEqual(false);
        expect(this.view._setViewState).toHaveBeenCalled();
      });
    });

    it('should render when form changes', function () {
      spyOn(this.view, 'render');
      this.formModel.set('type', 'foo');
      expect(this.view.render).toHaveBeenCalled();
    });

    it('should add the track class', function () {
      this.view.render();
      expect(this.view.$('.js-save').hasClass('track-apply')).toBeTruthy();
      expect(this.view.$('.js-save').hasClass('track-routing-analysis')).toBeTruthy();
    });

    it('should not have any leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });
  });

  describe('analysis without quota', function () {
    beforeEach(function () {
      this.formModel.set('type', 'centroid');
      this.view = new AnalysisControlsView({
        analysisNode: this.analysisNode,
        analysisFormsCollection: this.analysisFormsCollection,
        userModel: this.userModel,
        userActions: this.userActions,
        formModel: this.formModel,
        stackLayoutModel: this.stackLayoutModel,
        configModel: this.configModel,
        quotaInfo: this.quotaInfo,
        querySchemaModel: this.querySchemaModel,
        layerDefinitionModel: this._layerDefinitionModel
      });
      this.view.render();
    });

    it('should render a save button disabled', function () {
      expect(this.view.$el.html()).toContain('is-disabled');
    });

    it('should not allow to save', function () {
      this.view.$('.js-save').click();
      expect(this.userActions.saveAnalysis).not.toHaveBeenCalled();
    });

    it('should have apply label since it is not persisted yet', function () {
      expect(this.view.$('.js-save').html()).toContain('apply');
    });

    it('should not render quota info in any case', function () {
      spyOn(this.view, '_createQuotaView').and.callThrough();
      spyOn(this.view, '_createButtonsView').and.callThrough();
      spyOn(AnalysesQuotaOptions, 'requiresQuota').and.returnValue(false);

      spyOn(this.view, '_isAnalysisDone').and.returnValue(false);
      spyOn(this.view, '_hasChanges').and.returnValue(true);
      this.view.render();
      expect(this.view._createQuotaView).not.toHaveBeenCalled();
      expect(this.view._createButtonsView).toHaveBeenCalled();

      this.view._createButtonsView.calls.reset();
      this.view._viewModel.attributes.userFetchModelState = 'error';
      this.view.render();
      expect(this.view._createQuotaView).not.toHaveBeenCalled();
      expect(this.view._createButtonsView.calls.count()).toEqual(1);

      this.view._createButtonsView.calls.reset();
      this.view._viewModel.attributes.userFetchModelState = 'fetching';
      this.view.render();
      expect(this.view._createQuotaView).not.toHaveBeenCalled();
      expect(this.view._createButtonsView.calls.count()).toEqual(1);
    });

    describe('when form is valid', function () {
      beforeEach(function () {
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
        this.view.render();
      });

      it('should change label to apply', function () {
        expect(this.view.$('.js-save').html()).toContain('apply');
      });
    });
  });

  describe('analysis with quota', function () {
    beforeEach(function () {
      this.formModel.set('type', 'trade-area');
      this.view = new AnalysisControlsView({
        analysisNode: this.analysisNode,
        analysisFormsCollection: this.analysisFormsCollection,
        userModel: this.userModel,
        userActions: this.userActions,
        formModel: this.formModel,
        stackLayoutModel: this.stackLayoutModel,
        configModel: this.configModel,
        quotaInfo: this.quotaInfo,
        querySchemaModel: this.querySchemaModel,
        layerDefinitionModel: this._layerDefinitionModel
      });

      this.quotaInfo.fetch();

      mockSQL.mock(AnalysesQuotaEstimation, 'success', {
        rows: [{'QUERY PLAN': 'Seq Scan on foo (cost=0.00..6.97 rows=325 width=108)'}]
      });

      mockSQL.mock(AnalysesQuotaEnough, 'success', {
        rows: [{'cdb_enough_quota': true}]
      });
    });

    it('should not fetch quota when form changes and not valid', function () {
      spyOn(this.view, '_fetchQuotaIfNeeded').and.callThrough();
      spyOn(this.view, '_fetchQuota');
      this.formModel.isValid.and.returnValue(false);
      this.view.render();

      this.formModel.trigger('change');
      expect(this.view._fetchQuotaIfNeeded).toHaveBeenCalled();
      expect(this.view._fetchQuota).not.toHaveBeenCalled();
    });

    it('should render loading when fetching', function () {
      this.view.render();
      this.view._infoboxModel.set('state', 'fetching');

      expect(this.view.$('.Infobox-wrapper').length).toBe(1);
      expect(this.view.$('.Infobox .CDB-LoaderIcon').length).toBe(1); // Loading state
      expect(this.view.$('.Infobox-wrapper').text()).toContain('editor.layers.analysis-form.quota.loading');
    });

    it('should not let user run the analysis if form is not valid', function () {
      this.formModel.isValid.and.returnValue(false);
      this.userActions.saveAnalysis.calls.reset();
      this.view.render();
      this.view.$('.js-mainAction').click();
      expect(this.userActions.saveAnalysis).not.toHaveBeenCalled();
    });

    it('should not let user run the analysis if user doesn\'t have credit assigned', function () {
      spyOn(this.view, '_canSave').and.returnValue(true);

      mockSQL.mock(this.quotaInfo, 'success', {
        rows: [
          {service: 'isolines', monthly_quota: 0, used_quota: 0, soft_limit: true, provider: 'heremaps'}
        ]
      });

      mockSQL.mock(AnalysesQuotaEnough, 'success', {
        rows: [{'cdb_enough_quota': true}]
      });

      this.userModel.set('here_isolines', {
        block_price: 1
      });

      this.userActions.saveAnalysis.calls.reset();
      this.view.render();
      this.formModel.trigger('change');

      expect(this.view.$el.html()).toContain('is-disabled');

      this.view.$('.js-mainAction').click();
      expect(this.userActions.saveAnalysis).not.toHaveBeenCalled();
    });

    it('should not let user run the analysis if not enough quota', function () {
      spyOn(this.view, '_canSave').and.returnValue(true);

      mockSQL.mock(this.quotaInfo, 'success', {
        rows: [
          {service: 'isolines', monthly_quota: 2000, used_quota: 2000, soft_limit: false, provider: 'heremaps'}
        ]
      });

      mockSQL.mock(AnalysesQuotaEnough, 'success', {
        rows: [{'cdb_enough_quota': false}]
      });

      this.userModel.set('here_isolines', {
        block_price: 1
      });

      this.userActions.saveAnalysis.calls.reset();
      this.formModel.trigger('change');

      expect(this.view.$el.html()).toContain('is-disabled');

      this.view.$('.js-mainAction').click();
      expect(this.userActions.saveAnalysis).not.toHaveBeenCalled();
    });

    it('should let user run the analysis if no credits but soft limit', function () {
      spyOn(this.view, '_canSave').and.returnValue(true);

      mockSQL.mock(this.quotaInfo, 'success', {
        rows: [
          {service: 'isolines', monthly_quota: 2000, used_quota: 2000, soft_limit: false, provider: 'heremaps'}
        ]
      });

      mockSQL.mock(AnalysesQuotaEnough, 'success', {
        rows: [{'cdb_enough_quota': true}]
      });

      this.userModel.set('here_isolines', {
        block_price: 1
      });

      this.userActions.saveAnalysis.calls.reset();
      this.formModel.trigger('change');

      expect(this.view.$el.html()).not.toContain('is-disabled');

      this.view.$('.js-mainAction').click();
      expect(this.userActions.saveAnalysis).toHaveBeenCalled();
    });

    it('should change label to confirm', function () {
      spyOn(this.view, '_canSave').and.returnValue(true);
      mockSQL.mock(AnalysesQuotaEnough, 'success', {
        rows: [{'cdb_enough_quota': true}]
      });

      mockSQL.mock(this.quotaInfo, 'success', {
        rows: [
          {service: 'isolines', monthly_quota: 2000, used_quota: 1900, soft_limit: false, provider: 'heremaps'}
        ]
      });

      this.formModel.trigger('change');

      expect(this.view.$('.js-mainAction').html()).toContain('confirm');
    });

    it('should save changes', function () {
      spyOn(this.view, '_canSave').and.returnValue(true);
      this.analysisNode.set('status', 'ready');

      mockSQL.mock(this.quotaInfo, 'success', {
        rows: [
          {service: 'isolines', monthly_quota: 2000, used_quota: 1900, soft_limit: false, provider: 'heremaps'}
        ]
      });

      this.userModel.set('here_isolines', {
        block_price: 1
      });

      this.view.render();
      this.view.$('.js-save').click();

      expect(this.userActions.saveAnalysis).toHaveBeenCalledWith(this.formModel);
    });

    it('should change analysis node\'s state to launched when saving', function () {
      spyOn(this.view, '_canSave').and.returnValue(true);
      this.analysisNode.set('status', 'ready');

      var nodeChange = jasmine.createSpy('nodeChange');
      this.analysisNode.on('change:status', nodeChange);

      mockSQL.mock(this.quotaInfo, 'success', {
        rows: [
          {service: 'isolines', monthly_quota: 2000, used_quota: 1900, soft_limit: false, provider: 'heremaps'}
        ]
      });

      this.view.render();
      this.view.$('.js-save').click();

      // silent when putting launched
      expect(nodeChange.calls.count()).toBe(0);
      expect(this.analysisNode.get('status')).toBe('launched');
      expect(this.userActions.saveAnalysis).toHaveBeenCalledWith(this.formModel);
    });

    it('render a save button disabled after saved an analysis', function () {
      this.view._viewModel.set('hasChanges', false);
      this.view.render();

      this.analysisNode.set('status', 'ready');
      expect(this.view.$el.html()).toContain('is-disabled');
    });

    describe('dataservices api not existing', function () {
      beforeEach(function () {
        this.quotaInfo._state = 'error';
      });

      it('should avoid fetching quota', function () {
        spyOn(this.view, '_fetchQuota');
        expect(this.view._fetchQuota).not.toHaveBeenCalled();
      });

      it('should show an infowindow error if quota view should be shown for edited analysis', function () {
        spyOn(this.view, '_canSave').and.returnValue(true);
        this.view.render();

        expect(this.view._infoboxModel.get('state')).toBe('error');
        expect(this.view.$el.html()).toContain('editor.layers.analysis-form.quota.quota-fetch-error');
      });
    });
  });

  describe('change analysis type', function () {
    beforeEach(function () {
      this.formModel.set('type', 'georeference-ip-address');
      this.view = new AnalysisControlsView({
        analysisNode: this.analysisNode,
        analysisFormsCollection: this.analysisFormsCollection,
        userModel: this.userModel,
        userActions: this.userActions,
        formModel: this.formModel,
        stackLayoutModel: this.stackLayoutModel,
        configModel: this.configModel,
        quotaInfo: this.quotaInfo,
        querySchemaModel: this.querySchemaModel,
        layerDefinitionModel: this._layerDefinitionModel
      });

      this.quotaInfo.fetch();

      mockSQL.mock(AnalysesQuotaEstimation, 'success', {
        rows: [{'QUERY PLAN': 'Seq Scan on foo (cost=0.00..6.97 rows=325 width=108)'}]
      });

      mockSQL.mock(AnalysesQuotaEnough, 'success', {
        rows: [{'cdb_enough_quota': true}]
      });
    });

    it('should render properly if type changes', function () {
      spyOn(this.view, '_canSave').and.returnValue(true);
      this.view.render();

      expect(this.view.$el.html()).not.toContain('is-disabled');
      expect(this.view.$('.Infobox-wrapper').length).toBe(0);

      this.formModel.set({type: 'georeference-street-address'});

      expect(this.view.$('.Infobox-wrapper').length).toBe(1);
    });
  });

  describe('when can delete', function () {
    beforeEach(function () {
      this.view = new AnalysisControlsView({
        analysisNode: this.analysisNode,
        analysisFormsCollection: this.analysisFormsCollection,
        userModel: this.userModel,
        userActions: this.userActions,
        formModel: this.formModel,
        stackLayoutModel: this.stackLayoutModel,
        configModel: this.configModel,
        quotaInfo: this.quotaInfo,
        querySchemaModel: this.querySchemaModel,
        layerDefinitionModel: this._layerDefinitionModel
      });
      this.view.render();
    });

    it('should render deletion if can delete', function () {
      expect(this.view.$el.html()).toContain('js-delete');
    });

    describe('when click delete-analysis', function () {
      beforeEach(function () {
        this.view.$('.js-delete').click();
      });

      it('should delete selectednode', function () {
        expect(this.analysisFormsCollection.deleteNode).toHaveBeenCalledWith('a1');
      });
    });
  });

  describe('delete button', function () {
    beforeEach(function () {
      this.view = new AnalysisControlsView({
        analysisFormsCollection: this.analysisFormsCollection,
        userModel: this.userModel,
        userActions: this.userActions,
        formModel: this.formModel,
        stackLayoutModel: this.stackLayoutModel,
        configModel: this.configModel,
        quotaInfo: this.quotaInfo,
        querySchemaModel: this.querySchemaModel,
        layerDefinitionModel: this._layerDefinitionModel
      });

      spyOn(this.view, '_isAnalysisDone').and.returnValue(true);
      spyOn(this.view, '_hasChanges').and.returnValue(false);
    });

    describe('should be disabled', function () {
      it('if layer needs georeferencing', function (done) {
        var self = this;
        this._layerDefinitionModel.canBeGeoreferenced.and.returnValue(Promise.resolve(true));
        this._layerDefinitionModel.hasAnalyses.and.returnValue(false);

        this.view.render();

        setTimeout(function () {
          expect(self.view.$('.js-delete').hasClass('is-disabled')).toBe(true);
          done();
        }, 0);
      });
    });

    describe('should be enabled', function () {
      beforeEach(function () {
        this._layerDefinitionModel.hasAnalyses.and.returnValue(true);
      });

      it('if layer needs georeferencing but there are analyses already', function (done) {
        var self = this;
        this._layerDefinitionModel.canBeGeoreferenced.and.returnValue(Promise.resolve(true));
        this.view.render();

        setTimeout(function () {
          expect(self.view.$('.js-delete').hasClass('is-disabled')).toBe(false);
          done();
        }, 0);
      });

      it('if layer does not need georeferencing', function (done) {
        var self = this;
        this._layerDefinitionModel.canBeGeoreferenced.and.returnValue(Promise.resolve(false));

        this.view.render();

        setTimeout(function () {
          expect(self.view.$('.js-delete').hasClass('is-disabled')).toBe(false);
          done();
        }, 0);
      });
    });
  });
});

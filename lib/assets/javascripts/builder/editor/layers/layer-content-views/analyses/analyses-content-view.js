var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var ScrollView = require('builder/components/scroll/scroll-view');
var ViewFactory = require('builder/components/view-factory');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');
var IconView = require('builder/components/icon/icon-view');
var analysisPlaceholderTemplate = require('builder/editor/layers/layer-content-views/analyses/analyses-placeholder.tpl');
var analysisSQLErrorTemplate = require('builder/editor/layers/layer-content-views/analyses/analyses-sql-error.tpl');
var AnalysisFormView = require('builder/editor/layers/layer-content-views/analyses/analysis-form-view');
var AnalysesWorkflowView = require('builder/editor/layers/layer-content-views/analyses/analyses-workflow-view');
var AnalysisControlsView = require('builder/editor/layers/layer-content-views/analyses/analysis-controls-view');
var actionErrorTemplate = require('builder/editor/layers/sql-error-action.tpl');
var AnalysesQuotaInfo = require('./analyses-quota/analyses-quota-info');
var AnalysesService = require('builder/editor/layers/layer-content-views/analyses/analyses-service');
var Router = require('builder/routes/router');
var utils = require('builder/helpers/utils');

var REQUIRED_OPTS = [
  'userActions',
  'analysisFormsCollection',
  'layerDefinitionModel',
  'analysisDefinitionNodesCollection',
  'configModel',
  'userModel',
  'stackLayoutModel',
  'overlayModel',
  'layerContentModel',
  'deleteAnalysisModel'
];

/**
 * AnalysesContentView:
 *   ├── ScrollView
 *   |   └── ListView:
 *   |       ├── WorkflowView
 *   |       └── FormView
 *   └── ControlsView
 */

module.exports = CoreView.extend({
  module: 'editor:layers:layer-content-views:analyses:analyses-content-view',

  options: {
    selectedNodeId: false // or an id, e.g. 'a1'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._selectedNodeId = this.options.selectedNodeId;
    this._querySchemaModel = this._layerDefinitionModel.getAnalysisDefinitionNodeModel().querySchemaModel;
    this._quotaInfo = AnalysesQuotaInfo.get(opts.configModel);

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    if (this._isErrored()) {
      this._renderError();
    } else {
      this._initViews();
    }

    this._toggleOverlay();
    return this;
  },

  _isErrored: function () {
    return this._layerContentModel.isErrored();
  },

  _renderError: function () {
    this.$el.html(
      analysisSQLErrorTemplate({
        body: _t('editor.error-query.body', {
          action: actionErrorTemplate({
            label: _t('editor.error-query.label')
          })
        })
      })
    );
  },

  _initViews: function () {
    if (this._analysisFormsCollection.isEmpty()) {
      this.$el.html(analysisPlaceholderTemplate());
      this._renderTooltip();
    } else {
      var formModel = this._getFormModel();

      this._renderScrollableListView(formModel);
      this._renderControlsView(formModel);
    }

    var plusIcon = new IconView({
      placeholder: this.$el.find('.js-plus-icon'),
      icon: 'plus'
    });
    plusIcon.render();
    this.addView(plusIcon);
  },

  _toggleOverlay: function () {
    var isDisabled = this._overlayModel.get('visible');
    this.$el.toggleClass('is-disabled', isDisabled);
  },

  _renderTooltip: function () {
    var tooltip = new TipsyTooltipView({
      el: this.$('.js-add-analysis'),
      gravity: 'w',
      title: function () {
        return utils.replaceLastSpaceWithNbsp(_t('editor.layers.analysis-form.add-analysis.tooltip'));
      },
      offset: 8
    });
    this.addView(tooltip);
  },

  _initBinds: function () {
    this.listenTo(this._layerDefinitionModel, 'change:source', this._onLayerDefSourceChanged);
    this.listenTo(this._analysisFormsCollection, 'change:persisted', this._onAnalysisFormsCollectionSync);
    this.listenTo(this._analysisFormsCollection, 'destroyedModels remove', this._setDefaultSelectedNodeId);
    this.listenTo(this._overlayModel, 'change:visible', this._toggleOverlay);
  },

  _renderScrollableListView: function (formModel) {
    var self = this;

    var view = new ScrollView({
      createContentView: function () {
        return ViewFactory.createListView([
          function () {
            return new AnalysesWorkflowView({
              analysisDefinitionNodesCollection: self._analysisDefinitionNodesCollection,
              layerDefinitionModel: self._layerDefinitionModel,
              analysisFormsCollection: self._analysisFormsCollection,
              selectedNodeId: self._selectedNodeId
            });
          },
          function () {
            return new AnalysisFormView({
              formModel: formModel,
              configModel: self._configModel,
              userModel: self._userModel
            });
          }
        ]);
      }
    });
    this.$el.append(view.render().el);
    this.addView(view);
  },

  _renderControlsView: function (formModel) {
    var analysisNode = this._analysisDefinitionNodesCollection.get(formModel.id);

    var view = new AnalysisControlsView({
      layerDefinitionModel: this._layerDefinitionModel,
      analysisFormsCollection: this._analysisFormsCollection,
      analysisNode: analysisNode,
      configModel: this._configModel,
      formModel: formModel,
      quotaInfo: this._quotaInfo,
      querySchemaModel: this._getQuerySchemaModelForEstimation(),
      stackLayoutModel: this._stackLayoutModel,
      userActions: this._userActions,
      userModel: this._userModel,
      deleteAnalysisModel: this._deleteAnalysisModel
    });
    this.addView(view);
    this.$el.append(view.render().el);
  },

  _getFormModel: function () {
    return this._analysisFormsCollection.get(this._selectedNodeId) || this._analysisFormsCollection.first();
  },

  _getQuerySchemaModelForEstimation: function () {
    var node = this._analysisDefinitionNodesCollection.get(this._selectedNodeId);
    var index;

    if (!node) {
      node = this._layerDefinitionModel.getAnalysisDefinitionNodeModel();
    } else {
      index = this._analysisDefinitionNodesCollection.indexOf(node);
      node = this._analysisDefinitionNodesCollection.at(index - 1);
    }

    return node.querySchemaModel;
  },

  _onLayerDefSourceChanged: function () {
    this._analysisFormsCollection.removeUselessModels();
  },

  _onAnalysisFormsCollectionSync: function (model) {
    AnalysesService.clearNotAppliedAnalysis(model.get('id'));
  },

  _setDefaultSelectedNodeId: function () {
    var selectedNodeId = this._analysisFormsCollection.pluck('id')[0];

    AnalysesService.clearNotAppliedAnalysis(selectedNodeId);
    Router.goToAnalysisNode(this._layerDefinitionModel.get('id'), selectedNodeId);
  }
});

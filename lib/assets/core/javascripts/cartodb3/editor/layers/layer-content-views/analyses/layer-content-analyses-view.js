var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var ScrollView = require('../../../../components/scroll/scroll-view');
var ViewFactory = require('../../../../components/view-factory');
var analysisPlaceholderTemplate = require('../analyses/analyses-placeholder.tpl');
var analysisSQLErrorTemplate = require('../analyses/analyses-sql-error.tpl');
var AnalysisFormView = require('../analyses/analysis-form-view');
var AnalysesWorkflowView = require('../analyses/analyses-workflow-view');
var AnalysisControlsView = require('../analyses/analysis-controls-view');
var QuerySanity = require('../../query-sanity-check');
var actionErrorTemplate = require('../../sql-error-action.tpl');
var OverlayView = require('../../../components/overlay/overlay-view');
var AnalysesQuotaInfo = require('./analyses-quota/analyses-quota-info');

var STATES = {
  ready: 'ready',
  loading: 'loading',
  fetched: 'fetched',
  error: 'error'
};

/**
 * LayerContentAnalysesView:
 *   ├── ScrollView
 *   |   └── ListView:
 *   |       ├── WorkflowView
 *   |       └── FormTypeView
 *   └── ControlsView
 */
module.exports = CoreView.extend({

  options: {
    selectedNodeId: false // or an id, e.g. 'a1'
  },

  initialize: function (opts) {
    if (!opts.userActions) throw new Error('userActions is required');
    if (!opts.analysisFormsCollection) throw new Error('analysisFormsCollection is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');
    if (!opts.overlayModel) throw new Error('overlayModel is required');

    this._userActions = opts.userActions;
    this._stackLayoutModel = opts.stackLayoutModel;
    this._userModel = opts.userModel;
    this._analysisFormsCollection = opts.analysisFormsCollection;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._analysisDefinitionNodesCollection = opts.analysisDefinitionNodesCollection;
    this._configModel = opts.configModel;
    this._overlayModel = opts.overlayModel;

    this._viewModel = new Backbone.Model({selectedNodeId: this.options.selectedNodeId});
    this._querySchemaModel = this._layerDefinitionModel.getAnalysisDefinitionNodeModel().querySchemaModel;

    this._quotaInfo = AnalysesQuotaInfo.get(opts.configModel);

    this.modelView = new Backbone.Model({
      state: this._getInitialState()
    });

    this._initBinds();

    QuerySanity.track(this, this.render.bind(this));
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    if (this._hasError()) {
      this.$el.html(
        analysisSQLErrorTemplate({
          body: _t('editor.error-query.body', {
            action: actionErrorTemplate({
              label: _t('editor.error-query.label')
            })
          })
        })
      );
    } else {
      if (this._analysisFormsCollection.isEmpty()) {
        this.$el.html(analysisPlaceholderTemplate());
      } else {
        var formModel = this._formModel();
        this._renderScrollableListView(formModel);
        this._renderControlsView(formModel);
      }
    }
    this._renderOverlay();
    return this;
  },

  clean: function () {
    CoreView.prototype.clean.apply(this);
    this._selectedNodeId(null, {silent: true});
  },

  _renderOverlay: function () {
    var view = new OverlayView({
      overlayModel: this._overlayModel
    });
    this.addView(view);
    this.$el.append(view.render().el);
  },

  _getInitialState: function () {
    return STATES.loading;
  },

  _hasError: function () {
    return this.modelView.get('state') === STATES.error;
  },

  _initBinds: function () {
    // Init listeners
    this._viewModel.on('change:selectedNodeId', this.render, this);
    this.add_related_model(this._viewModel);

    this._layerDefinitionModel.on('change:source', this._onLayerDefSourceChanged, this);
    this.add_related_model(this._layerDefinitionModel);

    this._analysisFormsCollection.on('add', this._onFormModelAdded, this);
    this._analysisFormsCollection.on('remove', this._onFormModelRemoved, this);
    this.add_related_model(this._analysisFormsCollection);
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
              viewModel: self._viewModel
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
      configModel: this._configModel,
      analysisNode: analysisNode,
      userActions: this._userActions,
      userModel: this._userModel,
      stackLayoutModel: this._stackLayoutModel,
      formModel: formModel,
      quotaInfo: this._quotaInfo,
      querySchemaModel: this._getQuerySchemaModelForEstimation()
    });
    this.addView(view);
    this.$el.append(view.render().el);
  },

  _formModel: function () {
    return this._analysisFormsCollection.get(this._selectedNodeId()) || this._analysisFormsCollection.first();
  },

  _getQuerySchemaModelForEstimation: function () {
    var node = this._analysisDefinitionNodesCollection.get(this._selectedNodeId());
    var index;

    if (!node) {
      node = this._layerDefinitionModel.getAnalysisDefinitionNodeModel();
    } else {
      index = this._analysisDefinitionNodesCollection.indexOf(node);
      node = this._analysisDefinitionNodesCollection.at(index - 1);
    }

    return node.querySchemaModel;
  },

  _selectedNodeId: function (id, options) {
    if (!this._viewModel) {
      return;
    }

    if (id === undefined) {
      return this._viewModel.get('selectedNodeId');
    } else {
      this._viewModel.set('selectedNodeId', id, options);
    }
  },

  _onLayerDefSourceChanged: function () {
    // When reset, the parent view is rendered again, creating a new instance of this one
    // calling here this._renderWithDefaultNodeSelected(); will cause a race condition
    // ending up in two instance of this being rendered
    this._analysisFormsCollection.resetByLayerDefinition();
  },

  _onFormModelAdded: function () {
    this._renderWithDefaultNodeSelected();
  },

  _onFormModelRemoved: function () {
    this._renderWithDefaultNodeSelected();
  },

  _renderWithDefaultNodeSelected: function () {
    var selectedNodeId = this._analysisFormsCollection.pluck('id')[0];
    this._selectedNodeId(selectedNodeId, {silent: true});
    this.render();
  }

});

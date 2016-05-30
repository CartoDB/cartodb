var cdb = require('cartodb.js');
var analysisPlaceholderTemplate = require('./analyses/analyses-placeholder.tpl');
var AnalysisFormView = require('./analyses/analysis-form-view');
var AnalysesWorkflowView = require('./analyses/analyses-workflow-view');
var AddAnalysisView = require('../../../components/modals/add-analysis/add-analysis-view');

module.exports = cdb.core.View.extend({

  events: {
    'click .js-new-analysis': '_openAddAnalysis'
  },

  options: {
    selectedNodeId: false // or an id, e.g. 'a1'
  },

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.analysisFormsCollection) throw new Error('analysisFormsCollection is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.analysis) throw new Error('analysis is required');

    this.analysis = opts.analysis;
    this.layerDefinitionModel = opts.layerDefinitionModel;
    this.modals = opts.modals;
    this.analysisFormsCollection = opts.analysisFormsCollection;

    this.viewModel = new cdb.core.Model({selectedNodeId: opts.selectedNodeId});

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    if (this.analysisFormsCollection.isEmpty()) {
      this.$el.append(analysisPlaceholderTemplate());
    } else {
      this._initViews();
    }

    return this;
  },

  clean: function () {
    cdb.core.View.prototype.clean.apply(this, arguments);
    this.viewModel.unset('selectedNodeId');
    this.viewModel = null;
  },

  _initBinds: function () {
    this.layerDefinitionModel.bind('change:source', this._onLayerDefSourceChanged, this);
    this.add_related_model(this.layerDefinitionModel);

    this.analysisFormsCollection.on('add', this._onFormModelAdded, this);
    this.analysisFormsCollection.on('remove', this._onFormModelRemoved, this);
    this.add_related_model(this.analysisFormsCollection);
  },

  _initViews: function () {
    var analysesWorkflow = new AnalysesWorkflowView({
      analysis: this.analysis,
      analysisFormsCollection: this.analysisFormsCollection,
      openAddAnalysis: this._openAddAnalysis.bind(this),
      viewModel: this.viewModel
    });
    this.$el.append(analysesWorkflow.render().el);
    this.addView(analysesWorkflow);

    var analysisForm = new AnalysisFormView({
      analysisFormsCollection: this.analysisFormsCollection,
      analysisDefinitionNodesCollection: this.layerDefinitionModel.getAnalysisDefinitionNodeModel().collection,
      viewModel: this.viewModel
    });
    this.$el.append(analysisForm.render().el);
    this.addView(analysisForm);
  },

  _openAddAnalysis: function () {
    var self = this;

    this.modals.create(function (modalModel) {
      modalModel.once('destroy', self._onAddAnalysisModalClosed, self);
      return new AddAnalysisView({
        modalModel: modalModel,
        analysisDefinitionNodeModel: self.layerDefinitionModel.getAnalysisDefinitionNodeModel()
      });
    });
  },

  _onLayerDefSourceChanged: function () {
    this.analysisFormsCollection.resetByLayerDefinition();
    this._renderWithDefaultNodeSelected();
  },

  _onFormModelAdded: function () {
    this._renderWithDefaultNodeSelected();
  },

  _onFormModelRemoved: function () {
    this._renderWithDefaultNodeSelected();
  },

  _renderWithDefaultNodeSelected: function () {
    var selectedNodeId = this.analysisFormsCollection.pluck('id')[0];
    this.viewModel.set('selectedNodeId', selectedNodeId, {silent: true});
    this.render();
  },

  _onAddAnalysisModalClosed: function (analysisFormAttrs) {
    if (analysisFormAttrs) {
      this.analysisFormsCollection.addHead(analysisFormAttrs);
    }
  }
});

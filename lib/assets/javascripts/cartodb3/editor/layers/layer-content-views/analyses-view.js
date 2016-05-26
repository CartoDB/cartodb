var cdb = require('cartodb.js');
var analysisPlaceholderTemplate = require('./analyses/analyses-placeholder.tpl');
var AnalysisFormView = require('./analyses/analysis-form-view');
var AnalysesWorkflowView = require('./analyses/analyses-workflow-view');
var AddAnalysisView = require('../../../components/modals/add-analysis/add-analysis-view');

module.exports = cdb.core.View.extend({

  events: {
    'click .js-new-analysis': '_openAddAnalysis'
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

    this.viewModel = new cdb.core.Model({
      selectedNodeId: opts.selectedNodeId || this.layerDefinitionModel.get('source')
    });

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
    this.layerDefinitionModel.bind('change:source', function () {
      this.viewModel.set('selectedNodeId', this.layerDefinitionModel.get('source'), {silent: true});
      this.analysisFormsCollection.resetByLayerDefinition();
      this.render();
    }, this);
    this.add_related_model(this.layerDefinitionModel);
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
      return new AddAnalysisView({
        modalModel: modalModel,
        layerDefinitionModel: self.layerDefinitionModel
      });
    });
  }
});

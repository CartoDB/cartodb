var cdb = require('cartodb-deep-insights.js');
var placeholderTemplate = require('./analyses-empty.tpl');
var AnalysisFormView = require('./analysis-form-view');
var AnalysesWorkflowView = require('./analyses-workflow-view');

module.exports = cdb.core.View.extend({

  events: {
    'click .js-addAnalysis': '_onNewAnalysisClick'
  },

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('Layer definition is required');
    if (!opts.analysisDefinitionsCollection) throw new Error('analysisDefinitionsCollection is required');
    this.layerDefinitionModel = opts.layerDefinitionModel;
    this.analysisDefinitionsCollection = opts.analysisDefinitionsCollection;
    this.analysisDefinitionNodesCollection = opts.analysisDefinitionsCollection.analysisDefinitionNodesCollection;
    this.viewModel = new cdb.core.Model({
      selectedNodeId: opts.selectedNodeId || this.layerDefinitionModel.get('source')
    });
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    if (!this._isThereAnalyses()) {
      this.$el.append(placeholderTemplate());
    } else {
      this._initViews();
    }
    return this;
  },

  _initBinds: function () {
    this.analysisDefinitionsCollection.bind('add', function (mdl) {
      this.viewModel.set('selectedNodeId', mdl.get('node_id'));
      this.render();
    }, this);
    this.analysisDefinitionsCollection.bind('remove', function () {
      this.viewModel.set('selectedNodeId', this.layerDefinitionModel.get('source'));
      this.render();
    }, this);
    this.add_related_model(this.analysisDefinitionsCollection);
  },

  _initViews: function () {
    // Workflow
    var analysesWorkflow = new AnalysesWorkflowView({
      layerDefinitionModel: this.layerDefinitionModel,
      analysisDefinitionsCollection: this.analysisDefinitionsCollection,
      viewModel: this.viewModel
    });
    this.$el.append(analysesWorkflow.render().el);
    this.addView(analysesWorkflow);

    // Analyses form
    var analysisForm = new AnalysisFormView({
      layerDefinitionModel: this.layerDefinitionModel,
      analysisDefinitionsCollection: this.analysisDefinitionsCollection,
      viewModel: this.viewModel
    });
    this.$el.append(analysisForm.render().el);
    this.addView(analysisForm);
  },

  _isThereAnalyses: function () {
    var sourceModel = this.analysisDefinitionNodesCollection.get(this.layerDefinitionModel.get('source'));
    return !sourceModel || sourceModel.get('type') !== 'source';
  },

  _onNewAnalysisClick: function () {
    console.log("TODO: What do we want? We want analysis! When? Now!");
  }
});

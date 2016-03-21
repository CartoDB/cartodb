var cdb = require('cartodb-deep-insights.js');
var placeholderTemplate = require('./analyses-empty.tpl');
var template = require('./analyses.tpl');
var AnalysisFormView = require('./analysis-form-view');
var AnalysesWorkflowView = require('./analyses-workflow-view');

/*
  - There should be a model "managing" the current selected analysis.
  - Listening if any analysis is added/removed
  - If analysis is added, selectedAnalysis should change
*/

module.exports = cdb.core.View.extend({

  events: {
    'click .js-newAnalysis': '_onNewAnalysisClick'
  },

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('Layer definition is required');
    if (!opts.analysisDefinitonsCollection) throw new Error('analysisDefinitonsCollection is required');
    this.layerDefinitionModel = opts.layerDefinitionModel;
    this.analysisDefinitonsCollection = opts.analysisDefinitonsCollection;
    this.analysisDefinitionNodesCollection = opts.analysisDefinitonsCollection.analysisDefinitionNodesCollection;
    this.viewModel = new cdb.core.Model({
      selectedNodeId: opts.selectedNodeId || this._getFirstNodeId()
    });
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    if (!this._isThereAnalyses()) {
      this.$el.append(placeholderTemplate());
    } else {
      this.$el.append(template());
      this._initViews();
    }
    return this;
  },

  _initBinds: function () {
    this.analysisDefinitonsCollection.bind('add remove', function () {
      console.log('If new analysis, select it. If it was removed, unselect it');
      this.render();
    }, this);
    this.add_related_model(this.analysisDefinitonsCollection);
  },

  _initViews: function () {
    // Workflow
    var analysesWorkflow = new AnalysesWorkflowView({
      layerDefinitionModel: this.layerDefinitionModel,
      analysisDefinitonsCollection: this.analysisDefinitonsCollection,
      viewModel: this.viewModel
    });
    this.$el.append(analysesWorkflow.render().el);
    this.addView(analysesWorkflow);

    // Analyses form
    var analysisForm = new AnalysisFormView({
      layerDefinitionModel: this.layerDefinitionModel,
      analysisDefinitonsCollection: this.analysisDefinitonsCollection,
      viewModel: this.viewModel
    });
    this.$el.append(analysisForm.render().el);
    this.addView(analysisForm);
  },

  // TODO: this function is not a good choice
  _getFirstNodeId: function () {
    var sourceId = this.layerDefinitionModel.get('source');
    var nodeModel = this.analysisDefinitonsCollection._findAnalysisDefinitionModel(sourceId);
    return nodeModel && nodeModel.get('node_id');
  },

  _isThereAnalyses: function () {
    var sourceModel = this.analysisDefinitionNodesCollection.get(this.layerDefinitionModel.get('source'));
    return sourceModel.get('type') !== 'source';
  },

  _onNewAnalysisClick: function () {
    console.log("What do we want? We want analysis! When? Now!");
  }
});

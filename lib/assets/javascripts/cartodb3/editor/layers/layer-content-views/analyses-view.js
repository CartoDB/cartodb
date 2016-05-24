var cdb = require('cartodb.js');
var analysisPlaceholderTemplate = require('./analyses-placeholder.tpl');
var AnalysisFormView = require('./analysis-form-view');
var AnalysesWorkflowView = require('./analyses-workflow-view');
var AddAnalysisView = require('../../../components/modals/add-analysis/add-analysis-view');

module.exports = cdb.core.View.extend({

  events: {
    'click .js-new-analysis': '_openAddAnalysis'
  },

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.modals) throw new Error('modals is required');
    if (!opts.analysis) throw new Error('analysis is required');

    this.analysis = opts.analysis;
    this.layerDefinitionModel = opts.layerDefinitionModel;
    this.modals = opts.modals;

    this.viewModel = new cdb.core.Model({
      selectedNode: opts.selectedNode || this.layerDefinitionModel.getAnalysisDefinitionNodeModel()
    });

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    if (this._hasAnalyses()) {
      this._initViews();
    } else {
      this.$el.append(analysisPlaceholderTemplate());
    }
    return this;
  },

  clean: function () {
    cdb.core.View.prototype.clean.apply(this, arguments);
    this.viewModel.unset('selectedNode');
    this.viewModel = null;
  },

  _initBinds: function () {
    this.layerDefinitionModel.bind('change:source', function () {
      this.viewModel.set('selectedNode', this.layerDefinitionModel.getAnalysisDefinitionNodeModel(), {silent: true});
      this.render();
    }, this);
    this.add_related_model(this.layerDefinitionModel);
  },

  _initViews: function () {
    var analysesWorkflow = new AnalysesWorkflowView({
      analysis: this.analysis,
      layerDefinitionModel: this.layerDefinitionModel,
      openAddAnalysis: this._openAddAnalysis.bind(this),
      viewModel: this.viewModel
    });
    this.$el.append(analysesWorkflow.render().el);
    this.addView(analysesWorkflow);

    var analysisForm = new AnalysisFormView({
      layerDefinitionModel: this.layerDefinitionModel,
      viewModel: this.viewModel
    });
    this.$el.append(analysisForm.render().el);
    this.addView(analysisForm);
  },

  _hasAnalyses: function () {
    var m = this.layerDefinitionModel.getAnalysisDefinitionNodeModel();
    return m && m.get('type') !== 'source';
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

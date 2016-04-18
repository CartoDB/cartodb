var cdb = require('cartodb-deep-insights.js');
var AnalysisTypeMap = require('./analyses-form-types/analysis-form-type-options');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('Layer definition is required');
    if (!opts.analysisDefinitionsCollection) throw new Error('analysisDefinitionsCollection is required');
    if (!opts.viewModel) throw new Error('viewModel is required');

    this.layerDefinitionModel = opts.layerDefinitionModel;
    this.analysisDefinitionsCollection = opts.analysisDefinitionsCollection;
    this.analysisDefinitionNodesCollection = this.analysisDefinitionsCollection.analysisDefinitionNodesCollection;
    this.viewModel = opts.viewModel;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    var currentNodeId = this.viewModel.get('selectedNodeId');
    var analysisDefinitionNodeModel = this.analysisDefinitionNodesCollection.get(currentNodeId);
    var type = analysisDefinitionNodeModel.get('type');
    var FormViewKlass = AnalysisTypeMap.getFormView(type);
    var formView = new FormViewKlass({
      analysisDefinitionNodeModel: analysisDefinitionNodeModel,
      layerDefinitionModel: this.layerDefinitionModel
    });

    this.addView(formView);
    this.$el.append(formView.render().el);

    return this;
  },

  _initBinds: function () {
    this.viewModel.bind('change:selectedNodeId', this.render, this);
    this.add_related_model(this.viewModel);
  }
});

var cdb = require('cartodb-deep-insights.js');
var AnalysisFormTypeMap = {
  // 'buffer': require('./analysis-form-types/analysis-buffer-form-view'),
  // 'moran': require('./analysis-form-types/analysis-moran-form-view'),
  // 'point-in-polygon': require('./analysis-form-types/analysis-pointInPolygon-form-view'),
  'trade-area': require('./analyses-form-types/analysis-tradeArea-form-view')
};

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('Layer definition is required');
    if (!opts.analysisDefinitonsCollection) throw new Error('analysisDefinitonsCollection is required');
    if (!opts.viewModel) throw new Error('viewModel is required');
    this.layerDefinitionModel = opts.layerDefinitionModel;
    this.analysisDefinitonsCollection = opts.analysisDefinitonsCollection;
    this.analysisDefinitionNodesCollection = this.analysisDefinitonsCollection.analysisDefinitionNodesCollection;
    this.viewModel = opts.viewModel;
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    var currentNode = this.viewModel.get('selectedNode');
    var analysisModel = this.analysisDefinitionNodesCollection.get(currentNode.get('node_id'));
    var analysisType = analysisModel.get('type');
    var AnalysisFormView = AnalysisFormTypeMap[analysisType];
    if (!AnalysisFormView) {
      console.log(analysisType + ' analysis form view not implemented');
    }
    var formView = new AnalysisFormView({
      analysisModel: analysisModel
    });
    this.addView(formView);
    this.$el.append(formView.render().el);
    return this;
  },

  _initBinds: function () {
    this.viewModel.bind('change:selectedAnalysis', this.render, this);
    this.add_related_model(this.viewModel);
  }
});

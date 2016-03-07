var TYPE_TO_ANALYSIS_DEFINITION_VIEW_MAP = {
  'source': require('./analysis-views/layer-analysis-source-view')
};

var LayerAnalysisViewFactory = function (analysisDefinitionsCollection) {
  this._analysisDefinitionsCollection = analysisDefinitionsCollection;
};

LayerAnalysisViewFactory.prototype.createView = function (id) {
  var m = this._analysisDefinitionsCollection.get(id);
  var View = TYPE_TO_ANALYSIS_DEFINITION_VIEW_MAP[m.get('type')];

  return new View({
    model: m,
    layerAnalysisViewFactory: this
  });
};

module.exports = LayerAnalysisViewFactory;

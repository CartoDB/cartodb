var TYPE_TO_ANALYSIS_DEFINITION_VIEW_MAP = {
  'source': require('./analysis-views/layer-analysis-source-view')
};

var LayerAnalysisViewFactory = function (analysisDefinitionsCollection) {
  this._analysisDefinitionsCollection = analysisDefinitionsCollection;
};

LayerAnalysisViewFactory.prototype.getLayerDefinitionByLetter = function (letter) {
  return this._analysisDefinitionsCollection.find(function (m) {
    return m.id.match(/([a-z]+)/)[0] === letter; // TODO: should we refactor the letter matching?
  });
};

LayerAnalysisViewFactory.prototype.createView = function (id, layerDefinitionModel) {
  var m = this._analysisDefinitionsCollection.get(id);
  var View = TYPE_TO_ANALYSIS_DEFINITION_VIEW_MAP[m.get('type')];

  return new View({
    model: m,
    layerDefinitionModel: layerDefinitionModel,
    layerAnalysisViewFactory: this
  });
};

module.exports = LayerAnalysisViewFactory;

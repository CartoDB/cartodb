var LayerAnalysisDefaultView = require('./analysis-views/layer-analysis-default-view');

var TYPE_TO_ANALYSIS_DEFINITION_VIEW_MAP = {
  'source': require('./analysis-views/layer-analysis-source-view'),
  'trade-area': LayerAnalysisDefaultView
};

/**
 * @param {Object} analysisDefinitioNodenCollection
 */
var LayerAnalysisViewFactory = function (analysisDefinitioNodenCollection) {
  this._analysisDefinitioNodenCollection = analysisDefinitioNodenCollection;
};

/**
 * @param {String} id
 * @param {Object} layerDefinitionModel
 * @return {Object} instance of cdb.core.View
 * @throws {Error} if node model can not be found, or view can not be found for the given mode
 */
LayerAnalysisViewFactory.prototype.createView = function (id, layerDefinitionModel) {
  if (!id) throw new Error('id is required');
  if (!layerDefinitionModel) throw new Error('layerDefinitionModel is required');

  var m = this._analysisDefinitioNodenCollection.get(id);
  if (!m) throw new Error('no analysis-definition-node-model found for given id ' + id);

  var View = TYPE_TO_ANALYSIS_DEFINITION_VIEW_MAP[m.get('type')];
  if (!View) throw new Error('no analysis-node-view found for type ' + m.get('type'));

  return new View({
    model: m,
    layerDefinitionModel: layerDefinitionModel,
    layerAnalysisViewFactory: this
  });
};

module.exports = LayerAnalysisViewFactory;

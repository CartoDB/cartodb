var SOURCES_COUNT_TO_VIEWS_MAP = [
  require('./analysis-views/source-layer-analysis-view'), // no sources, e.g. type 'source'
  require('./analysis-views/default-layer-analysis-view'), // 1 source, the default case, e.g. type 'trade-area'
  require('./analysis-views/composite-layer-analysis-view') // 2 source, consist of two sources, e.g. 'point-in-polygon'
];

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

  var View = SOURCES_COUNT_TO_VIEWS_MAP[m.sourceIds().length];
  if (!View) throw new Error('no analysis-node-view found for node' + m.toJSON());

  return new View({
    model: m,
    layerDefinitionModel: layerDefinitionModel,
    layerAnalysisViewFactory: this
  });
};

module.exports = LayerAnalysisViewFactory;

var DefaultLayerAnalysisView = require('./analysis-views/default-layer-analysis-view');
var SourceLayerAnalysisView = require('./analysis-views/source-layer-analysis-view');
var CompositeLayerAnalysisView = require('./analysis-views/composite-layer-analysis-view');

var LayerAnalysisViewFactory = function (analysisDefinitionNodesCollection, analysis) {
  this._analysisDefinitionNodesCollection = analysisDefinitionNodesCollection;
  this._analysis = analysis;
};

/**
 * @param {Object} nodeDefModel - an analysis-definition-node-model
 * @param {Object} layerDefinitionModel
 * @return {Object} instance of CoreView
 * @throws {Error} if node model can not be found, or view can not be found for the given mode
 */
LayerAnalysisViewFactory.prototype.createView = function (nodeDefModel, layerDefinitionModel) {
  if (!nodeDefModel) throw new Error('nodeDefModel is required');
  if (!layerDefinitionModel) throw new Error('layerDefinitionModel is required');

  var View = layerDefinitionModel.isOwnerOfAnalysisNode(nodeDefModel)
    ? this._findView(nodeDefModel)
    : DefaultLayerAnalysisView;

  return new View({
    model: nodeDefModel,
    analysisNode: this._analysis.findNodeById(nodeDefModel.id),
    layerDefinitionModel: layerDefinitionModel
  });
};

LayerAnalysisViewFactory.prototype._findView = function (nodeDefModel) {
  switch (nodeDefModel.sourceIds().length) {
    case 0: return SourceLayerAnalysisView;
    case 2: return CompositeLayerAnalysisView;
    default: return DefaultLayerAnalysisView;
  }
};

module.exports = LayerAnalysisViewFactory;

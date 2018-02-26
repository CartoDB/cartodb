var RefLayerAnalysisView = require('./analysis-views/ref-layer-analysis-view');
var DefaultLayerAnalysisView = require('./analysis-views/default-layer-analysis-view');
var SourceLayerAnalysisView = require('./analysis-views/source-layer-analysis-view');
var CompositeLayerAnalysisView = require('./analysis-views/composite-layer-analysis-view');

var LayerAnalysisViewFactory = function (analysisDefinitionNodesCollection) {
  this._analysisDefinitionNodesCollection = analysisDefinitionNodesCollection;
};

/**
 * @param {Object} nodeDefModel - an analysis-definition-node-model
 * @param {Object} layerDefinitionModel
 * @param {String} [tagName = 'li']
 * @return {Object} instance of CoreView
 * @throws {Error} if node model can not be found, or view can not be found for the given mode
 */
LayerAnalysisViewFactory.prototype.createView = function (nodeDefModel, layerDefinitionModel) {
  if (!nodeDefModel) throw new Error('nodeDefModel is required');
  if (!layerDefinitionModel) throw new Error('layerDefinitionModel is required');

  var analysisNode = this._analysisDefinitionNodesCollection.get(nodeDefModel.id);
  var sourcesCount = nodeDefModel.sourceIds().length;

  var ownerLayer = layerDefinitionModel.collection.findOwnerOfAnalysisNode(nodeDefModel);
  if (ownerLayer !== layerDefinitionModel) {
    sourcesCount = null; // to force default ref view
  }

  switch (sourcesCount) {
    case 2:
      return new CompositeLayerAnalysisView({
        model: nodeDefModel,
        analysisDefinitionNodesCollection: this._analysisDefinitionNodesCollection,
        layerDefinitionModel: layerDefinitionModel
      });
    case 0:
      return new SourceLayerAnalysisView({
        model: nodeDefModel,
        analysisNode: analysisNode,
        layerDefinitionModel: layerDefinitionModel
      });
    case 1:
      return new DefaultLayerAnalysisView({
        model: nodeDefModel,
        analysisNode: analysisNode,
        layerDefinitionModel: layerDefinitionModel
      });
    default:
      return new RefLayerAnalysisView({
        model: nodeDefModel,
        analysisNode: analysisNode,
        layerDefinitionModel: ownerLayer || layerDefinitionModel // use same layer model as fallback
      });
  }
};

module.exports = LayerAnalysisViewFactory;

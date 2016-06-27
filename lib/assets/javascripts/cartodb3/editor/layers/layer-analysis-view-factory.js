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
 * @param {String} [tagName = 'li']
 * @return {Object} instance of CoreView
 * @throws {Error} if node model can not be found, or view can not be found for the given mode
 */
LayerAnalysisViewFactory.prototype.createView = function (nodeDefModel, layerDefinitionModel) {
  if (!nodeDefModel) throw new Error('nodeDefModel is required');
  if (!layerDefinitionModel) throw new Error('layerDefinitionModel is required');

  var analysisNode = this._analysis.findNodeById(nodeDefModel.id);

  var sourcesCount = layerDefinitionModel.isOwnerOfAnalysisNode(nodeDefModel)
    ? nodeDefModel.sourceIds().length
    : 1; // force default/case 1 view

  switch (sourcesCount) {
    case 2:
      return new CompositeLayerAnalysisView({
        model: nodeDefModel,
        analysis: this._analysis,
        layerDefinitionModel: layerDefinitionModel
      });
    case 0:
      return new SourceLayerAnalysisView({
        model: nodeDefModel
      });
    case 1:
    default:
      return new DefaultLayerAnalysisView({
        model: nodeDefModel,
        analysisNode: analysisNode,
        layerDefinitionModel: layerDefinitionModel
      });
  }
};

module.exports = LayerAnalysisViewFactory;

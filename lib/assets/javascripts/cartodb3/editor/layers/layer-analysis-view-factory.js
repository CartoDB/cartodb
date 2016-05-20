var RefLayerAnalysisView = require('./analysis-views/ref-layer-analysis-view');

var SOURCES_COUNT_TO_VIEWS_MAP = [
  require('./analysis-views/source-layer-analysis-view'), // no sources, e.g. type 'source'
  require('./analysis-views/default-layer-analysis-view'), // 1 source, the default case, e.g. type 'trade-area'
  require('./analysis-views/composite-layer-analysis-view') // 2 source, consist of two sources, e.g. 'point-in-polygon'
];

var LayerAnalysisViewFactory = function (analysisDefinitionNodesCollection, analysis) {
  this._analysisDefinitionNodesCollection = analysisDefinitionNodesCollection;
  this._analysis = analysis;
};

/**
 * @param {Object} layerAnalysisDefinitionNodeModel
 * @param {Object} layerDefinitionModel
 * @return {Object} instance of cdb.core.View
 * @throws {Error} if node model can not be found, or view can not be found for the given mode
 */
LayerAnalysisViewFactory.prototype.createView = function (layerAnalysisDefinitionNodeModel, layerDefinitionModel) {
  if (!layerAnalysisDefinitionNodeModel) throw new Error('layerAnalysisDefinitionNodeModel is required');
  if (!layerDefinitionModel) throw new Error('layerDefinitionModel is required');

  var nodeModel = layerAnalysisDefinitionNodeModel;

  if (layerDefinitionModel.isOwnerOfAnalysisNode(nodeModel)) {
    var View = SOURCES_COUNT_TO_VIEWS_MAP[nodeModel.sourceIds().length];
    if (!View) throw new Error('no analysis-node-view found for node' + nodeModel.toJSON());

    return new View({
      model: nodeModel,
      analysisNode: this._analysis.findNodeById(nodeModel.id),
      layerDefinitionModel: layerDefinitionModel,
      analysisDefinitionNodesCollection: this._analysisDefinitionNodesCollection,
      layerAnalysisViewFactory: this
    });
  } else {
    var otherModel = layerDefinitionModel.collection.find(function (m) {
      return m.isOwnerOfAnalysisNode(nodeModel);
    });

    return new RefLayerAnalysisView({
      model: otherModel,
      layerDefinitionModel: layerDefinitionModel
    });
  }
};

module.exports = LayerAnalysisViewFactory;

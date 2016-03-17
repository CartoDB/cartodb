var _ = require('underscore');

var LayerAnalysisHelper = function (layerDefinitionModel) {
  this._layerDefinitionModel = layerDefinitionModel;
};

LayerAnalysisHelper.prototype.getDraggedNodes = function (analysisDefinitioNodeModel) {
  if (this._draggledNodes) {
    return this._draggedNodes;
  }

  var source = analysisDefinitioNodeModel.id;
  var analysisDefinitionNodeCollection = analysisDefinitioNodeModel.collection;
  var analysisModels = analysisDefinitionNodeCollection.models;

  var modelIndex = analysisModels.indexOf(analysisDefinitionNodeCollection.get(source)) + 1;
  var selectedModels = analysisModels.slice(0, modelIndex);

  this._draggedNodes = _.chain(selectedModels)
  .filter(function (m) { return this._layerDefinitionModel.hasAnalysisNode(m); }, this)
  .value();

  return this._draggedNodes;
};

LayerAnalysisHelper.prototype.createHelper = function (analysisDefinitioNodeModel) {
  if (!analysisDefinitioNodeModel) throw new Error('analysisDefinitioNodeModel is required');
  var analysisDefinitioNodeModels = this.getDraggedNodes(analysisDefinitioNodeModel);
  return '<div>' + _.pluck(analysisDefinitioNodeModels, 'id').reverse().join('<br />') + '</div>';
};

module.exports = LayerAnalysisHelper;

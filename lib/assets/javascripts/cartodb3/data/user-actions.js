/**
 * Adapter for CRUD operations that require various collections,
 * to not have to pass them all around various view hierarchies.
 *
 * @param {Object} collections
 * @param {Object} collections.analysisDefinitionsCollection
 * @param {Object} collections.analysisDefinitionNodesCollection
 * @param {Object} collections.widgetDefinitionsCollection
 * @return {Object} that contains all user-actions that the user may do related to a map
 */
module.exports = function (collections) {
  if (!collections.analysisDefinitionsCollection) throw new Error('analysisDefinitionsCollection is required');
  if (!collections.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
  if (!collections.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
  if (!collections.widgetDefinitionsCollection) throw new Error('widgetDefinitionsCollection is required');

  var analysisDefinitionsCollection = collections.analysisDefinitionsCollection;
  var analysisDefinitionNodesCollection = collections.analysisDefinitionNodesCollection;
  var layerDefinitionsCollection = collections.layerDefinitionsCollection;
  var widgetDefinitionsCollection = collections.widgetDefinitionsCollection;

  return {

    saveAnalysis: function (analysisFormModel) {
      analysisFormModel.save(null, {
        analysisDefinitionsCollection: analysisDefinitionsCollection,
        analysisDefinitionNodesCollection: analysisDefinitionNodesCollection
      });
    },

    saveAnalysisSourceQuery: function (query, nodeDefModel, layerDefModel) {
      nodeDefModel.saveQuery({
        query: query,
        analysisDefinitionsCollection: analysisDefinitionsCollection,
        layerDefModel: layerDefModel
      });
    },

    saveWidget: function (widgetOptionModel) {
      widgetOptionModel.save(null, {
        analysisDefinitionsCollection: analysisDefinitionsCollection,
        widgetDefinitionsCollection: widgetDefinitionsCollection
      });
    },

    deleteAnalysisNode: function (nodeId) {
      var nodeDefModel = analysisDefinitionNodesCollection.get(nodeId);
      if (!nodeDefModel) return false; // abort if there is no node-definition; nothing to delete/change

      nodeDefModel.destroy({
        analysisDefinitionsCollection: analysisDefinitionsCollection,
        layerDefinitionsCollection: layerDefinitionsCollection,
        widgetDefinitionsCollection: widgetDefinitionsCollection
      });
    }
  };
};

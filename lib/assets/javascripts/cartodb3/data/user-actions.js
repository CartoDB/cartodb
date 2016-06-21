var camshaftReference = require('./camshaft-reference');

/**
 * Coordinate side-effects done on explicit interactions.
 * @param {Object} collections
 * @param {Object} collections.analysisDefinitionsCollection
 * @param {Object} collections.analysisDefinitionNodesCollection
 * @param {Object} collections.widgetDefinitionsCollection
 * @return {Object} that contains all user-actions that the user may do related to a map
 */
module.exports = function (collections) {
  if (!collections.analysisDefinitionsCollection) throw new Error('analysisDefinitionsCollection is required');
  if (!collections.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
  if (!collections.widgetDefinitionsCollection) throw new Error('widgetDefinitionsCollection is required');

  var analysisDefinitionsCollection = collections.analysisDefinitionsCollection;
  var analysisDefinitionNodesCollection = collections.analysisDefinitionNodesCollection;
  var widgetDefinitionsCollection = collections.widgetDefinitionsCollection;

  return {

    /**
     * Creates a new analysis node on a particular layer.
     * It's assumed to be created on top of an existing node.
     * @param {Object} nodeAttrs
     * @param {Object} layerDefModel - instance of layer-definition-model
     * @return {Object} instance of analysis-definition-node-model
     */
    createAnalysisNode: function (nodeAttrs, layerDefmodel) {
      var nodeDefModel = analysisDefinitionNodesCollection.add(nodeAttrs, {parse: false});
      var sourceNode = nodeDefModel.getPrimarySource();

      var analysisDefinitionModel = analysisDefinitionsCollection.findByNodeId(sourceNode.id);
      if (analysisDefinitionModel) {
        analysisDefinitionModel.save({node_id: nodeDefModel.id});
      } else {
        analysisDefinitionsCollection.create({analysis_definition: nodeDefModel.toJSON()});
      }

      layerDefmodel.save({
        cartocss: camshaftReference.getDefaultCartoCSSForType(nodeDefModel.get('type')),
        source: nodeDefModel.id
      });

      return nodeDefModel;
    },

    updateOrCreateAnalysis: function (analysisFormModel) {
      if (!analysisFormModel.isValid()) return;

      var nodeDefModel = analysisDefinitionNodesCollection.get(analysisFormModel.id);

      if (nodeDefModel) {
        analysisFormModel.updateNodeDefinition(nodeDefModel);
        var analysisDefinitionModel = analysisDefinitionsCollection.findAnalysisThatContainsNode(nodeDefModel);
        analysisDefinitionModel.save();
      } else {
        analysisFormModel.createNodeDefinition(this); // delegates creation to the form
      }
    },

    updateAnalysisSourceQuery: function (query, nodeDefModel, layerDefModel) {
      if (!nodeDefModel) throw new Error('nodeDefModel is required');
      if (nodeDefModel.get('type') !== 'source') throw new Error('nodeDefModel must be a source node');

      nodeDefModel.set('query', query || '');

      var analysisDefinitionModel = analysisDefinitionsCollection.findAnalysisThatContainsNode(nodeDefModel);
      if (analysisDefinitionModel) {
        analysisDefinitionModel.save();
      } else {
        analysisDefinitionsCollection.create({analysis_definition: nodeDefModel.toJSON()});
        layerDefModel.save();
      }
    },

    updateOrCreateWidget: function (widgetOptionModel) {
      var nodeDefModel = widgetOptionModel.analysisDefinitionNodeModel();

      // Might not always have a node-definition, e.g. time-series none-option
      if (nodeDefModel) {
        var analysisDefinitionModel = analysisDefinitionsCollection.findAnalysisThatContainsNode(nodeDefModel);

        if (!analysisDefinitionModel) {
          analysisDefinitionsCollection.create({analysis_definition: nodeDefModel.toJSON()});
          widgetOptionModel.layerDefinitionModel().save();
        }
      }

      widgetOptionModel.createUpdateOrSimilar(widgetDefinitionsCollection); // delegate back depending on use-case
    }

  };
};

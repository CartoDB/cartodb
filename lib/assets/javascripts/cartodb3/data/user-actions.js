var $ = require('jquery');
var _ = require('underscore');
var nodeIds = require('../value-objects/analysis-node-ids');
var camshaftReference = require('./camshaft-reference');
var layerTypesAndKinds = require('./layer-types-and-kinds');
var layerColors = require('./layer-colors');

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
  if (!collections.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
  if (!collections.widgetDefinitionsCollection) throw new Error('widgetDefinitionsCollection is required');

  var analysisDefinitionsCollection = collections.analysisDefinitionsCollection;
  var analysisDefinitionNodesCollection = collections.analysisDefinitionNodesCollection;
  var layerDefinitionsCollection = collections.layerDefinitionsCollection;
  var widgetDefinitionsCollection = collections.widgetDefinitionsCollection;

  var createDefaultCartoDBAttrs = function () {
    return {
      kind: 'carto',
      options: {
        interactivity: '',
        tile_style: camshaftReference.getDefaultCartoCSSForType(),
        cartocss: camshaftReference.getDefaultCartoCSSForType(),
        style_version: '2.1.1',
        visible: true
      },
      tooltip: {},
      infowindow: {}
    };
  };

  var deleteOrphanedNodes = function () {
    _.clone(analysisDefinitionNodesCollection.models).forEach(function (nodeDefModel) {
      if (!layerDefinitionsCollection.isUsedByAnyLayer(nodeDefModel)) {
        // Also delete it's analysis if it's persisted
        var analysisDefModel = analysisDefinitionsCollection.findByNodeId(nodeDefModel.id);
        if (analysisDefModel) {
          analysisDefModel.destroy();
        }
        nodeDefModel.destroy();
      }
    });
  };

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
    },

    deleteAnalysisNode: function (nodeId) {
      var nodeDefModel = analysisDefinitionNodesCollection.get(nodeId);
      if (!nodeDefModel) return false; // abort if there is no node-definition; nothing to delete/change

      var analysisDefModel;
      var primarySourceNode = nodeDefModel.getPrimarySource();

      if (primarySourceNode) {
        // If deleted node had an analysis, update it to point to its primary source instead
        analysisDefModel = analysisDefinitionsCollection.findByNodeId(nodeId);
        if (analysisDefModel) {
          analysisDefModel.save({node_id: primarySourceNode.id});
        }

        // If deleted node was a head of a layer change the source to be its primary source instead
        layerDefinitionsCollection.each(function (m) {
          if (m.get('source') === nodeId) {
            m.save({source: primarySourceNode.id});
          }
        });
      }

      var containsNode = function (m) {
        return m.id !== nodeDefModel.id && m.containsNode(nodeDefModel);
      };
      _
        .flatten([
          analysisDefinitionNodesCollection.filter(containsNode),
          analysisDefinitionsCollection.filter(containsNode),
          layerDefinitionsCollection.filter(containsNode),
          widgetDefinitionsCollection.filter(containsNode),
          nodeDefModel
        ], true)
        .forEach(function (m) {
          m.destroy();
        });

      // If there were a primary source, make sure it's not orphaned afterwards
      if (primarySourceNode && !analysisDefModel) {
        analysisDefModel = analysisDefinitionsCollection.find(containsNode);
        if (!analysisDefModel) {
          analysisDefinitionsCollection.create({analysis_definition: primarySourceNode.toJSON()});
        }
      }
    },

    createLayerForTable: function (tableName, options) {
      options = options || {};

      var order = options.order;
      var layerOnTop = layerDefinitionsCollection.last();

      if (layerOnTop) {
        var orderLimit = layerOnTop.get('order');

        if (layerTypesAndKinds.isCartoDBType(layerOnTop.get('type'))) {
          orderLimit += 1; // Layer is placed on top
        } else if (layerTypesAndKinds.isTorqueType(layerOnTop.get('type')) || layerTypesAndKinds.isTiledType(layerOnTop.get('type'))) {
          layerOnTop.set('order', orderLimit + 1); // Layer that was on top is kept on top
        }

        // If wanted order is still on top settle on the layer
        if (isNaN(order)) {
          order = orderLimit;
        } else if (order > orderLimit) {
          order = orderLimit;
        }
      }

      var letter = layerDefinitionsCollection.nextLetter();

      var nodeDefModel = analysisDefinitionNodesCollection.createSourceNode({
        id: nodeIds.next(letter),
        tableName: tableName
      });
      analysisDefinitionsCollection.create({analysis_definition: nodeDefModel.toJSON()});

      var attrs = createDefaultCartoDBAttrs();
      attrs.letter = letter;
      attrs.order = order || 1; // start on top of basemap as fallback
      attrs.options.table_name = tableName;
      attrs.options.query = 'SELECT * FROM ' + tableName;

      return layerDefinitionsCollection.create(attrs, {
        at: attrs.order,
        error: options.error,
        success: function () {
          layerDefinitionsCollection.save();
          options.success && options.success();
        }
      });
    },

    /**
     * A layer for an existing node have different side-effects depending on the context in which the node exists.
     */
    createLayerForAnalysisNode: function (nodeId, newOrder) {
      var nodeDefModel = analysisDefinitionNodesCollection.get(nodeId);
      if (!nodeDefModel) throw new Error('node with id ' + nodeId + ' does not exist');
      if (isNaN(newOrder) || newOrder <= 0) throw new Error('newOrder must be on top of the base layer');

      // Node is a source layer just duplicate the source instead of creating unnecessary references
      if (!nodeDefModel.hasPrimarySource()) {
        return this.createLayerForTable(nodeDefModel.get('table_name'), {order: newOrder});
      }

      var attrs, tableName, tableNameAlias, analysisDefModel;
      var nextLetter = layerDefinitionsCollection.nextLetter();

      var prevLayer = layerDefinitionsCollection.findWhere({source: nodeId});
      if (prevLayer) {
        // Node is head of a layer, e.g. given nodeId A3 it should rename prev layer (A => B), and create a new layer (A)
        // where the prev layer was to take over its letter identity and its primary source (A2).
        // The motivation for this is to maintain the layer's state (styles, popup etc.) which really depends on the
        // last analysis output than the layer itself:
        //   _______       _______   ______
        //  | A    |      | A    |  | B    | <-- note that B is really A which just got moved & had it's nodes renamed
        //  |      |      |      |  |      |
        //  | {A3} |  =>  |      |  | {B1} |
        //  | [A2] |      | [A2] |  | [A2] |
        //  | [A1] |      | [A1] |  |      |
        //  | [A0] |      | [A0] |  |      |
        //  |______|      |______|  |______|
        var prevOrder = prevLayer.get('order');
        var prevLetter = prevLayer.get('letter');

        analysisDefModel = analysisDefinitionsCollection.findAnalysisThatContainsNode(nodeDefModel); // get before changing ids!

        var renamedNodeDefModel = nodeDefModel.clone(nextLetter + '1'); // e.g. A3 => B1
        analysisDefinitionNodesCollection.invoke('changeSourceIds', nodeId, renamedNodeDefModel.id);

        if (analysisDefModel) {
          if (analysisDefModel.get('node_id') === nodeDefModel.id) {
            // renamed node is the owner of the analysis, so must update the id!
            attrs = {node_id: renamedNodeDefModel.id};
          }
          analysisDefModel.save(attrs);
        } else {
          analysisDefinitionsCollection.create({analysis_definition: renamedNodeDefModel.toJSON()});
        }

        // Change identity of prevLayer (A) so it appears as the new layer (B)
        prevLayer.save({
          order: newOrder,
          letter: nextLetter,
          color: layerColors.getColorForLetter(nextLetter),
          source: renamedNodeDefModel.id
        });

        // Remove prevLayer (A) temporarily, to move the layers to expected positions
        layerDefinitionsCollection.remove(prevLayer, {silent: true}); // silent to avoid unwanted side-effects; re-added again later;

        // New layer takes over the identity of the old layer (A), and its primary source as its head node
        tableName = prevLayer.get('table_name');
        tableNameAlias = prevLayer.get('table_name_alias');
        attrs = createDefaultCartoDBAttrs();
        attrs.order = prevOrder;
        attrs.options = _.extend({}, attrs.options, {
          sql: 'SELECT * FROM ' + tableName,
          table_name: tableName,
          table_name_alias: tableNameAlias,
          letter: prevLetter,
          color: layerColors.getColorForLetter(prevLetter),
          source: nodeDefModel.getPrimarySource().id
        });
        var newLayerDefModel = layerDefinitionsCollection.add(attrs, {at: prevOrder});

        // Re-add source layer again, but after the new layer was created and before layer is getting saved
        layerDefinitionsCollection.add(prevLayer, {at: newOrder});

        newLayerDefModel.save(null, {
          success: function () {
            layerDefinitionsCollection.save(); // for orders to be up-to-date
          }
        });
      } else {
        // Node is NOT a head of a node, e.g. given nodeId is 'a2' this would create a new layer B which takes over the
        // ownership of the given node and its underlying nodes
        //   _______       _______   ______
        //  | A    |      | A    |  | B    |
        //  |      |      |      |  |      |
        //  | [A3] |      | [A3] |  | {B2} |
        //  | {A2} |  =>  | {B2} |  | [B1] |
        //  | [A1] |      |      |  | [B0] |
        //  | [A0] |      |      |  |      |
        //  |______|      |______|  |______|
        analysisDefModel = analysisDefinitionsCollection.findAnalysisThatContainsNode(nodeDefModel); // get before changing ids!

        var newLayerHeadNode = nodeDefModel.cloneTreeWithSameLetter(nextLetter); // => B2, in the example above
        analysisDefinitionNodesCollection.invoke('changeSourceIds', nodeId, newLayerHeadNode.id);

        if (analysisDefModel) {
          analysisDefModel.save(); // new node (B2) is still present in the same analysis graph (of A3), so enough to save
        } else {
          var prevParentLayer = layerDefinitionsCollection.findOwnerOfAnalysisNode(nodeDefModel);
          var m = prevParentLayer
            ? prevParentLayer.getAnalysisDefinitionNodeModel() // To have all nodes persisted (from A4)
            : nodeDefModel; // No parent found, use the given node (B2)
          analysisDefinitionsCollection.create({analysis_definition: m.toJSON()}); // To have all nodes persisted (from A4)
        }

        // Create the new layer (B)
        var ownerLayer = layerDefinitionsCollection.findOwnerOfAnalysisNode(nodeDefModel);
        tableName = ownerLayer.get('table_name');
        tableNameAlias = ownerLayer.get('table_name_alias');
        attrs = createDefaultCartoDBAttrs();
        attrs.order = newOrder;
        attrs.options = _.extend({}, attrs.options, {
          sql: 'SELECT * FROM ' + tableName,
          table_name: tableName,
          table_name_alias: tableNameAlias,
          letter: nextLetter,
          color: layerColors.getColorForLetter(nextLetter),
          source: newLayerHeadNode.id
        });
        newLayerDefModel = layerDefinitionsCollection.create(attrs, {
          at: newOrder,
          success: function () {
            layerDefinitionsCollection.save(); // for orders to be up-to-date
          }
        });
      }

      nodeDefModel.destroy(); // replaced by new node
      deleteOrphanedNodes();
    },

    moveLayer: function (d) {
      var from = d.from;
      var to = d.to;

      var movingLayer = layerDefinitionsCollection.at(from);
      layerDefinitionsCollection.remove(movingLayer, {silent: true});
      layerDefinitionsCollection.add(movingLayer, {at: to, parse: false, silent: true});

      var saveAnalysisPromises = layerDefinitionsCollection
        .chain()
        .map(function (layerDefModel) {
          var nodeDefModel = layerDefModel.getAnalysisDefinitionNodeModel();
          if (nodeDefModel && !analysisDefinitionsCollection.isPersisted(nodeDefModel)) {
            return analysisDefinitionsCollection.create({analysis_definition: nodeDefModel.toJSON()});
          }
        })
        .compact()
        .value();

      $.when.apply($, saveAnalysisPromises).done(function () { // http://api.jquery.com/jQuery.when/
        layerDefinitionsCollection.save({
          success: function () {
            layerDefinitionsCollection.trigger('layerMoved', movingLayer, to, layerDefinitionsCollection);
          }
        });
      });
    }

  };
};

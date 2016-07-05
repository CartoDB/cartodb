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
      if (!layerDefinitionsCollection.anyContainsNode(nodeDefModel)) {
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

      var primarySourceNode = nodeDefModel.getPrimarySource();

      // If deleted node was a head of a layer change the source to be its primary source instead
      if (primarySourceNode) {
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

      deleteOrphanedNodes();

      // If there were a primary source, make sure it's not orphaned afterwards
      if (primarySourceNode) {
        var analysisDefModel = analysisDefinitionsCollection.findAnalysisThatContainsNode(primarySourceNode);
        if (!analysisDefModel) {
          analysisDefinitionsCollection.create({analysis_definition: primarySourceNode.toJSON()});
        }
      }
    },

    createLayerForTable: function (tableName, options) {
      options = options || {};

      // Setting at assumes there to be at least one non-basemap layer
      var at = options.order || layerDefinitionsCollection.length;
      var layerOnTop = layerDefinitionsCollection.last();
      if (layerOnTop && !layerTypesAndKinds.isCartoDBType(layerOnTop.get('type'))) {
        layerOnTop.set('order', layerOnTop.get('order') + 1); // persisted on collection.save in success callback below
        if (at >= layerDefinitionsCollection.indexOf(layerOnTop)) {
          at--; // e.g. tiled (labels-on-top), torque
        }
      }

      var newLetter = layerDefinitionsCollection.nextLetter();

      var nodeDefModel = analysisDefinitionNodesCollection.createSourceNode({
        id: nodeIds.next(newLetter),
        tableName: tableName
      });
      analysisDefinitionsCollection.create({analysis_definition: nodeDefModel.toJSON()});

      var attrs = createDefaultCartoDBAttrs();
      attrs.letter = newLetter;
      attrs.order = at;
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

      var attrs;
      var tableName;
      var tableNameAlias;
      var analysisDefModel;
      var newLetter = layerDefinitionsCollection.nextLetter();

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

        var renamedNodeId = newLetter + '1';
        var renamedNodeDefModel = nodeDefModel.clone(renamedNodeId); // e.g. A3 => B1
        analysisDefinitionNodesCollection.invoke('changeSourceIds', nodeId, renamedNodeId);
        widgetDefinitionsCollection.updateSourceIds(nodeId, renamedNodeId);

        if (analysisDefModel) {
          if (analysisDefModel.get('node_id') === nodeDefModel.id) {
            // renamed node is the owner of the analysis, so must update the id!
            attrs = {node_id: renamedNodeId};
          }
          analysisDefModel.save(attrs);
        } else {
          analysisDefinitionsCollection.create({analysis_definition: renamedNodeDefModel.toJSON()});
        }

        // Change identity of prevLayer (A) so it appears as the new layer (B)
        prevLayer.save({
          order: newOrder,
          letter: newLetter,
          color: layerColors.getColorForLetter(newLetter),
          source: renamedNodeId
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

        var linkedNodesList = nodeDefModel.linkedListBySameLetter();
        var moveNode = function (oldNode) {
          var newId = nodeIds.changeLetter(oldNode.id, newLetter);
          var newNode = oldNode.clone(newId);
          analysisDefinitionNodesCollection.invoke('changeSourceIds', oldNode.id, newId);
          widgetDefinitionsCollection.updateSourceIds(oldNode.id, newId);
          return newNode;
        };
        var newLayerHeadNode = moveNode(linkedNodesList[0]);
        _.rest(linkedNodesList).forEach(moveNode);

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
          letter: newLetter,
          color: layerColors.getColorForLetter(newLetter),
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
    },

    deleteLayer: function (id, opts) {
      var layerToDelete = layerDefinitionsCollection.get(id);
      if (!layerToDelete.canBeDeletedByUser()) return;

      var toDestroy = [];

      // Iterate over each node in the list, to decide how to remove dependent objects or fold nodes (if possible)
      // under another layer's linked nodes list.
      var linkedNodesList = layerToDelete.getAnalysisDefinitionNodeModel().linkedListBySameLetter(); // => e.g. [b2,b1]
      var nodeDefModel;
      for (var i = 0; i < linkedNodesList.length; i++) {
        nodeDefModel = linkedNodesList[i];

        var parentLayer = layerDefinitionsCollection.findPrimaryParentLayerToAnalysisNode(nodeDefModel, {exclude: toDestroy}); // TODO implement

        // No parent layer? delete all dependent objects, since can't move current nodeDefModel elsewhere
        if (!parentLayer) {
          layerDefinitionsCollection.each(function (layer) {
            if (!_.contains(toDestroy, layer) && layer.containsNode(nodeDefModel)) {
              toDestroy.push(layer);

              widgetDefinitionsCollection.each(function (widget) {
                if (!_.contains(toDestroy, widget) && widget.containsNode(nodeDefModel)) {
                  toDestroy.push(widget);
                }
              });
            }

            toDestroy.push(nodeDefModel);
          });

          continue; // to process all sequent nodes in the linekd list, and their (possibly) dependent objects
        }

        if (!_.contains(toDestroy, layerToDelete)) {
          toDestroy.push(layerToDelete);
        }
        var newParentLinkedNodesList = parentLayer
          .getAnalysisDefinitionNodeModel()
          .linkedListBySameLetter()
          .concat(linkedNodesList.slice(i));
        var idSequence = newParentLinkedNodesList.length;

        var lastNode = _.last(newParentLinkedNodesList);
        nodeDefModel = lastNode;
        if (lastNode.get('type') !== 'source') {
          idSequence++; // to start on right id sequence, so last item in newParentLinkedNodesList gets assigned x1 as id, since its source will be a none-source node belong to another layer
          nodeDefModel = lastNode.getPrimarySource();
        }
        var prevId = parentLayer.get('letter') + idSequence;
        var moveNodeToParentLayer = function (node) {
          var oldNodeId = node.id;
          var newId = nodeIds.prev(prevId);

          analysisDefinitionNodesCollection.each(function (m) {
            if (!_.contains(toDestroy, m)) {
              m.changeSourceIds(oldNodeId, newId);
            }
          });
          widgetDefinitionsCollection.updateSourceIds(oldNodeId, newId);

          node.set('id', newId);
          prevId = newId;

          return node;
        };
        var newParentLayerNode = moveNodeToParentLayer(newParentLinkedNodesList[0]);
        _.rest(newParentLinkedNodesList).forEach(moveNodeToParentLayer);

        parentLayer.save({source: newParentLayerNode.id});
        break; // since the remaining nodes have been move to a parent layer
      }

      toDestroy = toDestroy.concat(analysisDefinitionsCollection.toArray());
      var promises = _.chain(toDestroy)
        .unique()
        .map(function (m) {
          return m.destroy();
        })
        .value();
      var promise = $.when.apply($, promises); // http://api.jquery.com/jQuery.when/
      if (opts && opts.success) promise.done(opts.success);
      if (opts && opts.error) promise.fail(opts.error);

      layerDefinitionsCollection.each(function (layerDefModel) {
        var nodeDefModel = layerDefModel.getAnalysisDefinitionNodeModel();
        if (!nodeDefModel) return;
        analysisDefinitionsCollection.create({analysis_definition: nodeDefModel.toJSON()});
      });

      deleteOrphanedNodes();
    }

  };
};

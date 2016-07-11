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
        var analysisDefModel = analysisDefinitionsCollection.findWhere({node_id: nodeDefModel.id});
        if (analysisDefModel) {
          analysisDefModel.destroy();
        }
        nodeDefModel.destroy();
      }
    });
  };

  return {

    saveAnalysis: function (analysisFormModel) {
      if (!analysisFormModel.isValid()) return;
      var nodeDefModel = analysisDefinitionNodesCollection.get(analysisFormModel.id);

      if (nodeDefModel) {
        analysisDefinitionsCollection.saveAnalysis(nodeDefModel, {
          beforeSave: function () {
            analysisFormModel.updateNodeDefinition(nodeDefModel);
          }
        });
      } else {
        analysisFormModel.createNodeDefinition(this); // delegate creation to the form, but expect it to call userActions.createAnalysisNode when done with its internal stuff
      }
    },

    /**
     * Creates a new analysis node on a particular layer.
     * It's assumed to be created on top of an existing node.
     * @param {Object} nodeAttrs
     * @param {Object} layerDefModel - instance of layer-definition-model
     * @return {Object} instance of analysis-definition-node-model
     */
    createAnalysisNode: function (nodeAttrs, layerDefModel) {
      var nodeDefModel = analysisDefinitionNodesCollection.add(nodeAttrs, {parse: false});
      var sourceNode = nodeDefModel.getPrimarySource();

      var analysisDefinitionModel = analysisDefinitionsCollection.findWhere({node_id: sourceNode.id});
      if (analysisDefinitionModel) {
        analysisDefinitionModel.save({node_id: nodeDefModel.id});
      } else {
        analysisDefinitionsCollection.createAnalysisForNode(nodeDefModel);
      }

      layerDefModel.save({
        cartocss: camshaftReference.getDefaultCartoCSSForType(nodeDefModel.get('type')),
        source: nodeDefModel.id
      });

      var CHANGE_READY = 'change:ready';
      var onQuerySchemaReady;
      onQuerySchemaReady = function () {
        var querySchemaModel = nodeDefModel.querySchemaModel;
        if (querySchemaModel.get('ready')) {
          querySchemaModel.off(CHANGE_READY, onQuerySchemaReady);
        } else {
          return; // wait until ready
        }

        var CHANGE_STATUS = 'change:status';
        var saveDefaultStylesIfStillRelevant;
        saveDefaultStylesIfStillRelevant = function () {
          if (querySchemaModel.get('status') === 'fetched') {
            querySchemaModel.off(CHANGE_STATUS, saveDefaultStylesIfStillRelevant);
          } else {
            return; // wait until fetched
          }

          var geometry;

          if ( // Only apply changes if:
            layerDefinitionsCollection.contains(layerDefModel) && // layer still exist
            layerDefModel.get('source') === nodeDefModel.id && // node is still the head of layer
            layerDefModel.styleModel.get('type') === 'none' && // layer have no styles applied
            (geometry = querySchemaModel.getGeometry()) // nodes contains a geometry
          ) {
            layerDefModel.styleModel.setDefaultPropertiesByType('simple', geometry.getSimpleType());
            layerDefModel.save();
          }
        };
        saveDefaultStylesIfStillRelevant();
        querySchemaModel.on(CHANGE_STATUS, saveDefaultStylesIfStillRelevant);
        querySchemaModel.fetch();
      };
      nodeDefModel.querySchemaModel.on(CHANGE_READY, onQuerySchemaReady);
      onQuerySchemaReady();

      return nodeDefModel;
    },

    saveAnalysisSourceQuery: function (query, nodeDefModel, layerDefModel) {
      if (!nodeDefModel) throw new Error('nodeDefModel is required');
      if (nodeDefModel.get('type') !== 'source') throw new Error('nodeDefModel must be a source node');

      nodeDefModel.set('query', query || '');

      analysisDefinitionsCollection.saveAnalysis(nodeDefModel, {layerDefinitionModel: layerDefModel});
    },

    saveWidgetOption: function (widgetOptionModel) {
      if (!widgetOptionModel) throw new Error('widgetOptionModel is required');

      var nodeDefModel = widgetOptionModel.analysisDefinitionNodeModel();
      var layerDefModel = widgetOptionModel.layerDefinitionModel();

      if (nodeDefModel) { // Might not always have a node-definition, e.g. time-series none-option
        analysisDefinitionsCollection.saveAnalysis(nodeDefModel, {layerDefinitionModel: layerDefModel});
      }
      widgetOptionModel.save(widgetDefinitionsCollection); // delegate back depending on use-case
    },

    saveWidget: function (widgetDefModel) {
      if (!widgetDefModel) throw new Error('widgetDefModel is required');

      var widgetLayerId = widgetDefModel.get('layer_id');
      layerDefinitionsCollection.some(function (layerDefModel) {
        if (layerDefModel.id === widgetLayerId) {
          this.saveLayer(layerDefModel);
          return true; // aborts the "some"-iterator
        }
      }, this);

      widgetDefModel.save();
    },

    deleteAnalysisNode: function (nodeId) {
      var nodeDefModel = analysisDefinitionNodesCollection.get(nodeId);
      if (!nodeDefModel) return false; // abort if there is no node-definition; nothing to delete/change
      if (!nodeDefModel.canBeDeletedByUser()) return false;

      var layerDefModel = layerDefinitionsCollection.findOwnerOfAnalysisNode(nodeDefModel);
      var primarySourceNode = nodeDefModel.getPrimarySource();

      var containsNode = function (m) {
        return m !== layerDefModel && m !== nodeDefModel && m.containsNode(nodeDefModel);
      };
      _
        .flatten([
          widgetDefinitionsCollection.filter(containsNode),
          layerDefinitionsCollection.filter(containsNode),
          analysisDefinitionsCollection.filter(containsNode),
          analysisDefinitionNodesCollection.filter(containsNode),
          nodeDefModel
        ], true)
        .forEach(function (m) {
          m.destroy();
        });

      layerDefModel.save({source: primarySourceNode.id});
      analysisDefinitionsCollection.saveAnalysis(primarySourceNode);

      deleteOrphanedNodes();
    },

    /**
     * Create a new layer for a given table name
     * @param {string} tableName
     * @param {object} [options]
     * @param {number} [options.at]
     */
    createLayerForTable: function (tableName, options) {
      options = options || {};

      // Setting at assumes there to be at least one non-basemap layer
      var at = options.at || layerDefinitionsCollection.length;
      var layerOnTop = layerDefinitionsCollection.last();
      if (layerOnTop && !layerTypesAndKinds.isCartoDBType(layerOnTop.get('type'))) {
        layerOnTop.set('order', layerDefinitionsCollection.indexOf(layerOnTop) + 1); // persisted on collection.save in success callback below
        if (at >= layerDefinitionsCollection.indexOf(layerOnTop)) {
          at--; // e.g. tiled (labels-on-top), torque
        }
      }

      var newLetter = layerDefinitionsCollection.nextLetter();

      var nodeDefModel = analysisDefinitionNodesCollection.createSourceNode({
        id: nodeIds.next(newLetter),
        tableName: tableName
      });
      analysisDefinitionsCollection.createAnalysisForNode(nodeDefModel);

      var attrs = createDefaultCartoDBAttrs();
      attrs.letter = newLetter;
      attrs.order = at;
      attrs.options.table_name = tableName;
      attrs.options.query = 'SELECT * FROM ' + tableName;

      return layerDefinitionsCollection.create(attrs, {
        wait: true,
        at: at,
        error: options.error,
        success: function () {
          layerDefinitionsCollection.save();
          options.success && options.success();
        }
      });
    },

    /**
     * A layer for an existing node have different side-effects depending on the context in which the node exists.
     * @param {string} nodeid
     * @param {object} cfg
     * @param {number} cfg.at
     */
    createLayerForAnalysisNode: function (nodeId, cfg) {
      var nodeDefModel = analysisDefinitionNodesCollection.get(nodeId);
      if (!nodeDefModel) throw new Error('node with id ' + nodeId + ' does not exist');
      if (!cfg) throw new Error('cfg is required');
      if (isNaN(cfg.at) || cfg.at <= 0) throw new Error('cfg.at must be on top of the base layer');

      var newPosition = cfg.at;

      // Node is a source layer just duplicate the source instead of creating unnecessary references
      if (!nodeDefModel.hasPrimarySource()) {
        return this.createLayerForTable(nodeDefModel.get('table_name'), {at: newPosition});
      }

      var attrs;
      var tableName;
      var tableNameAlias;
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
        var prevOrder = layerDefinitionsCollection.indexOf(prevLayer);
        var prevLetter = prevLayer.get('letter');

        // Save analysis for the new layer that takes owner identity of A
        var primarySource = nodeDefModel.getPrimarySource();
        var analysisDefModel = analysisDefinitionsCollection.findWhere({node_id: nodeDefModel.id});
        if (analysisDefModel) {
          analysisDefModel.save({node_id: primarySource.id});
        } else {
          analysisDefinitionsCollection.createAnalysisForNode(primarySource);
        }

        var renamedNodeId = newLetter + '1';
        var renamedNodeDefModel = nodeDefModel.clone(renamedNodeId); // e.g. A3 => B1
        analysisDefinitionNodesCollection.invoke('changeSourceIds', nodeId, renamedNodeId);
        widgetDefinitionsCollection.each(function (m) {
          if (m.get('source') === nodeId) {
            m.save({source: renamedNodeId});
          }
        });

        analysisDefinitionsCollection.createAnalysisForNode(renamedNodeDefModel);

        // Change identity of prevLayer (A) so it appears as the new layer (B)
        prevLayer.save({
          order: newPosition,
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
          source: primarySource.id
        });
        var newLayerDefModel = layerDefinitionsCollection.add(attrs, {at: prevOrder});

        // Re-add source layer again, but after the new layer was created and before layer is getting saved
        layerDefinitionsCollection.add(prevLayer, {at: newPosition});

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
        var linkedNodesList = nodeDefModel.linkedListBySameLetter();
        var moveNode = function (oldNode) {
          var newId = nodeIds.changeLetter(oldNode.id, newLetter);
          var newNode = oldNode.clone(newId);

          analysisDefinitionNodesCollection.invoke('changeSourceIds', oldNode.id, newId);
          widgetDefinitionsCollection.each(function (m) {
            if (m.get('source') === oldNode.id) {
              m.save({source: newId});
            }
          });

          return newNode;
        };
        var newLayerHeadNode = moveNode(linkedNodesList[0]);
        _.rest(linkedNodesList).forEach(moveNode);

        // Create new analysis and also save all analyses that depends on it
        var newAnalysis = analysisDefinitionsCollection.createAnalysisForNode(newLayerHeadNode);
        analysisDefinitionsCollection.each(function (m) {
          if (m !== newAnalysis && m.containsNode(newLayerHeadNode)) {
            m.save();
          }
        });

        // Create the new layer (B)
        var ownerLayer = layerDefinitionsCollection.findOwnerOfAnalysisNode(nodeDefModel);
        tableName = ownerLayer.get('table_name');
        tableNameAlias = ownerLayer.get('table_name_alias');
        attrs = createDefaultCartoDBAttrs();
        attrs.order = newPosition;
        attrs.options = _.extend({}, attrs.options, {
          sql: 'SELECT * FROM ' + tableName,
          table_name: tableName,
          table_name_alias: tableNameAlias,
          letter: newLetter,
          color: layerColors.getColorForLetter(newLetter),
          source: newLayerHeadNode.id
        });
        newLayerDefModel = layerDefinitionsCollection.create(attrs, {
          at: newPosition,
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
          if (nodeDefModel) {
            return analysisDefinitionsCollection.saveAnalysis(nodeDefModel);
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

    deleteLayer: function (id) {
      var layerToDelete = layerDefinitionsCollection.get(id);
      if (!layerToDelete.canBeDeletedByUser()) return;

      var toDestroy = [];

      // Iterate over each node in the list, to decide how to remove dependent objects or fold nodes (if possible)
      // under another layer's linked nodes list.
      var linkedNodesList = layerToDelete.getAnalysisDefinitionNodeModel().linkedListBySameLetter(); // => e.g. [b2,b1]
      var nodeDefModel;
      for (var i = 0; i < linkedNodesList.length; i++) {
        nodeDefModel = linkedNodesList[i];

        var parentLayer = layerDefinitionsCollection.findPrimaryParentLayerToAnalysisNode(nodeDefModel, {exclude: toDestroy});

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

        var oldParentLayerNode = parentLayer.getAnalysisDefinitionNodeModel();
        var oldParentLayerNodeId = oldParentLayerNode.id;

        var newParentLinkedNodesList = oldParentLayerNode
          .linkedListBySameLetter()
          .concat(nodeDefModel.linkedListBySameLetter());

        // Since will reassign ids from the start of list need to calculate which sequence id to start on
        var idSequence = newParentLinkedNodesList.length;
        var lastNode = _.last(newParentLinkedNodesList);
        if (lastNode.get('type') !== 'source') {
          idSequence++; // to start on right id sequence, so last item in newParentLinkedNodesList gets assigned x1 as id, since its source will be a none-source node belong to another layer
        }

        // Reassign ids one-by-one, from start of list to avoid ids overlapping (e.g. [c2,c1]+[b2,b1] = [c4,c3,c2,c1])
        var prevId = parentLayer.get('letter') + idSequence;
        var moveNodeToParentLayer = function (node) {
          var oldNodeId = node.id;
          var newId = nodeIds.prev(prevId);
          node.set('id', newId);

          // Update any references to the current
          analysisDefinitionNodesCollection.each(function (m) {
            if (!_.contains(toDestroy, m)) {
              m.changeSourceIds(oldNodeId, newId);
            }
          });
          widgetDefinitionsCollection.each(function (m) {
            if (m.get('source') === oldNodeId && !_.contains(toDestroy, m)) {
              m.save({source: newId});
            }
          });

          prevId = newId;

          return node;
        };
        var newParentLayerNode = moveNodeToParentLayer(newParentLinkedNodesList[0]);
        _.rest(newParentLinkedNodesList).forEach(moveNodeToParentLayer);

        var analysisDefModel = analysisDefinitionsCollection.findWhere({node_id: oldParentLayerNodeId});
        if (analysisDefModel) {
          analysisDefModel.save({node_id: newParentLayerNode.id});
        } else {
          analysisDefinitionsCollection.createAnalysisForNode(newParentLayerNode);
        }
        parentLayer.save({source: newParentLayerNode.id});

        break; // since the remaining nodes have been move to a parent layer
      }

      if (!_.contains(toDestroy, layerToDelete)) {
        toDestroy.unshift(layerToDelete);
      }

      var promise = $.when.apply($, // http://api.jquery.com/jQuery.when/
        _.chain(toDestroy)
        .reduce(function (memo, m) {
          memo.push(m);
          var layerDefModel = layerDefinitionsCollection.get(m.id);
          if (layerDefModel) { // Also delete analyses associated with layers that are being deleted
            var nodeId = layerDefModel.get('source');
            var aDefModel = analysisDefinitionsCollection.findWhere({node_id: nodeId});
            if (aDefModel) {
              memo.push(aDefModel);
            }
          }

          return memo;
        }, [])
        .unique()
        .map(function (m) {
          return m.destroy();
        })
        .value());

      deleteOrphanedNodes();

      return promise;
    },

    saveLayer: function (layerDefModel) {
      if (!layerDefModel) throw new Error('layerDefModel is required');

      if (layerDefModel.isDataLayer()) {
        var nodeDefModel = layerDefModel.getAnalysisDefinitionNodeModel();
        analysisDefinitionsCollection.saveAnalysis(nodeDefModel);
      }

      return layerDefModel.save();
    }

  };
};

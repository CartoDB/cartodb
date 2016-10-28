var $ = require('jquery');
var _ = require('underscore');
var nodeIds = require('../value-objects/analysis-node-ids');
var MetricsTracker = require('../components/metrics/metrics-tracker');
var SimpleStyleDefaults = require('../editor/style/style-defaults/simple-style-defaults');
var camshaftReference = require('./camshaft-reference');
var layerTypesAndKinds = require('./layer-types-and-kinds');
var layerColors = require('./layer-colors');
var Notifier = require('../components/notifier/notifier');

/**
 * Coordinate side-effects done on explicit interactions.
 * @param {Object} params
 * @param {Object} params.userModel
 * @param {Object} params.analysisDefinitionsCollection
 * @param {Object} params.analysisDefinitionNodesCollection
 * @param {Object} params.widgetDefinitionsCollection
 * @return {Object} that contains all user-actions that the user may do related to a map
 */
module.exports = function (params) {
  if (!params.userModel) throw new Error('userModel is required');
  if (!params.analysisDefinitionsCollection) throw new Error('analysisDefinitionsCollection is required');
  if (!params.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
  if (!params.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
  if (!params.widgetDefinitionsCollection) throw new Error('widgetDefinitionsCollection is required');

  var userModel = params.userModel;
  var analysisDefinitionsCollection = params.analysisDefinitionsCollection;
  var analysisDefinitionNodesCollection = params.analysisDefinitionNodesCollection;
  var layerDefinitionsCollection = params.layerDefinitionsCollection;
  var widgetDefinitionsCollection = params.widgetDefinitionsCollection;

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

  var deleteOrphanedAnalyses = function () {
    analysisDefinitionNodesCollection
      .toArray()
      .forEach(function (nodeDefModel) {
        if (!layerDefinitionsCollection.anyContainsNode(nodeDefModel)) {
          nodeDefModel.destroy();
        }
      });

    analysisDefinitionsCollection
      .toArray()
      .forEach(function (analysisDefModel) {
        if (!analysisDefModel.getNodeDefinitionModel()) {
          analysisDefModel.destroy();
        }
      });
  };

  var restoreWidgetsFromLayer = function (affectedWidgets, layerDefModel, callback) {
    if (!affectedWidgets || !_.isArray(affectedWidgets)) throw new Error('affectedWidgets is required');
    if (!layerDefModel) throw new Error('layerDefModel is required');
    if (!callback) throw new Error('callback is required');

    var notification;
    var restoringError;
    var onWidgetFinished = _.after(affectedWidgets.length, function () {
      if (!restoringError) {
        notification.set({
          status: 'success',
          info: _t('notifications.widgets.restored'),
          closable: true
        });
      } else {
        Notifier.removeNotification(notification);
      }
      callback(layerDefModel);
    });

    if (affectedWidgets.length > 0) {
      notification = Notifier.addNotification({
        status: 'loading',
        info: _t('notifications.widgets.restoring'),
        closable: false
      });

      // Create widgets with new source and layer_id
      _.each(affectedWidgets, function (attrs) {
        attrs.layer_id = attrs.layer_id || layerDefModel.id;

        widgetDefinitionsCollection.create(
          attrs, {
            wait: true,
            success: onWidgetFinished,
            error: function (e, mdl) {
              notification = Notifier.addNotification({
                status: 'error',
                info: _t('notifications.widgets.error.title') +
                  _t('notifications.widgets.error.body', {
                    body: '',
                    error: mdl && mdl.get('title')
                  }),
                closable: true
              });
              restoringError = true;
              onWidgetFinished();
            }
          }
        );
      });
    } else {
      callback(layerDefModel);
    }
  };

  var resetStylesWhenGeometryChanges = function (nodeDefModel, layerDefModel, forceStyleUpdate) {
    var CHANGE_READY = 'change:ready';
    var onQueryGeometryReady;
    onQueryGeometryReady = function () {
      var queryGeometryModel = nodeDefModel.queryGeometryModel;
      if (queryGeometryModel.get('ready')) {
        queryGeometryModel.unbind(CHANGE_READY, onQueryGeometryReady);
      } else {
        return; // wait until ready
      }

      var CHANGE_STATUS = 'change:status';
      var saveDefaultStylesIfStillRelevant;
      saveDefaultStylesIfStillRelevant = function () {
        var unbindNodeChangeStatus = function () {
          queryGeometryModel.unbind(CHANGE_STATUS, saveDefaultStylesIfStillRelevant);
        };

        if (queryGeometryModel.isFetching()) { // Wait until fetched
          return;
        } else if (!queryGeometryModel.isFetching() && !queryGeometryModel.isFetched()) { // Node status has been resetted
          unbindNodeChangeStatus();
          return;
        } else { // Fetched!
          unbindNodeChangeStatus();
        }

        if ( // Only apply changes if:
          layerDefinitionsCollection.contains(layerDefModel) && // layer still exist
          layerDefModel.get('source') === nodeDefModel.id && // node is still the head of layer
          layerDefModel.styleModel.get('type') === 'none' || // layer have no styles applied
          forceStyleUpdate // we force the style update
        ) {
          var simpleGeometryType = queryGeometryModel.get('simple_geom');

          if (simpleGeometryType) {
            layerDefModel.styleModel.setDefaultPropertiesByType('simple', simpleGeometryType, true);
          } else {
            layerDefModel.styleModel.setDefaultPropertiesByType('none'); // fallback if there is no known geometry
          }

          layerDefModel.save();
        }
      };
      saveDefaultStylesIfStillRelevant();
      queryGeometryModel.bind(CHANGE_STATUS, saveDefaultStylesIfStillRelevant);
      queryGeometryModel.fetch();
    };
    nodeDefModel.queryGeometryModel.bind(CHANGE_READY, onQueryGeometryReady);
    onQueryGeometryReady();
  };

  return {
    saveAnalysis: function (analysisFormModel) {
      if (!analysisFormModel.isValid()) return;

      var nodeDefModel = analysisDefinitionNodesCollection.get(analysisFormModel.id);

      if (nodeDefModel) {
        nodeDefModel.USER_SAVED = true;
        analysisFormModel.updateNodeDefinition(nodeDefModel);
        var layerDefModel = layerDefinitionsCollection.findOwnerOfAnalysisNode(nodeDefModel);
        analysisDefinitionsCollection.saveAnalysisForLayer(layerDefModel);

        MetricsTracker.track('Modified analysis', {
          analysis: {
            id: analysisFormModel.attributes['id'],
            natural_id: analysisFormModel.attributes['id'],
            type: analysisFormModel.attributes['type']
          }
        });
      } else {
        nodeDefModel = analysisFormModel.createNodeDefinition(this); // delegate creation to the form, but expect it to call userActions.createAnalysisNode when done with its internal stuff
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

      layerDefModel.save({
        cartocss: camshaftReference.getDefaultCartoCSSForType(),
        source: nodeDefModel.id
      });
      analysisDefinitionsCollection.saveAnalysisForLayer(layerDefModel);

      MetricsTracker.track('Created analysis', {
        analysis: {
          id: nodeDefModel.attributes['id'],
          natural_id: nodeDefModel.attributes['id'],
          type: nodeDefModel.attributes['type']
        }
      });

      resetStylesWhenGeometryChanges(nodeDefModel, layerDefModel);

      return nodeDefModel;
    },

    saveAnalysisSourceQuery: function (query, nodeDefModel, layerDefModel) {
      if (!nodeDefModel) throw new Error('nodeDefModel is required');
      if (nodeDefModel.get('type') !== 'source') throw new Error('nodeDefModel must be a source node');

      nodeDefModel.set('query', query || '');

      analysisDefinitionsCollection.saveAnalysisForLayer(layerDefModel);
      layerDefModel.save(); // to make sure layer's source ref is persisted
    },

    saveWidgetOption: function (widgetOptionModel) {
      if (!widgetOptionModel) throw new Error('widgetOptionModel is required');

      if (widgetOptionModel.analysisDefinitionNodeModel()) { // Might not always have a node-definition, e.g. time-series none-option
        var layerDefModel = widgetOptionModel.layerDefinitionModel();
        analysisDefinitionsCollection.saveAnalysisForLayer(layerDefModel);
        layerDefModel.save(); // to make sure layer's source ref is persisted
      }

      return widgetOptionModel.save(widgetDefinitionsCollection); // delegate back to form model to decide how to save
    },

    saveWidget: function (widgetDefModel) {
      if (!widgetDefModel) throw new Error('widgetDefModel is required');

      var widgetLayerId = widgetDefModel.get('layer_id');
      layerDefinitionsCollection.some(function (layerDefModel) {
        if (layerDefModel.id === widgetLayerId) {
          analysisDefinitionsCollection.saveAnalysisForLayer(layerDefModel);
          layerDefModel.save(); // to make sure layer's source ref is persisted
          return true; // aborts the "some"-iterator
        }
      });

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
      analysisDefinitionsCollection.saveAnalysisForLayer(layerDefModel);

      MetricsTracker.track('Deleted analysis', {
        analysis: {
          id: nodeDefModel.attributes['id'],
          natural_id: nodeDefModel.attributes['id'],
          type: nodeDefModel.attributes['type']
        }
      });

      resetStylesWhenGeometryChanges(primarySourceNode, layerDefModel);

      deleteOrphanedAnalyses();
    },

    /**
     * Create a new layer for a given table name
     * @param {model} [tableModel]
     * @param {object} [options]
     * @param {number} [options.at]
     */
    createLayerFromTable: function (tableModel, options) {
      options = options || {};

      var tableName = tableModel.getUnqualifiedName();
      var ownerName = tableModel.getOwnerName();
      var tableGeometry = tableModel.getGeometryType() && tableModel.getGeometryType()[0];

      // Setting at assumes there to be at least one non-basemap layer
      var at = options.at || layerDefinitionsCollection.length;
      var layerOnTop = layerDefinitionsCollection.getLayerOnTop();
      var layerOnTopPos = layerDefinitionsCollection.indexOf(layerOnTop);
      var hasTorque = layerDefinitionsCollection.isThereAnyTorqueLayer();
      var hasLabels = layerOnTop &&
        !layerTypesAndKinds.isCartoDBType(layerOnTop.get('type')) &&
        !layerTypesAndKinds.isTorqueType(layerOnTop.get('type'));

      if (hasTorque || hasLabels) {
        layerOnTop.set('order', layerOnTopPos + 1); // persisted on collection.save in success callback below

        if (hasLabels) { at--; }
        if (hasTorque) { at--; }
      }

      var newLetter = layerDefinitionsCollection.nextLetter();
      var attrs = createDefaultCartoDBAttrs();
      attrs.letter = newLetter;
      attrs.options.table_name = tableName;
      if (ownerName) {
        attrs.options.user_name = ownerName;
      }

      if (tableGeometry) {
        attrs.options.style_properties = {
          type: 'simple',
          properties: SimpleStyleDefaults.generateAttributes(tableGeometry)
        };
      }

      return layerDefinitionsCollection.create(attrs, {
        wait: true,
        at: at,
        error: options.error,
        success: function () {
          layerDefinitionsCollection.each(function (layerDefModel) {
            if (!layerDefModel.isDataLayer()) return;
            if (analysisDefinitionsCollection.findAnalysisForLayer(layerDefModel)) return;

            analysisDefinitionsCollection.saveAnalysisForLayer(layerDefModel);
          });
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
      var userMaxLayers = userModel.get('limits').max_layers;
      if (layerDefinitionsCollection.getNumberOfDataLayers() >= userMaxLayers) {
        var err = new Error('max layers reached');
        err.userMaxLayers = userMaxLayers;
        throw err;
      }

      var nodeDefModel = analysisDefinitionNodesCollection.get(nodeId);
      if (!nodeDefModel) throw new Error('node with id ' + nodeId + ' does not exist');
      if (!cfg) throw new Error('cfg is required');
      if (isNaN(cfg.at) || cfg.at <= 0) throw new Error('cfg.at must be on top of the base layer');

      var newPosition = cfg.at;

      var attrs;
      var tableName;
      var tableNameAlias;
      var ownerName;
      var newLetter = layerDefinitionsCollection.nextLetter();
      var affectedWidgetAttrsBySourceChange = [];

      var onNewLayerSaved = function (layer) {
        resetStylesWhenGeometryChanges(layer.getAnalysisDefinitionNodeModel(), layer, true);
        layerDefinitionsCollection.save(); // to persist layers order
      };

      var prevLayer = layerDefinitionsCollection.findWhere({source: nodeId});
      if (prevLayer) {
        if (nodeDefModel.hasPrimarySource()) {
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

          // Change identity of prevLayer (A) so it appears as the new layer (B), including its analysis
          var renamedNodeId = newLetter + '1';
          var renamedNodeDefModel = nodeDefModel.clone(renamedNodeId); // e.g. A3 => B1
          analysisDefinitionNodesCollection.invoke('changeSourceIds', nodeId, renamedNodeId);

          // We have to manage all widgets associated with the layer due to the operations we do
          // creating a new one and managing the previous one
          var prevLayerNodeIds = _.pluck(prevLayer.ownedPrimaryAnalysisNodes(), 'id');
          var affectedWidgetsBySourceChange = widgetDefinitionsCollection.filter(function (widgetDefModel) {
            return _.contains(prevLayerNodeIds, widgetDefModel.get('source'));
          });

          _.each(affectedWidgetsBySourceChange, function (widgetDefModel) {
            var attrs;
            var widgetSourceId = widgetDefModel.get('source');

            // If this widget doesn't point to the "dragged" node, it will
            // keep the source but the layer_id will be totally different
            if (widgetSourceId !== nodeId) {
              attrs = _.extend(
                _.omit(widgetDefModel.toJSON(), 'id', 'layer_id', 'order'),
                {
                  avoidNotification: true
                }
              );
            } else {
              // On the other hand, if there is a widget pointing to the dragged node,
              // it will keep the layer_id but the source will be different
              attrs = _.extend(
                _.omit(widgetDefModel.toJSON(), 'id', 'source', 'order'),
                {
                  source: {
                    id: renamedNodeId
                  },
                  avoidNotification: true
                }
              );
            }

            affectedWidgetAttrsBySourceChange.push(attrs);
            widgetDefModel.attributes.avoidNotification = true;
            widgetDefModel.destroy();
          });

          prevLayer.save({
            letter: newLetter,
            color: layerColors.getColorForLetter(newLetter),
            source: renamedNodeId
          });

          analysisDefinitionsCollection.newAnalysisForNode(renamedNodeDefModel); // will be saved by saveAnalysisForLayer later since containing that layer's node

          // Remove prevLayer (A) temporarily, to move the layers to expected positions
          layerDefinitionsCollection.remove(prevLayer, {silent: true}); // silent to avoid unwanted side-effects; re-added again later

          // New layer takes over the identity of the old layer (A), and its primary source as its head node
          tableName = prevLayer.get('table_name');
          tableNameAlias = prevLayer.get('table_name_alias');
          ownerName = prevLayer.get('user_name');
          attrs = createDefaultCartoDBAttrs();
          attrs.options = _.extend({}, attrs.options, {
            sql: 'SELECT * FROM ' + tableName,
            table_name: tableName,
            table_name_alias: tableNameAlias,
            letter: prevLetter,
            color: layerColors.getColorForLetter(prevLetter),
            source: nodeDefModel.getPrimarySource().id
          });
          if (ownerName) {
            attrs.options.user_name = ownerName;
          }
          var newLayerDefModel = layerDefinitionsCollection.add(attrs, {at: prevOrder});
          analysisDefinitionsCollection.saveAnalysisForLayer(newLayerDefModel);

          // Re-add source layer again, but after the new layer was created and before layer is getting saved
          layerDefinitionsCollection.add(prevLayer, {at: newPosition});

          // Reset styles from previous layer
          resetStylesWhenGeometryChanges(prevLayer.getAnalysisDefinitionNodeModel(), prevLayer, true);

          newLayerDefModel.save(null, {
            success: function () {
              restoreWidgetsFromLayer(affectedWidgetAttrsBySourceChange, newLayerDefModel, onNewLayerSaved);
            },
            error: function () {
              Notifier.addNotification({
                status: 'error',
                info: _t('notifications.layer.error'),
                closable: true
              });
            }
          });
          nodeDefModel.destroy(); // replaced by new node
        } else {
          // Node is the source of a prevLayer
          // Create a new layer which simply points to that source
          //   _______       _______   ______
          //  | A    |      | A    |  | B    |
          //  |      |      |      |  |      |
          //  | [A0] |  =>  | [A0] |  | [A0] |
          //  |______|      |______|  |______|
          tableName = prevLayer.get('table_name');
          tableNameAlias = prevLayer.get('table_name_alias');
          ownerName = prevLayer.get('user_name');
          attrs = createDefaultCartoDBAttrs();
          attrs.options = _.extend({}, attrs.options, {
            sql: 'SELECT * FROM ' + tableName,
            table_name: tableName,
            table_name_alias: tableNameAlias,
            letter: newLetter,
            color: layerColors.getColorForLetter(newLetter),
            source: nodeId
          });
          if (ownerName) {
            attrs.options.user_name = ownerName;
          }
          newLayerDefModel = layerDefinitionsCollection.create(attrs, {
            at: newPosition,
            success: function () {
              onNewLayerSaved(newLayerDefModel);
            },
            error: function () {
              Notifier.addNotification({
                status: 'error',
                info: _t('notifications.layer.error'),
                closable: true
              });
            }
          });
        }
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
          var affectedWidgetsBySourceChange = widgetDefinitionsCollection.where({ source: oldNode.id });

          analysisDefinitionNodesCollection.invoke('changeSourceIds', oldNode.id, newId);

          _.each(affectedWidgetsBySourceChange, function (m) {
            // Store attrs from affected widget for creating a new
            // instance when layer is created
            affectedWidgetAttrsBySourceChange.push(
              _.extend(
                _.omit(m.toJSON(), 'id', 'layer_id', 'source', 'order'),
                {
                  avoidNotification: true,
                  source: {
                    id: newId
                  }
                }
              )
            );

            // Destroy widgets pointing to that source until new layer is created
            m.attributes.avoidNotification = true;
            m.destroy();
          });

          return newNode;
        };
        var newLayerHeadNode = moveNode(linkedNodesList[0]);
        _.rest(linkedNodesList).forEach(moveNode);

        // Create the new layer (B)
        var ownerLayer = layerDefinitionsCollection.findOwnerOfAnalysisNode(nodeDefModel);
        tableName = ownerLayer.get('table_name');
        tableNameAlias = ownerLayer.get('table_name_alias');
        ownerName = ownerLayer.get('user_name');
        attrs = createDefaultCartoDBAttrs();
        attrs.options = _.extend({}, attrs.options, {
          sql: 'SELECT * FROM ' + tableName,
          table_name: tableName,
          table_name_alias: tableNameAlias,
          letter: newLetter,
          color: layerColors.getColorForLetter(newLetter),
          source: newLayerHeadNode.id
        });
        if (ownerName) {
          attrs.options.user_name = ownerName;
        }
        newLayerDefModel = layerDefinitionsCollection.create(attrs, {
          at: newPosition,
          success: function () {
            restoreWidgetsFromLayer(affectedWidgetAttrsBySourceChange, newLayerDefModel, onNewLayerSaved);
          },
          error: function () {
            Notifier.addNotification({
              status: 'error',
              info: _t('notifications.layer.error'),
              closable: true
            });
          }
        });
        analysisDefinitionsCollection.saveAnalysisForLayer(newLayerDefModel);
        nodeDefModel.destroy(); // replaced by new node
      }

      deleteOrphanedAnalyses();
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
            return analysisDefinitionsCollection.saveAnalysisForLayer(layerDefModel);
          }
        })
        .compact()
        .value();

      $.when.apply($, saveAnalysisPromises).done(function () { // http://api.jquery.com/jQuery.when/
        layerDefinitionsCollection.save({
          success: function () {
            layerDefinitionsCollection.trigger('layerMoved', movingLayer);
          }
        });
      });
    },

    deleteLayer: function (id) {
      var layerToDelete = layerDefinitionsCollection.get(id);
      if (!layerToDelete.canBeDeletedByUser()) return;

      var parentLayer;
      var toDestroy = [];

      // Iterate over each node in the list, to decide how to remove dependent objects or fold nodes (if possible)
      // under another layer's linked nodes list.
      var linkedNodesList = layerToDelete.ownedPrimaryAnalysisNodes();
      var nodeDefModel;

      for (var i = 0; i < linkedNodesList.length; i++) {
        nodeDefModel = linkedNodesList[i];

        parentLayer = layerDefinitionsCollection.findPrimaryParentLayerToAnalysisNode(nodeDefModel, {exclude: toDestroy});

        // No parent layer? delete all dependent objects, since can't move current nodeDefModel elsewhere
        if (!parentLayer) {
          toDestroy.push(nodeDefModel);

          layerDefinitionsCollection.each(function (layer) {
            if (layer.containsNode(nodeDefModel)) {
              if (!_.contains(toDestroy, layer)) {
                toDestroy.push(layer);
              }

              widgetDefinitionsCollection.each(function (widget) {
                if (!_.contains(toDestroy, widget) && widget.containsNode(nodeDefModel)) {
                  toDestroy.unshift(widget);
                }
              });
            }
          });

          continue; // to process all sequent nodes in the linekd list, and their (possibly) dependent objects
        }

        var newParentLinkedNodesList = parentLayer
          .ownedPrimaryAnalysisNodes()
          .concat(nodeDefModel.linkedListBySameLetter());

        // Since will reassign ids from the start of list need to calculate which sequence id to start on
        var idSequence = newParentLinkedNodesList.length;
        var firstSequence = nodeIds.sequence(newParentLinkedNodesList[0].id);

        // If first node has a higher sequence start from that one to avoid issues on renaming nodes
        if (idSequence <= firstSequence) {
          idSequence = firstSequence;
        }

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

          // Update any depending objects' source
          analysisDefinitionNodesCollection.each(function (m) {
            if (!_.contains(toDestroy, m)) {
              m.changeSourceIds(oldNodeId, newId);
            }
          });
          var maybeUpdateSource = function (m) {
            if (m.get('source') === oldNodeId && !_.contains(toDestroy, m)) {
              m.save({source: newId});
            }
          };
          layerDefinitionsCollection.each(maybeUpdateSource);
          widgetDefinitionsCollection.each(maybeUpdateSource);

          prevId = newId;

          return node;
        };
        var newParentLayerNode = moveNodeToParentLayer(newParentLinkedNodesList[0]);
        _.rest(newParentLinkedNodesList).forEach(moveNodeToParentLayer);

        parentLayer.save({source: newParentLayerNode.id});

        break; // since the remaining nodes have been move to a parent layer
      }

      if (!_.contains(toDestroy, layerToDelete)) {
        toDestroy.push(layerToDelete);
      }

      var promise = $.when.apply($, // http://api.jquery.com/jQuery.when/
        _.chain(toDestroy)
          .reduce(function (memo, m) {
            memo.push(m);
            var layerDefModel = layerDefinitionsCollection.get(m.id);
            if (layerDefModel) { // Also delete analyses associated with layers that are being deleted
              var aDefModel = analysisDefinitionsCollection.findAnalysisForLayer(layerDefModel);
              if (aDefModel) {
                memo.push(aDefModel);
              }
            }

            return memo;
          }, [])
          .unique()
          .map(function (m) {
            m.set({avoidNotification: true}, {silent: true});
            return m.destroy();
          })
          .value());

      if (parentLayer) {
        analysisDefinitionsCollection.saveAnalysisForLayer(parentLayer);
      }
      deleteOrphanedAnalyses();

      return promise;
    },

    /**
     * E.g. for styles, infowindows etc.
     * @param {object} layerDefModel - layer-definition-model
     */
    saveLayer: function (layerDefModel) {
      if (!layerDefModel) throw new Error('layerDefModel is required');

      if (layerDefModel.isDataLayer()) {
        analysisDefinitionsCollection.saveAnalysisForLayer(layerDefModel);
      }

      deleteOrphanedAnalyses();

      return layerDefModel.save();
    }

  };
};

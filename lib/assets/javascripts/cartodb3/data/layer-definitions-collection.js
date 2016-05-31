var _ = require('underscore');
var Backbone = require('backbone');
var LayerDefinitionModel = require('./layer-definition-model');
var layerLetters = require('./layer-letters');
var nodeIds = require('./analysis-definition-node-ids.js');
var camshaftReference = require('./camshaft-reference');
var layerTypesAndKinds = require('./layer-types-and-kinds');

/**
 * Collection of layer definitions
 */
module.exports = Backbone.Collection.extend({

  /**
   * Intended to be called from entry point, to make sure initial layers are taken into account
   */
  resetByLayersData: function (layersData) {
    this.reset(layersData, {
      silent: true,
      initialLetters: _.chain(layersData)
        .pluck('options')
        .pluck('letter')
        .compact()
        .value()
    });
  },

  comparator: function (m) {
    return m.get('order');
  },

  model: function (d, opts) {
    var self = opts.collection;

    // Add data required for new editor if not set (e.g. a vis created on old editor doesn't contain letter and source)
    var o = _.clone(d.options) || {};
    var attrs = _.defaults(
      { options: o },
      _.omit(d, ['options']
    ));

    if (attrs.order !== 0) {
      // Only for non-basemap layers
      o.letter = o.letter || layerLetters.next(self._letters(opts.initialLetters));
    }

    if (o.table_name) {
      // Create source attr if it does not already exist
      var sourceId = nodeIds.next(o.letter);
      o.source = o.source || sourceId;
      o.query = o.query || 'SELECT * FROM ' + o.table_name;

      // Add analysis definition unless already existing
      self._analysisDefinitionNodesCollection.add({
        id: sourceId,
        type: 'source',
        options: {
          table_name: o.table_name
        },
        params: {
          query: o.query
        }
      });
    }

    var m = new LayerDefinitionModel(attrs, {
      parse: true, // make sure data is structured as expected
      collection: self,
      configModel: self._configModel
    });

    return m;
  },

  initialize: function (models, options) {
    if (!options.configModel) throw new Error('configModel is required');
    if (!options.analysisDefinitionsCollection) throw new Error('analysisDefinitionsCollection is required');
    if (!options.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
    if (!options.mapId) throw new Error('mapId is required');

    this._configModel = options.configModel;
    this._analysisDefinitionsCollection = options.analysisDefinitionsCollection;
    this._analysisDefinitionNodesCollection = options.analysisDefinitionNodesCollection;

    this.mapId = options.mapId;

    this.on('sync', this._onSync, this);
    this.on('remove', this._onLayerRemoved, this);

    this._analysisDefinitionNodesCollection.on('remove', this._onAnalysisDefinitionNodeRemoved, this);
  },

  url: function () {
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/v1/maps/' + this.mapId + '/layers';
  },

  parse: function (r) {
    return r.layers;
  },

  createLayerForTable: function (tableName, options) {
    options = options || {};
    var order = 0;
    var layerOnTop = this.last();
    if (layerOnTop) {
      order = layerOnTop.get('order');
      if (layerTypesAndKinds.isCartoDBType(layerOnTop.get('type'))) {
        order += 1; // Layer is placed on top
      } else if (layerTypesAndKinds.isTorqueType(layerOnTop.get('type')) || layerTypesAndKinds.isTiledType(layerOnTop.get('type'))) {
        layerOnTop.set('order', order + 1); // Layer that was on top is kept on top
      }
    }

    var attrs = {
      order: order,
      options: {
        type: 'CartoDB',
        table_name: tableName,
        interactivity: '',
        query: 'SELECT * FROM ' + tableName,
        tile_style: camshaftReference.getDefaultCartoCSSForType(),
        cartocss: camshaftReference.getDefaultCartoCSSForType(),
        style_version: '2.1.1',
        tooltip: {},
        infowindow: {},
        visible: true
      }
    };

    return this.create(attrs, {
      wait: true,
      success: function () {
        if (layerOnTop && layerOnTop.hasChanged()) {
          layerOnTop.save();
        }
        options.success && options.success();
      },
      error: function () {
        options.error && options.error();
      }
    });
  },

  createNewAnalysisNode: function (nodeAttrs) {
    var nodeDefModel = this._analysisDefinitionNodesCollection.add(nodeAttrs, {parse: false});
    var sourceNode = nodeDefModel.getPrimarySource();

    var analysisDefinitionModel = this._analysisDefinitionsCollection.findByNodeId(sourceNode.id);
    if (analysisDefinitionModel) {
      analysisDefinitionModel.save({node_id: nodeDefModel.id});
    } else {
      this._createAnalysisDefinition(nodeDefModel);
    }

    return nodeDefModel;
  },

  findAnalysisDefinitionNodeModel: function (id) {
    return this._analysisDefinitionNodesCollection.get(id);
  },

  getAnalysisDefinitionNodesCollection: function () {
    return this._analysisDefinitionNodesCollection;
  },

  isThereAnyTorqueLayer: function () {
    return this.any(function (m) {
      return m.get('type') === 'torque';
    });
  },

  _onSync: function (layerDefModel) {
    // Create analysis definition if there is none yet
    var nodeDefModel = layerDefModel.getAnalysisDefinitionNodeModel();
    var analysisDefCollection = this._analysisDefinitionsCollection;
    if (nodeDefModel && !analysisDefCollection.findByNodeId(nodeDefModel.id)) {
      this._createAnalysisDefinition(nodeDefModel);
    }
  },

  _createAnalysisDefinition: function (nodeDefModel) {
    this._analysisDefinitionsCollection.create({analysis_definition: nodeDefModel.toJSON()});
  },

  _onLayerRemoved: function (layerDefModel) {
    _.clone(this._analysisDefinitionNodesCollection.models).forEach(function (nodeDefModel) {
      if (layerDefModel.isOwnerOfAnalysisNode(nodeDefModel)) {
        nodeDefModel.destroy();
      }
    });
  },

  _onAnalysisDefinitionNodeRemoved: function (removedNodeDefModel) {
    _.clone(this.models).forEach(function (layerDefModel) {
      if (layerDefModel.isOwnerOfAnalysisNode(removedNodeDefModel)) {
        // If the removed node is not contained in the current node it's because it's orphaned, so nothing to update
        if (!layerDefModel.getAnalysisDefinitionNodeModel().containsNode(removedNodeDefModel)) return;

        var primarySourceNodeDefModel = removedNodeDefModel.getPrimarySource();
        if (primarySourceNodeDefModel) {
          layerDefModel.save({source: primarySourceNodeDefModel.id});
        } else {
          layerDefModel.destroy(); // since there is no source for the owned layer anymore
        }
      } else {
        // this layer doesn't own the removed node, but delete it if it depends on the removed node
        var nodeDefModel = layerDefModel.getAnalysisDefinitionNodeModel();
        if (nodeDefModel && nodeDefModel.containsNode(removedNodeDefModel)) {
          layerDefModel.destroy();
        }
      }
    }, this);

    this._deleteOrphanedNodes();
  },

  _deleteOrphanedNodes: function () {
    _.clone(this._analysisDefinitionNodesCollection.models).forEach(function (nodeDefModel) {
      if (this._isNodeOrphaned(nodeDefModel)) {
        nodeDefModel.destroy();
      }
    }, this);
  },

  _isNodeOrphaned: function (nodeDefModel) {
    return !this._isUsedByAnyAnalysis(nodeDefModel) && !this._isSourceOfAnyLayer(nodeDefModel);
  },

  _isUsedByAnyAnalysis: function (nodeDefModel) {
    return this._analysisDefinitionsCollection.any(function (analysisDefModel) {
      return analysisDefModel.containsNode(nodeDefModel);
    });
  },

  _isSourceOfAnyLayer: function (nodeDefModel) {
    return this.any(function (layerDefModel) {
      return layerDefModel.get('source') === nodeDefModel.id;
    });
  },

  _letters: function (otherLetters) {
    var lettersFromAddedModels = _.compact(this.pluck('letter'));

    // When adding multiple items the models created so far are stored in the internal object this._byId,
    // need to make sure to take them into account when returning already taken letters.
    var lettersFromModelsNotYetAdded = _.chain(this._byId).values().invoke('get', 'letter').value();

    return _.union(lettersFromAddedModels, lettersFromModelsNotYetAdded, otherLetters);
  }

});

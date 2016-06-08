var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var LayerDefinitionModel = require('./layer-definition-model');
var layerLetters = require('./layer-letters');
var nodeIds = require('../value-objects/analysis-node-ids');
var camshaftReference = require('./camshaft-reference');
var layerTypesAndKinds = require('./layer-types-and-kinds');

/**
 * Collection of layer definitions
 */
module.exports = Backbone.Collection.extend({

  initialize: function (models, options) {
    if (!options.configModel) throw new Error('configModel is required');
    if (!options.analysisDefinitionsCollection) throw new Error('analysisDefinitionsCollection is required');
    if (!options.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
    if (!options.mapId) throw new Error('mapId is required');
    if (!options.basemaps) throw new Error('basemaps is required');

    this._configModel = options.configModel;
    this._analysisDefinitionsCollection = options.analysisDefinitionsCollection;
    this._analysisDefinitionNodesCollection = options.analysisDefinitionNodesCollection;
    this._basemaps = options.basemaps;

    this.mapId = options.mapId;

    this.on('sync', this._onSync, this);
    this.on('add', this._onLayerAdded, this);
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

  add: function (models, options) {
    return Backbone.Collection.prototype.add.apply(this, arguments);
  },

  moveLayer: function (options) {
    var from = options.from;
    var to = options.to;

    var movingLayer = this.at(from);
    this.remove(movingLayer, { silent: true });
    this.add(movingLayer, { at: to, parse: false, silent: true });
    this._resetOrders();
    this.save({
      success: function () {
        this.trigger('layerMoved', movingLayer, to, this);
      }.bind(this),
      error: function () {
        // TODO: If there is any error, we should use the main notificator
        // in order to notify the user
      }
    });
  },

  _resetOrders: function () {
    this.each(function (layerDefModel, index) {
      layerDefModel.set('order', index, { silent: true });
    });
  },

  save: function (options) {
    var promises = this.chain()
      .map(function (layerDefModel) {
        return this._createAnalysisDefinition(layerDefModel.getAnalysisDefinitionNodeModel());
      }, this)
      .compact()
      .value();

    $.when.apply($, promises).done(function () {
      Backbone.sync('update', this, options);
    }.bind(this));
  },

  toJSON: function () {
    return {
      layers: Backbone.Collection.prototype.toJSON.apply(this, arguments)
    };
  },

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

    var parseAttrs = typeof opts.parse === 'boolean' ? opts.parse : true;
    var m = new LayerDefinitionModel(attrs, {
      parse: parseAttrs,
      collection: self,
      configModel: self._configModel
    });

    return m;
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
        visible: true
      },
      tooltip: {},
      infowindow: {}
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
    this._createAnalysisDefinition(layerDefModel.getAnalysisDefinitionNodeModel());
  },

  _createAnalysisDefinition: function (nodeDefModel) {
    if (nodeDefModel && !this._analysisDefinitionsCollection.findByNodeId(nodeDefModel.id)) {
      return this._analysisDefinitionsCollection.create({analysis_definition: nodeDefModel.toJSON()});
    }
  },

  _onLayerAdded: function (layerDefModel) {
    this._resetOrders();
  },

  _onLayerRemoved: function (layerDefModel) {
    this._resetOrders();

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
  },

  setBaseLayer: function (newBaseLayerAttrs) {
    newBaseLayerAttrs = _.clone(newBaseLayerAttrs);

    if (this.isBaseLayerAdded(newBaseLayerAttrs)) {
      return false;
    }

    if (this._hasBaseLayer()) {
      this._updateBaseLayer(newBaseLayerAttrs);
    } else {
      this._createBaseLayer(newBaseLayerAttrs);
    }

    var newBaseLayerHasLabels = newBaseLayerAttrs.labels && newBaseLayerAttrs.labels.url;
    if (newBaseLayerHasLabels) {
      if (this._hasLabelsLayer()) {
        this._updateLabelsLayer(newBaseLayerAttrs);
      } else {
        this._addLabelsLayer(newBaseLayerAttrs);
      }
    } else {
      if (this._hasLabelsLayer()) {
        this._destroyLabelsLayer();
      }
    }
  },

  isBaseLayerAdded: function (layer) {
    var me = this.getBaseLayer().toJSON();
    var other = layer;

    var myType = me.type ? me.type : me.options.type;
    var itsType = other.type ? other.type : other.options.type;

    if (layerTypesAndKinds.isTiledType(myType) && myType === itsType) {
      var myTemplate = me.urlTemplate ? me.urlTemplate : me.options.urlTemplate;
      var itsTemplate = other.urlTemplate ? other.urlTemplate : other.options.urlTemplate;
      var myName = me.name ? me.name : me.options.name;
      var itsName = other.name ? other.name : other.options.name;

      return myTemplate === itsTemplate && myName === itsName;
    }

    return false;
  },

  getBaseLayer: function () {
    return this.first();
  },

  getLayerOnTop: function () {
    return this.last();
  },

  _updateBaseLayer: function (newBaseLayerAttrs) {
    var currentBaseLayer = this.getBaseLayer();
    currentBaseLayer.save(_.omit(newBaseLayerAttrs, ['id', 'order']));
  },

  _createBaseLayer: function (newBaseLayerAttrs) {
    var optionsAttribute = {};

    // TODO: Is this really necessary?
    if (layerTypesAndKinds.isPlainType(newBaseLayerAttrs.type)) {
      optionsAttribute = _.pick(newBaseLayerAttrs, ['type', 'color', 'image', 'maxZoom', 'category']);
    } else if (layerTypesAndKinds.isTiledType(newBaseLayerAttrs.type)) {
      optionsAttribute = _.pick(newBaseLayerAttrs, ['type', 'urlTemplate', 'subdomains', 'minZoom', 'maxZoom', 'name', 'className', 'attribution', 'category']);
    } else {
      // TODO: Should we add more types here?
    }

    newBaseLayerAttrs = _.extend(newBaseLayerAttrs, {
      order: 0,
      options: optionsAttribute,
      tooltip: {},
      infowindow: {}
    });

    return this.create(newBaseLayerAttrs, {
      at: 0,
      wait: true,
      success: function () {
        // TODO: Do something?
      },
      error: function () {
        // TODO: Do something?
      }
    });
  },

  _hasBaseLayer: function () {
    var baseLayer = this.getBaseLayer();
    return baseLayer && layerTypesAndKinds.isTiledType(baseLayer.get('type'));
  },

  _hasLabelsLayer: function () {
    return this.size() > 1 && layerTypesAndKinds.isTiledType(this.getLayerOnTop().get('type'));
  },

  _updateLabelsLayer: function (newBaseLayerAttrs) {
    var labelsLayer = this.getLayerOnTop();
    var labelsLayerAttrs = _.extend(newBaseLayerAttrs, {
      name: this._labelsLayerNameFromLayer(newBaseLayerAttrs),
      urlTemplate: newBaseLayerAttrs.labels.url
    });
    labelsLayer.save(labelsLayerAttrs);
  },

  _addLabelsLayer: function (newBaseLayerAttrs) {
    var optionsAttribute = _.pick(newBaseLayerAttrs, ['type', 'subdomains', 'minZoom', 'maxZoom', 'name', 'className', 'attribution', 'category']);
    optionsAttribute = _.extend(optionsAttribute, {
      urlTemplate: newBaseLayerAttrs.labels.url
    });

    var labelsLayerAttrs = {
      name: this._labelsLayerNameFromLayer(newBaseLayerAttrs),
      order: this.getLayerOnTop().get('order') + 1,
      options: optionsAttribute,
      tooltip: {},
      infowindow: {}
    };

    this.create(labelsLayerAttrs);
  },

  _destroyLabelsLayer: function () {
    this.getLayerOnTop().destroy();
  },

  _labelsLayerNameFromLayer: function (layer) {
    return layer.name + ' Labels';
  }
});

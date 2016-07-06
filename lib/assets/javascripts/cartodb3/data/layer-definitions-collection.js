var _ = require('underscore');
var Backbone = require('backbone');
var LayerDefinitionModel = require('./layer-definition-model');
var layerLetters = require('./layer-letters');
var layerColors = require('./layer-colors');
var nodeIds = require('../value-objects/analysis-node-ids');
var layerTypesAndKinds = require('./layer-types-and-kinds');

/**
 * Collection of layer definitions
 */
module.exports = Backbone.Collection.extend({

  initialize: function (models, options) {
    if (!options.configModel) throw new Error('configModel is required');
    if (!options.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
    if (!options.mapId) throw new Error('mapId is required');

    this._configModel = options.configModel;
    this._analysisDefinitionNodesCollection = options.analysisDefinitionNodesCollection;

    this.mapId = options.mapId;
  },

  url: function () {
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/v1/maps/' + this.mapId + '/layers';
  },

  parse: function (r) {
    return r.layers;
  },

  save: function (options) {
    this.each(function (layerDefModel, index) {
      layerDefModel.set('order', index, { silent: true });
    });
    Backbone.sync('update', this, options);
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

    if (!isNaN(opts.at)) {
      attrs.options.order = opts.at;
    }

    if (layerTypesAndKinds.isKindDataLayer(attrs.kind)) {
      o.letter = o.letter || layerLetters.next(self._takenLetters(opts.initialLetters));
      o.color = o.color || layerColors.getColorForLetter(o.letter);

      // Create source attr if it does not already exist
      var sourceId = nodeIds.next(o.letter);

      if (o.table_name && (!o.source || o.source === sourceId)) {
        o.source = o.source || sourceId;
        o.query = o.query || 'SELECT * FROM ' + o.table_name;

        // Add analysis definition unless already existing
        self._analysisDefinitionNodesCollection.createSourceNode({
          id: sourceId,
          tableName: o.table_name,
          query: o.query
        });
      }
    }

    var parseAttrs = typeof opts.parse === 'boolean' ? opts.parse : true;
    var m = new LayerDefinitionModel(attrs, {
      parse: parseAttrs,
      collection: self,
      configModel: self._configModel
    });

    return m;
  },

  nextLetter: function () {
    return layerLetters.next(this._takenLetters());
  },

  findAnalysisDefinitionNodeModel: function (id) {
    return this._analysisDefinitionNodesCollection.get(id);
  },

  findOwnerOfAnalysisNode: function (nodeDefModel) {
    return this.find(function (layerDefModel) {
      return layerDefModel.isOwnerOfAnalysisNode(nodeDefModel);
    });
  },

  findPrimaryParentLayerToAnalysisNode: function (nodeDefModel, opts) {
    if (!nodeDefModel) return;

    opts = opts || {};
    if (!_.isArray(opts.exclude)) {
      opts.exclude = [opts.exclude];
    }
    var owner = this.findOwnerOfAnalysisNode(nodeDefModel);

    return this.find(function (layerDefModel) {
      if (layerDefModel === owner) return;
      if (_.contains(opts.exclude, layerDefModel)) return;

      var layerHeadNode = layerDefModel.getAnalysisDefinitionNodeModel();
      if (!layerHeadNode) return;

      return _.last(layerHeadNode.linkedListBySameLetter())
        .getPrimarySource() === nodeDefModel;
    });
  },

  isThereAnyTorqueLayer: function () {
    return this.any(function (m) {
      return layerTypesAndKinds.isTorqueType(m.get('type'));
    });
  },

  isThereAnyCartoDBLayer: function () {
    return this.any(function (m) {
      return layerTypesAndKinds.isCartoDBType(m.get('type'));
    });
  },

  anyContainsNode: function (nodeDefModel) {
    return this.any(function (layerDefModel) {
      return layerDefModel.containsNode(nodeDefModel);
    });
  },

  getNumberOfDataLayers: function () {
    return this.select(function (m) {
      return layerTypesAndKinds.isCartoDBType(m.get('type')) ||
        layerTypesAndKinds.isTorqueType(m.get('type'));
    }).length;
  },

  _takenLetters: function (otherLetters) {
    var valuesFromAddedModels = _.compact(this.pluck('letter'));

    // When adding multiple items the models created so far are stored in the internal object this._byId,
    // need to make sure to take them into account when returning already taken letter.
    var valuesFromModelsNotYetAdded = _.chain(this._byId).values().invoke('get', 'letter').value();

    return _.union(valuesFromAddedModels, valuesFromModelsNotYetAdded, otherLetters);
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
    newBaseLayerAttrs = _.extend(newBaseLayerAttrs, {
      order: 0,
      tooltip: {},
      infowindow: {}
    });

    return this.create(newBaseLayerAttrs, {
      at: 0,
      wait: true
    });
  },

  _hasBaseLayer: function () {
    var baseLayer = this.getBaseLayer();
    return baseLayer;
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

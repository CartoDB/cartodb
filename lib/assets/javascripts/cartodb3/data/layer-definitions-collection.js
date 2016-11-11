var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var LayerDefinitionModel = require('./layer-definition-model');
var layerLetters = require('./layer-letters');
var layerColors = require('./layer-colors');
var nodeIds = require('../value-objects/analysis-node-ids');
var layerTypesAndKinds = require('./layer-types-and-kinds');
var Utils = require('../helpers/utils');

/**
 * Collection of layer definitions
 */
module.exports = Backbone.Collection.extend({

  initialize: function (models, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
    if (!opts.mapId) throw new Error('mapId is required');

    this._configModel = opts.configModel;
    this.userModel = opts.userModel;
    this._analysisDefinitionNodesCollection = opts.analysisDefinitionNodesCollection;
    this.mapId = opts.mapId;
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
        var tableName = o.table_name;

        if (o.table_name.search(/\./i) === -1 && o.user_name && self._configModel.get('user_name') !== o.user_name) {
          tableName = '"' + o.user_name + '".' + Utils.safeTableNameQuoting(o.table_name);
        }

        o.source = o.source || sourceId;
        o.query = o.query || 'SELECT * FROM ' + Utils.safeTableNameQuoting(tableName);

        // Add analysis definition unless already existing
        self._analysisDefinitionNodesCollection.createSourceNode({
          id: sourceId,
          tableName: tableName,
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
      if (nodeDefModel === layerHeadNode) return true;

      if (layerHeadNode) {
        var primarySourceOfLastOwnNode = _.last(layerHeadNode.linkedListBySameLetter()).getPrimarySource();
        return nodeDefModel === primarySourceOfLastOwnNode;
      }
    });
  },

  isThereAnyGeometryData: function () {
    return this.filter(function (layerDefModel) {
      return layerDefModel.isDataLayer();
    }).some(function (layerDefModel) {
      var queryGeometryModel = layerDefModel.getAnalysisDefinitionNodeModel().queryGeometryModel;
      return queryGeometryModel && queryGeometryModel.hasValue();
    });
  },

  loadAllQueryGeometryModels: function (callback) {
    var promises = this.filter(function (layerDefModel) {
      return layerDefModel.isDataLayer();
    }).map(function (layerDefModel) {
      var queryGeometryModel = layerDefModel.getAnalysisDefinitionNodeModel().queryGeometryModel;
      var status = queryGeometryModel.get('status');
      var deferred = new $.Deferred();

      if (queryGeometryModel.isFetched()) {
        deferred.resolve();
      } else if (queryGeometryModel.canFetch()) {
        if (status !== 'fetching') {
          queryGeometryModel.fetch({
            success: function () {
              deferred.resolve();
            },
            error: function () {
              deferred.reject();
            }
          });
        } else {
          deferred.resolve();
        }
      } else {
        deferred.reject();
      }

      return deferred.promise();
    }, this);

    $.when.apply($, promises).done(callback);
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

  isDataLayerOnTop: function (lyrModel) {
    var currentPos = this.indexOf(lyrModel);
    return currentPos === this.getTopDataLayerIndex();
  },

  getTopDataLayerIndex: function () {
    var layerOnTop = this.getLayerOnTop();
    var at = this.indexOf(layerOnTop);
    var hasLabels = layerOnTop &&
      !layerTypesAndKinds.isCartoDBType(layerOnTop.get('type')) &&
      !layerTypesAndKinds.isTorqueType(layerOnTop.get('type'));

    if (hasLabels) { at--; }

    return at;
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
    this.trigger('changingBaseLayer');

    newBaseLayerAttrs = _.clone(newBaseLayerAttrs);

    if (this.isBaseLayerAdded(newBaseLayerAttrs)) {
      this.trigger('baseLayerChanged');

      return false;
    }

    var newBaseLayerHasLabels = newBaseLayerAttrs.labels && newBaseLayerAttrs.labels.url;
    var baseLayerOptions = {
      success: function () {
        if (!newBaseLayerHasLabels) {
          this.trigger('baseLayerChanged');
        }
      }.bind(this),
      error: function () {
        this.trigger('baseLayerFailed');
      }.bind(this)
    };

    if (this._hasBaseLayer()) {
      this._updateBaseLayer(newBaseLayerAttrs, baseLayerOptions);
    } else {
      this._createBaseLayer(newBaseLayerAttrs, baseLayerOptions);
    }

    if (newBaseLayerHasLabels) {
      var labelsLayerOptions = baseLayerOptions;
      labelsLayerOptions.success = function () {
        this.trigger('baseLayerChanged');
      }.bind(this);

      if (this._hasLabelsLayer()) {
        this._updateLabelsLayer(newBaseLayerAttrs, labelsLayerOptions);
      } else {
        this._addLabelsLayer(newBaseLayerAttrs, labelsLayerOptions);
      }
    } else {
      if (this._hasLabelsLayer()) {
        this._destroyLabelsLayer(labelsLayerOptions);
      }
    }
  },

  isBaseLayerAdded: function (layer) {
    var me = this.getBaseLayer().toJSON();
    var other = layer;

    var myType = (me.type != null) ? me.type : me.options.type;
    var itsType = (other.type != null) ? other.type : other.options.type;

    if (layerTypesAndKinds.isTiledType(myType) && myType === itsType) {
      var myTemplate = (me.urlTemplate != null) ? me.urlTemplate : me.options.urlTemplate;
      var itsTemplate = (other.urlTemplate != null) ? other.urlTemplate : other.options.urlTemplate;
      var myName = (me.name != null) ? me.name : me.options.name;
      var itsName = (other.name != null) ? other.name : other.options.name;
      var myCategory = (me.category != null) ? me.category : me.options.category;
      var itsCategory = (other.category != null) ? other.category : other.options.category;

      return myTemplate === itsTemplate && myName === itsName && myCategory === itsCategory;
    }

    return false;
  },

  getBaseLayer: function () {
    return this.first();
  },

  getLayerOnTop: function () {
    return this.last();
  },

  _updateBaseLayer: function (newBaseLayerAttrs, opts) {
    var currentBaseLayer = this.getBaseLayer();
    currentBaseLayer.set(_.omit(newBaseLayerAttrs, ['id', 'order']), opts);
    currentBaseLayer.save(null, opts);
  },

  _createBaseLayer: function (newBaseLayerAttrs, opts) {
    newBaseLayerAttrs = _.extend(newBaseLayerAttrs, {
      order: 0,
      tooltip: {},
      infowindow: {}
    });

    // wait: true is used to make sure the layer is not added until confirmed it was added successfully
    // pass opts for success/error callbacks to be triggered as expected
    return this.create(newBaseLayerAttrs, _.extend({ at: 0, wait: true }, opts));
  },

  _hasBaseLayer: function () {
    var baseLayer = this.getBaseLayer();
    return baseLayer;
  },

  _hasLabelsLayer: function () {
    return this.size() > 1 && layerTypesAndKinds.isTiledType(this.getLayerOnTop().get('type'));
  },

  _updateLabelsLayer: function (newBaseLayerAttrs, opts) {
    var labelsLayer = this.getLayerOnTop();
    labelsLayer.set({
      name: this._labelsLayerNameFromLayer(newBaseLayerAttrs),
      urlTemplate: newBaseLayerAttrs.labels.url,
      attribution: newBaseLayerAttrs.attribution,
      minZoom: newBaseLayerAttrs.minZoom,
      maxZoom: newBaseLayerAttrs.maxZoom,
      subdomains: newBaseLayerAttrs.subdomains
    });
    labelsLayer.save(null, opts);
  },

  _addLabelsLayer: function (newBaseLayerAttrs, opts) {
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

    this.create(labelsLayerAttrs, opts);
  },

  _destroyLabelsLayer: function (opts) {
    this.getLayerOnTop().destroy(opts);
  },

  _labelsLayerNameFromLayer: function (layer) {
    return layer.name + ' Labels';
  }

});

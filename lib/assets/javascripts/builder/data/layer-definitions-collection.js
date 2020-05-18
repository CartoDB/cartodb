var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var LayerDefinitionModel = require('./layer-definition-model');
var layerLetters = require('./layer-letters');
var layerColors = require('./layer-colors');
var nodeIds = require('builder/value-objects/analysis-node-ids');
var layerTypesAndKinds = require('./layer-types-and-kinds');
var SQLUtils = require('builder/helpers/sql-utils');
var TableNameUtils = require('builder/helpers/table-name-utils');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var REQUIRED_OPTS = [
  'analysisDefinitionNodesCollection',
  'configModel',
  'mapId',
  'stateDefinitionModel',
  'userModel'
];

var generateLabelsLayerName = function (layerName) {
  return layerName + ' Labels';
};

/**
 * Collection of layer definitions
 */
module.exports = Backbone.Collection.extend({

  initialize: function (models, opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  url: function () {
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/v1/maps/' + this._mapId + '/layers';
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

    this._sanitizeLabels();
  },

  comparator: function (model) {
    return model.get('order');
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
        var tableName = TableNameUtils.getUnqualifiedName(o.table_name);
        var userName = o.user_name || TableNameUtils.getUsername(o.table_name);

        var qualifyTableName = (userName && self._configModel.get('user_name') !== userName) || self._userModel.isInsideOrg();
        tableName = TableNameUtils.getQualifiedTableName(o.table_name, userName, qualifyTableName);

        o.source = o.source || sourceId;
        o.query = o.query || SQLUtils.getDefaultSQLFromTableName(tableName);

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
    var dataLayers = this._getDataLayers();
    var allQueryGeometryModels = this._getAllQueryGeometryModels(dataLayers);
    var queryGeometryModelsValuePromises = _.map(allQueryGeometryModels, function (queryGeometryModel) {
      return queryGeometryModel.hasValueAsync();
    });

    return Promise.all(queryGeometryModelsValuePromises)
      .then(function (hasGeomValues) {
        return _.some(hasGeomValues);
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
    return this.any(function (model) {
      return layerTypesAndKinds.isTorqueType(model.get('type'));
    });
  },

  isThereAnyCartoDBLayer: function () {
    return this.any(function (model) {
      return layerTypesAndKinds.isCartoDBType(model.get('type'));
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
    return this.select(function (model) {
      return layerTypesAndKinds.isTypeDataLayer(model.get('type'));
    }).length;
  },

  _takenLetters: function (otherLetters) {
    var valuesFromAddedModels = _.compact(this.pluck('letter'));

    // When adding multiple items the models created so far are stored in the internal object this._byId,
    // need to make sure to take them into account when returning already taken letter.
    var valuesFromModelsNotYetAdded = _.chain(this._byId).values().invoke('get', 'letter').value();

    return _.union(valuesFromAddedModels, valuesFromModelsNotYetAdded, otherLetters);
  },

  // This ensures that we don't end up with more than one labels layer
  _sanitizeLabels: function () {
    var troubled = this.models.filter(function (layer) {
      return layerTypesAndKinds.isTiledType(layer.get('type'));
    }).filter(function (layer) {
      var index = this.models.indexOf(layer);
      return (index > 0 && index < this.length - 1);
    }.bind(this));

    troubled.length > 0 && _.each(troubled, function (layer) {
      layer.destroy();
    });
  },

  setBaseLayer: function (newBaseLayerAttrs) {
    this.trigger('changingBaseLayer');

    newBaseLayerAttrs = _.clone(newBaseLayerAttrs);
    if (this.isBaseLayerAdded(newBaseLayerAttrs)) {
      this.trigger('baseLayerChanged');
      return false;
    }

    var newBaseLayerHasLabels = !!(newBaseLayerAttrs.labels && newBaseLayerAttrs.labels.urlTemplate);

    var labelsLayerOptions = {
      silent: true,
      wait: true, // do not add/remove the layer unless it's created/removed/updated successfully
      success: function () {
        this._sanitizeLabels();
        this.trigger('baseLayerChanged');
      }.bind(this),
      error: function () {
        this.trigger('baseLayerFailed');
      }.bind(this)
    };

    var baseLayerOptions = {
      silent: true,
      wait: true, // do not update the layer unless it's created/updated successfully
      success: function () {
        var labelsLayer = this.getLabelsLayer();
        if (newBaseLayerHasLabels) {
          if (labelsLayer) {
            this._updateLabelsLayer(newBaseLayerAttrs, labelsLayerOptions);
          } else {
            this._addLabelsLayer(newBaseLayerAttrs, labelsLayerOptions);
          }
        } else {
          if (labelsLayer) {
            this._destroyLabelsLayer(labelsLayerOptions);
          } else {
            this._sanitizeLabels();
            this.trigger('baseLayerChanged');
          }
        }
      }.bind(this),
      error: function () {
        this.trigger('baseLayerFailed');
      }.bind(this)
    };

    if (this.getBaseLayer()) {
      this._updateBaseLayer(newBaseLayerAttrs, baseLayerOptions);
    } else {
      this._createBaseLayer(newBaseLayerAttrs, baseLayerOptions);
    }
  },

  isBaseLayerAdded: function (basemapAttrs) {
    var baseLayerDefinitionModel = this.getBaseLayer();
    return baseLayerDefinitionModel.matchesAttrs(basemapAttrs);
  },

  _updateBaseLayer: function (basemapAttrs, opts) {
    var currentBaseLayer = this.getBaseLayer();
    var newBaseLayerAttrs = _.omit(basemapAttrs, [ 'id', 'order', 'labels', 'template' ]);

    currentBaseLayer.attributes = _.extend({
      order: 0
    }, _.pick(currentBaseLayer.attributes, [
      'id',
      'type',
      'category'
    ]));

    currentBaseLayer.save(newBaseLayerAttrs, opts);
  },

  _createBaseLayer: function (newBaseLayerAttrs, opts) {
    newBaseLayerAttrs = _.extend(newBaseLayerAttrs, {
      order: 0
    });
    return this.create(newBaseLayerAttrs, _.extend({ at: 0 }, opts));
  },

  _updateLabelsLayer: function (newBaseLayerAttrs, opts) {
    var labelsLayer = this.getLabelsLayer();
    var newAttrs = _.omit(newBaseLayerAttrs, 'labels');

    newAttrs = _.pick(newAttrs, _.identity);
    newAttrs = _.extend(newAttrs, newBaseLayerAttrs.labels, {
      name: generateLabelsLayerName(newBaseLayerAttrs.name)
    });

    labelsLayer.save(newAttrs, opts);
  },

  _addLabelsLayer: function (newBaseLayerAttrs, opts) {
    var optionsAttribute = _.pick(newBaseLayerAttrs, ['type', 'subdomains', 'minZoom', 'maxZoom', 'name', 'className', 'attribution', 'category']);
    optionsAttribute = _.extend(optionsAttribute, newBaseLayerAttrs.labels, {
      name: generateLabelsLayerName(newBaseLayerAttrs.name)
    });

    var labelsLayerAttrs = {
      order: this.getLayerOnTop().get('order') + 1,
      options: optionsAttribute
    };

    this.create(labelsLayerAttrs, opts);
  },

  _destroyLabelsLayer: function (opts) {
    this.getLayerOnTop().destroy(opts);
  },

  _getAllQueryGeometryModels: function (dataLayers) {
    return _.compact(_.map(dataLayers, function (dataLayer) {
      return dataLayer.getAnalysisDefinitionNodeModel().queryGeometryModel;
    }));
  },

  _getDataLayers: function () {
    return this.filter(function (layerDefinitionModel) {
      return layerDefinitionModel.isDataLayer();
    });
  },

  getBaseLayer: function () {
    return this.first();
  },

  getLabelsLayer: function () {
    var layerOnTop = this.getLayerOnTop();
    if (this.size() > 1 && layerTypesAndKinds.isTiledType(layerOnTop.get('type'))) {
      return layerOnTop;
    }
  },

  getLayerOnTop: function () {
    return this.last();
  }
});

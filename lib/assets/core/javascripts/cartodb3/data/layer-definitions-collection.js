var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var LayerDefinitionModel = require('./layer-definition-model');
var layerLetters = require('./layer-letters');
var layerColors = require('./layer-colors');
var nodeIds = require('../value-objects/analysis-node-ids');
var layerTypesAndKinds = require('./layer-types-and-kinds');
var SQLUtils = require('../helpers/sql-utils');
var TableNameUtils = require('../helpers/table-name-utils');
var checkAndBuildOpts = require('../helpers/required-opts');
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
    return this.filter(function (layerDefModel) {
      return layerDefModel.isDataLayer();
    }).some(function (layerDefModel) {
      var queryGeometryModel = layerDefModel.getAnalysisDefinitionNodeModel().queryGeometryModel;
      return queryGeometryModel && queryGeometryModel.hasValue();
    });
  },

  findNonGeoreferencedLayer: function (callback, layerDefinitionModel) {
    var getNextDataLayer = function (currentLayerDefModel) {
      var layersCollection = this;
      var nextDataLayer;
      for (var i = (layersCollection.size() - 1); i > 0; i--) {
        var layerDefModel = layersCollection.at(i);
        var currentIndex = currentLayerDefModel ? layersCollection.indexOf(currentLayerDefModel) : layersCollection.size();
        var index = layersCollection.indexOf(layerDefModel);
        if (!nextDataLayer && layerDefModel.isDataLayer() && layerDefModel !== currentLayerDefModel && currentIndex > index) {
          nextDataLayer = layerDefModel;
        }
      }

      return nextDataLayer;
    }.bind(this);

    var canBeGeoreferencedLayer = function () {
      if (layerDefinitionModel.canBeGeoreferenced()) {
        callback && callback(layerDefinitionModel);
      } else {
        var nextDataLayer = getNextDataLayer(layerDefinitionModel);
        nextDataLayer && this.findNonGeoreferencedLayer(callback, nextDataLayer);
      }
    }.bind(this);

    if (!layerDefinitionModel) {
      layerDefinitionModel = getNextDataLayer();
      if (!layerDefinitionModel) {
        return false;
      }
    }

    var checkLayer = _.after(3, canBeGeoreferencedLayer);
    var analysisDefinitionNodeModel = layerDefinitionModel.getAnalysisDefinitionNodeModel();
    var queryGeometryModel = analysisDefinitionNodeModel.queryGeometryModel;
    var querySchemaModel = analysisDefinitionNodeModel.querySchemaModel;
    var queryRowsCollection = analysisDefinitionNodeModel.queryRowsCollection;

    // If node has a non default query or there is any other analysis, "layer" can't be geocoded
    // so we go for the next one without requesting any data (geo, data, schema,...).
    if (analysisDefinitionNodeModel.isCustomQueryApplied() || layerDefinitionModel.hasAnalyses()) {
      var nextDataLayer = getNextDataLayer(layerDefinitionModel);
      if (nextDataLayer) {
        this.findNonGeoreferencedLayer(callback, nextDataLayer);
      }
      return;
    }

    var promises = _.map([queryGeometryModel, querySchemaModel, queryRowsCollection], function (obj) {
      var deferred = new $.Deferred();

      if (obj.shouldFetch()) {
        obj.fetch({
          success: function () {
            deferred.resolve();
          },
          error: function () {
            deferred.reject();
          }
        });
      } else if (obj.isFetching()) {
        // we need statusModel for queryRowsCollection 
        this.listenTo(obj.statusModel ? obj.statusModel : obj, 'change:status', function () {
          if (obj.isFetched()) {
            deferred.resolve();
          } else {
            deferred.reject();
          }
        });
      } else if (obj.isFetched()) {
        deferred.resolve();
      } else {
        deferred.reject();
      }

      return deferred;
    }, this);

    $.when.apply($, promises).done(canBeGeoreferencedLayer);
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

    var labelsLayerOptions = {
      wait: true, // do not add/remove the layer unless it's created/removed/updated successfully
      success: function () {
        this.trigger('baseLayerChanged');
      }.bind(this),
      error: function () {
        this.trigger('baseLayerFailed');
      }.bind(this)
    };

    var baseLayerOptions = {
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
    newAttrs = _.extend(newAttrs, {
      name: generateLabelsLayerName(newBaseLayerAttrs.name),
      urlTemplate: newBaseLayerAttrs.labels.url
    });
    labelsLayer.save(newAttrs, opts);
  },

  _addLabelsLayer: function (newBaseLayerAttrs, opts) {
    var optionsAttribute = _.pick(newBaseLayerAttrs, ['type', 'subdomains', 'minZoom', 'maxZoom', 'name', 'className', 'attribution', 'category']);
    optionsAttribute = _.extend(optionsAttribute, {
      urlTemplate: newBaseLayerAttrs.labels.url,
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

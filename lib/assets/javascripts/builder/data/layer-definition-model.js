var Backbone = require('backbone');
var _ = require('underscore');
var syncAbort = require('./backbone/sync-abort');
var StyleDefinitionModel = require('builder/editor/style/style-definition-model');
var StyleCartoCSSModel = require('builder/editor/style/style-cartocss-model');
var DataSQLModel = require('builder/editor/layers/layer-content-views/data/data-sql-model');
var layerTypesAndKinds = require('./layer-types-and-kinds');
var InfowindowModel = require('./infowindow-click-model');
var TooltipModel = require('./infowindow-hover-model');
var TableNameUtils = require('builder/helpers/table-name-utils');
var layerColors = require('./layer-colors');

// from_layer_id and from_letter are not attributes for the model, but are sent to the layer creation
// endpoint when creating a layer from an existing analysis node (see user-actions)
var ATTR_NAMES = ['id', 'order', 'infowindow', 'tooltip', 'error', 'from_layer_id', 'from_letter'];

/**
 * Model to edit a layer definition.
 * Should always exist as part of a LayerDefinitionsCollection, so its URL is given from there.
 */
module.exports = Backbone.Model.extend({

  /**
   * @override {Backbone.prototype.sync} abort ongoing request if there is any
   */
  sync: syncAbort,

  parse: function (response, opts) {
    response.options = response.options || {};

    // Flatten the attrs, to avoid having this.get('options').foobar internally
    var attrs = _
      .defaults(
        _.pick(response, ATTR_NAMES),
        _.omit(response.options, ['query', 'tile_style'])
      );

    // Only use type on the frontend, it will be mapped back when the model is serialized (see .toJSON)
    attrs.type = attrs.type || layerTypesAndKinds.getType(response.kind);

    // Map API endpoint attrs to the new names used client-side (cartodb.js in particular)
    if (response.options.tile_style) {
      attrs.cartocss = response.options.tile_style;
    }
    if (response.options.query) {
      attrs.sql = response.options.query;
    }

    if (response.infowindow) {
      if (!this.infowindowModel) {
        this.infowindowModel = new InfowindowModel(response.infowindow, {
          configModel: opts.configModel || this._configModel
        });
      }
    }
    if (response.tooltip) {
      if (!this.tooltipModel) {
        this.tooltipModel = new TooltipModel(response.tooltip, {
          configModel: opts.configModel || this._configModel
        });
      }
    }
    if (response.options.table_name) {
      // Set autostyle as false if it doesn't contain any id
      attrs.autoStyle = attrs.autoStyle || false;

      if (!this.styleModel) {
        this.styleModel = new StyleDefinitionModel(response.options.style_properties, {
          parse: true
        });

        this.cartocssModel = new StyleCartoCSSModel({
          content: attrs.cartocss
        }, {
          history: response.options.cartocss_history || response.options.tile_style_history
        });
      }

      if (!this.sqlModel) {
        this.sqlModel = new DataSQLModel({
          content: attrs.sql
        }, {
          history: response.options.sql_history
        });
      }
    }

    // Flatten the rest of the attributes
    return attrs;
  },

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');

    this._configModel = opts.configModel;

    this.on('change:source change:sql', this._onPosibleLayerSchemaChanged, this);

    if (this.styleModel) {
      this.styleModel.bind('change:type change:animated', function () {
        if (this.styleModel.isAggregatedType() || this.styleModel.isAnimation()) {
          // setTemplate will clear fields
          this.infowindowModel && this.infowindowModel.unsetTemplate();
          this.tooltipModel && this.tooltipModel.unsetTemplate();
        }
      }, this);
    }
  },

  save: function (attrs, options) {
    attrs = attrs || {};
    options = options || {};

    // We assume that if the layer is saved, we have to disable autostyle
    var autoStyleAttrs = {
      autoStyle: false
    };

    // But if the layer is saved with shouldPreserveAutoStyle option, we should preserve autostyle
    if (options && options.shouldPreserveAutoStyle) {
      delete autoStyleAttrs.autoStyle;
    } else if (this.get('autoStyle')) {
      this.styleModel && this.styleModel.resetPropertiesFromAutoStyle();
    }

    attrs = _.extend(
      {},
      autoStyleAttrs,
      attrs
    );

    return Backbone.Model.prototype.save.call(this, attrs, options);
  },

  toJSON: function () {
    // Un-flatten the internal attrs to the datastructure that's expected by the API endpoint
    var options = _.omit(this.attributes, ATTR_NAMES.concat(['cartocss', 'sql', 'autoStyle']));

    // Map back internal attrs to the expected attrs names by the API endpoint
    var cartocss = this.get('cartocss');

    if (cartocss) {
      options.tile_style = cartocss;
    }
    var sql = this.get('sql');
    if (sql) {
      options.query = sql;
    }

    var defaultAttributes = {
      kind: layerTypesAndKinds.getKind(this.get('type')),
      options: options
    };

    var infowindowData = this.infowindowModel && this.infowindowModel.toJSON();
    if (!_.isEmpty(infowindowData)) {
      defaultAttributes.infowindow = this.infowindowModel.toJSON();
    }

    var tooltipData = this.tooltipModel && this.tooltipModel.toJSON();
    if (!_.isEmpty(tooltipData)) {
      defaultAttributes.tooltip = this.tooltipModel.toJSON();
    }

    if (this.styleModel && !this.styleModel.isAutogenerated()) {
      defaultAttributes.options.style_properties = this.styleModel.toJSON();
    }

    if (this.cartocssModel) {
      defaultAttributes.options.cartocss_history = this.cartocssModel.getHistory();
    }

    if (this.sqlModel) {
      defaultAttributes.options.sql_history = this.sqlModel.getHistory();
    }

    var attributes = _.omit(this.attributes, 'infowindow', 'tooltip', 'options', 'error', 'autoStyle');

    return _.defaults(
      defaultAttributes,
      _.pick(attributes, ATTR_NAMES)
    );
  },

  canBeDeletedByUser: function () {
    return this.collection.getNumberOfDataLayers() > 1 && this.isDataLayer() &&
      (this._canBeFoldedUnderAnotherLayer() || !this._isAllDataLayersDependingOnAnyAnalysisOfThisLayer());
  },

  isOwnerOfAnalysisNode: function (nodeModel) {
    return nodeModel && nodeModel.letter() === this.get('letter');
  },

  ownedPrimaryAnalysisNodes: function () {
    var nodeDefModel = this.getAnalysisDefinitionNodeModel();
    return this.isOwnerOfAnalysisNode(nodeDefModel)
      ? nodeDefModel.linkedListBySameLetter()
      : [];
  },

  getName: function () {
    return this.get('name') ||
      this.get('table_name_alias') ||
      this.get('table_name');
  },

  getTableName: function () {
    return this.get('table_name') || '';
  },

  getColor: function () {
    return layerColors.getColorForLetter(this.get('letter'));
  },

  containsNode: function (other) {
    var nodeDefModel = this.getAnalysisDefinitionNodeModel();
    return nodeDefModel && nodeDefModel.containsNode(other);
  },

  getAnalysisDefinitionNodeModel: function () {
    return this.findAnalysisDefinitionNodeModel(this.get('source'));
  },

  findAnalysisDefinitionNodeModel: function (id) {
    return this.collection && this.collection.findAnalysisDefinitionNodeModel(id);
  },

  _onPosibleLayerSchemaChanged: function (eventName, attrs, options) {
    // Used to avoid resetting styles on source_id changes when we have saved styles for the node
    if (options && options.ignoreSchemaChange) {
      return;
    }

    if (this.infowindowModel) {
      this.infowindowModel.clearFields();
    }
    if (this.tooltipModel) {
      this.tooltipModel.clearFields();
    }
    if (this.styleModel) {
      this.styleModel.resetStyles();
    }
  },

  toggleVisible: function () {
    this.set('visible', !this.get('visible'));
  },

  toggleCollapse: function () {
    this.set('collapsed', !this.get('collapsed'));
  },

  hasAnalyses: function () {
    return this.getNumberOfAnalyses() > 0;
  },

  hasAggregatedStyles: function () {
    return this.styleModel && this.styleModel.isAggregatedType();
  },

  getNumberOfAnalyses: function () {
    var analysisNode = this.getAnalysisDefinitionNodeModel();
    var count = 0;

    while (analysisNode && this.isOwnerOfAnalysisNode(analysisNode)) {
      analysisNode = analysisNode.getPrimarySource();

      if (analysisNode) {
        count += 1;
      }
    }

    return count;
  },

  getQualifiedTableName: function () {
    var userName = this.get('user_name') || this.collection.userModel.get('username');
    return TableNameUtils.getQualifiedTableName(
      this.getTableName(),
      userName,
      this.collection.userModel.isInsideOrg()
    );
  },

  getColumnNamesFromSchema: function () {
    return this._getQuerySchemaModel().getColumnNames();
  },

  _getQuerySchemaModel: function () {
    var nodeDefModel = this.getAnalysisDefinitionNodeModel();
    return nodeDefModel.querySchemaModel;
  },

  isDataLayer: function () {
    var layerType = this.get('type');
    return layerTypesAndKinds.isCartoDBType(layerType) ||
      layerTypesAndKinds.isTorqueType(layerType);
  },

  isTorqueLayer: function () {
    return this.get('type') === 'torque';
  },

  isAutoStyleApplied: function () {
    var autoStyle = this.get('autoStyle');
    return (autoStyle != null && autoStyle !== false);
  },

  _canBeFoldedUnderAnotherLayer: function () {
    var thisNodeDefModel = this.getAnalysisDefinitionNodeModel();

    return this.collection.any(function (m) {
      if (m !== this && m.isDataLayer()) {
        var otherNodeDefModel = m.getAnalysisDefinitionNodeModel();
        if (otherNodeDefModel === thisNodeDefModel) return true;

        var lastNode = _.last(otherNodeDefModel.linkedListBySameLetter());
        return lastNode.getPrimarySource() === thisNodeDefModel;
      }
    }, this);
  },

  _isAllDataLayersDependingOnAnyAnalysisOfThisLayer: function () {
    var nodeDefModel = this.getAnalysisDefinitionNodeModel();
    if (!nodeDefModel) return false;
    if (!this.isOwnerOfAnalysisNode(nodeDefModel)) return false;

    var linkedNodesList = nodeDefModel.linkedListBySameLetter();

    return this.collection.chain()
      .filter(function (m) {
        return m !== this && !!m.get('source');
      }, this)
      .all(function (m) {
        return _.any(linkedNodesList, function (node) {
          return m.containsNode(node);
        });
      }, this)
      .value();
  },

  getAllDependentLayers: function () {
    var self = this;
    var layersCount = 0;

    var layerDefinitionsCollectionModels = self.collection.models;

    for (var i = 0; i < layerDefinitionsCollectionModels.length; i++) {
      var layer = layerDefinitionsCollectionModels[i];
      var dependentAnalysis = false;

      if (layer !== self) {
        var analysisNode = layer.getAnalysisDefinitionNodeModel();

        while (analysisNode) {
          if (self.isOwnerOfAnalysisNode(analysisNode)) {
            dependentAnalysis = true;
          }
          analysisNode = analysisNode.getPrimarySource();
        }

        if (dependentAnalysis) {
          layersCount += 1;
        }
      }
    }
    return layersCount;
  },

  matchesAttrs: function (otherAttrs) {
    if (this.get('type') !== otherAttrs.type) {
      return false;
    }

    if (layerTypesAndKinds.isTiledType(otherAttrs.type)) {
      return this.get('name') === otherAttrs.name &&
        this.get('urlTemplate') === otherAttrs.urlTemplate;
    }

    if (layerTypesAndKinds.isGMapsBase(otherAttrs.type)) {
      return this.get('name') === otherAttrs.name &&
        this.get('baseType') === otherAttrs.baseType &&
        this.get('style') === otherAttrs.style;
    }

    if (layerTypesAndKinds.isPlainType(otherAttrs.type)) {
      return this.get('color') === otherAttrs.color;
    }

    return false;
  },

  hasGeocodingAnalysisApplied: function () {
    var analysisNode = this.getAnalysisDefinitionNodeModel();

    if (analysisNode && analysisNode.get('type') === 'geocoding') {
      return true;
    }

    while (analysisNode && this.isOwnerOfAnalysisNode(analysisNode)) {
      analysisNode = analysisNode.getPrimarySource();

      if (analysisNode && analysisNode.get('type') === 'geocoding') {
        return true;
      }
    }

    return false;
  },

  _hasAnyAnalysisApplied: function () {
    var analysisNode = this.getAnalysisDefinitionNodeModel();

    return analysisNode.get('type') !== 'source';
  },

  isEmpty: function () {
    throw new Error('LayerDefinitionModel.isEmpty() is an async operation. Use `.isEmptyAsync` instead.');
  },

  isEmptyAsync: function () {
    var nodeModel = this.getAnalysisDefinitionNodeModel();
    var hasAnyAnalysisApplied = this._hasAnyAnalysisApplied();
    var hasCustomQueryApplied = nodeModel.isCustomQueryApplied();

    return new Promise(function (resolve, reject) {
      nodeModel.queryRowsCollection.isEmptyAsync()
        .then(function (isEmpty) {
          resolve(!hasAnyAnalysisApplied && !hasCustomQueryApplied && isEmpty);
        });
    });
  },

  isDataFiltered: function () {
    var nodeModel = this.getAnalysisDefinitionNodeModel();
    var hasAnyAnalysisApplied = this._hasAnyAnalysisApplied();
    var hasCustomQueryApplied = nodeModel.isCustomQueryApplied();
    return new Promise(function (resolve, reject) {
      nodeModel.queryRowsCollection.isEmptyAsync()
        .then(function (isEmpty) {
          resolve((hasAnyAnalysisApplied || hasCustomQueryApplied) && isEmpty);
        });
    });
  },

  isDone: function () {
    var nodeModel = this.getAnalysisDefinitionNodeModel();
    return nodeModel.queryRowsCollection.isDone() &&
      nodeModel.queryGeometryModel.isDone() &&
      nodeModel.querySchemaModel.isDone();
  },

  canBeGeoreferenced: function () {
    var self = this;
    var analysisDefinitionNodeModel = this.getAnalysisDefinitionNodeModel();
    var emptyPromise = self.isEmptyAsync();
    var geomPromise = analysisDefinitionNodeModel.queryGeometryModel.hasValueAsync();

    return Promise.all([emptyPromise, geomPromise])
      .then(function (values) {
        var isEmpty = values[0];
        var hasGeom = values[1];

        var canBeGeoreferenced =
          !isEmpty &&
          !hasGeom &&
          !self.hasGeocodingAnalysisApplied() &&
          !self._hasAnyAnalysisApplied() &&
          !analysisDefinitionNodeModel.isCustomQueryApplied();

        return canBeGeoreferenced;
      });
  },

  fetchQueryRowsIfRequired: function () {
    var self = this;
    var analysisDefinitionNodeModel = this.getAnalysisDefinitionNodeModel();

    analysisDefinitionNodeModel.queryGeometryModel.hasValueAsync()
      .then(function (geomHasValue) {
        if (!self.hasGeocodingAnalysisApplied() &&
          !geomHasValue &&
          !analysisDefinitionNodeModel.isCustomQueryApplied() &&
          analysisDefinitionNodeModel.queryRowsCollection.isUnavailable()) {
          analysisDefinitionNodeModel.queryRowsCollection.fetch();
        }
      });
  }
});

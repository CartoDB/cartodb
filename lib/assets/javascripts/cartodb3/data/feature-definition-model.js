var _ = require('underscore');
var Backbone = require('backbone');
var QueryRowModel = require('./query-row-model');

var TYPES_POINT = 'point';
var TYPES_LINE = 'line';
var TYPES_POLYGON = 'polygon';

var GEOJSON_TO_FEATURE_TYPE = {
  Point: TYPES_POINT,
  MultiPoint: TYPES_POINT,
  LineString: TYPES_LINE,
  MultiLineString: TYPES_LINE,
  Polygon: TYPES_POLYGON,
  MultiPolygon: TYPES_POLYGON
};

var convertGeoJSONTypeToFeatureType = function (the_geom) {
  var geoJSON = null;

  try {
    geoJSON = JSON.parse(the_geom);
  } catch (err) {
    // if the geom is not a valid json value
  }

  var geometryType = geoJSON && geoJSON.type;
  var featureType = GEOJSON_TO_FEATURE_TYPE[geometryType];
  if (!featureType) {
    throw new Error("unsupported geometry type: '" + geometryType + "'");
  }

  return featureType;
};

var BLACKLISTED_COLUMNS = ['cartodb_id', 'created_at', 'the_geom_webmercator', 'updated_at'];

var FeatureDefinitionModel = Backbone.Model.extend({

  initialize: function (attrs, options) {
    if (!options.configModel) throw new Error('configModel is required');
    if (!options.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!options.userModel) throw new Error('userModel is required');

    this._configModel = options.configModel;
    this._layerDefinitionModel = options.layerDefinitionModel;
    this._userModel = options.userModel;
    this._featureType = options.featureType;

    this._firstNode = this._getAnalysisDefinitionNodeModel();

    if (this._firstNode.isSourceType()) {
      this._tableNodeModel = this._firstNode.getTableModel();
    }
  },

  isNew: function () {
    return !this.has('cartodb_id');
  },

  isPoint: function () {
    return this._isType(TYPES_POINT);
  },

  isPolygon: function () {
    return this._isType(TYPES_POLYGON);
  },

  isLine: function () {
    return this._isType(TYPES_LINE);
  },

  _isType: function (type) {
    return this._getType() === type;
  },

  isEditable: function () {
    return !this.hasAnalyses() && !this.isCustomQueryApplied() && !this.isReadOnly();
  },

  isReadOnly: function () {
    return this._tableNodeModel && this._tableNodeModel.isReadOnly();
  },

  hasAnalyses: function () {
    return this._layerDefinitionModel.hasAnalyses();
  },

  isCustomQueryApplied: function () {
    return this._layerDefinitionModel.isCustomQueryApplied();
  },

  _getAnalysisDefinitionNodeModel: function () {
    return this._layerDefinitionModel.getAnalysisDefinitionNodeModel();
  },

  isEqual: function (featureDefinition) {
    return this.get('cartodb_id') === featureDefinition.get('cartodb_id') &&
      this.getLayerId() === featureDefinition.getLayerId();
  },

  getLayerId: function () {
    return this._layerDefinitionModel.id;
  },

  getLayerDefinition: function () {
    return this._layerDefinitionModel;
  },

  getFeatureType: function () {
    if (this.isPoint()) {
      return 'point';
    }
    if (this.isLine()) {
      return 'line';
    }
    if (this.isPolygon()) {
      return 'polygon';
    }
  },

  fetch: function (options) {
    options = options || {};

    this._getQueryRowModel().fetch({
      success: function (data) {
        this.set(data.toJSON());
        options.success && options.success();
      }.bind(this)
    });
  },

  save: function (options) {
    options = options || {};
    var columns = this._layerDefinitionModel.getColumnNamesFromSchema();
    var attrs = _.pick(this.toJSON(), _.difference(columns, BLACKLISTED_COLUMNS));

    this._getQueryRowModel().save(attrs, {
      success: function (queryRowModel) {
        if (this.isNew()) {
          this.set('cartodb_id', queryRowModel.get('cartodb_id'));
        }
        this.trigger('save', this, options);
        options.success && options.success();
      }.bind(this),
      error: function () {
        options.error && options.error();
      }
    });
  },

  destroy: function (options) {
    options = options || {};
    this._getQueryRowModel().destroy({
      success: function () {
        this.trigger('remove', this, options);
        options.success && options.success();
      }.bind(this),
      error: function () {
        options.error && options.error();
      }
    });
  },

  _getQueryRowModel: function () {
    var attrs = {};

    if (this.has('cartodb_id')) {
      attrs.cartodb_id = this.get('cartodb_id');
    }

    this._queryRowModel = this._queryRowModel || new QueryRowModel(attrs, {
      tableName: this._layerDefinitionModel.getTableName(),
      configModel: this._configModel
    });

    return this._queryRowModel;
  },

  _getType: function () {
    var the_geom = this.get('the_geom');
    var type = the_geom && convertGeoJSONTypeToFeatureType(the_geom) || this._featureType;

    return type;
  }
});

module.exports = FeatureDefinitionModel;

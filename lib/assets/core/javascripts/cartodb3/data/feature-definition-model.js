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
    this._changesHistory = [];

    if (this._firstNode.isSourceType()) {
      this._tableNodeModel = this._firstNode.getTableModel();
    }

    this._onChange = _.debounce(this._onChange.bind(this), 500);

    if (this.isNew()) {
      // Bind change event in order to "store" all changed columns after creation
      this._bindChangeEvent();
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
    var analysisDefinitionModel = this._getAnalysisDefinitionNodeModel();
    return !analysisDefinitionModel.isReadOnly();
  },

  _getPermissionModel: function () {
    return this._tableNodeModel && this._tableNodeModel.getPermissionModel();
  },

  isReadOnly: function () {
    return this._tableNodeModel && this._tableNodeModel.isReadOnly(this._userModel);
  },

  hasAnalyses: function () {
    return this._layerDefinitionModel.hasAnalyses();
  },

  isCustomQueryApplied: function () {
    var analysisDefinitionModel = this._getAnalysisDefinitionNodeModel();
    return analysisDefinitionModel.isCustomQueryApplied();
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

  _cleanChangesHistory: function () {
    this._changesHistory = [];
  },

  _bindChangeEvent: function () {
    this.on('change', this._onChange, this);
  },

  _unbindChangeEvent: function () {
    this.off('change', this._onChange, this);
  },

  _onChange: function () {
    _.each(this.changed, function (value, key) {
      if (!_.contains(this._changesHistory, key)) {
        this._changesHistory.push(key);
      }
    }, this);
  },

  hasBeenChangedAfterLastSaved: function (key) {
    return _.contains(this._changesHistory, key);
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
    this._unbindChangeEvent();

    this._getQueryRowModel().fetch({
      success: function (data) {
        this.set(data.toJSON());
        // Bind change event in order to "store" all changed columns after starting edition
        this._bindChangeEvent();
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
        this._cleanChangesHistory();
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
      configModel: this._configModel,
      permissionModel: this._getPermissionModel(),
      userModel: this._userModel
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

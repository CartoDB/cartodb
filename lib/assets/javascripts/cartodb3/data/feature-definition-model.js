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

var convertGeoJSONTypeToFeatureType = function (geoJSON) {
  var geometryType = geoJSON.geometry && geoJSON.geometry.type || geoJSON.type;
  var featureType = GEOJSON_TO_FEATURE_TYPE[geometryType];
  if (!featureType) {
    throw new Error("unsupported geometry type: '" + geometryType + "'");
  }

  return featureType;
};

var FeatureDefinitionModel = Backbone.Model.extend({
  initialize: function (attrs, options) {
    if (!options.configModel) throw new Error('configModel is required');
    if (!options.layerDefinitionModel) throw new Error('layerDefinitionModel is required');

    this._configModel = options.configModel;
    this._layerDefinitionModel = options.layerDefinitionModel;
  },

  isValid: function () {
    // TODO
    return true;
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
    return this.get('type') === type;
  },

  fetch: function (options) {
    options = options || {};
    this._getQueryRowModel().fetch({
      success: function (data) {
        this.set(this.parse(data.toJSON()));
        options.success && options.success()
      }.bind(this)
    });
  },

  parse: function (response) {
    var geojson = JSON.parse(response.the_geom);
    return _.extend(response, {
      'the_geom': geojson,
      'type': convertGeoJSONTypeToFeatureType(geojson)
    });
  },


  _getQueryRowModel: function () {
    this._queryRowModel = this._queryRowModel || new QueryRowModel({ cartodb_id: this.get('id') }, {
      tableName: this._layerDefinitionModel.getTableName(),
      configModel: this._configModel
    });

    return this._queryRowModel;
  }

});

module.exports = FeatureDefinitionModel;

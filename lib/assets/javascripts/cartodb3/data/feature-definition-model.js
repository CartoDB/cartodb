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

var BLACKLISTED_COLUMNS = ['cartodb_id', 'created_at', 'the_geom_webmercator', 'updated_at'];

var FeatureDefinitionModel = Backbone.Model.extend({

  initialize: function (attrs, options) {
    if (!options.configModel) throw new Error('configModel is required');
    if (!options.layerDefinitionModel) throw new Error('layerDefinitionModel is required');

    this._configModel = options.configModel;
    this._layerDefinitionModel = options.layerDefinitionModel;
  },

  isNew: function () {
    return !this.has('id');
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

  _getFeatureType: function () {
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

  save: function () {
    var columnsCollection = this._layerDefinitionModel.getAnalysisDefinitionNodeModel().querySchemaModel.columnsCollection;
    var columns = columnsCollection.pluck('name');
    var attrs = _.pick(this.toJSON(), _.difference(columns, BLACKLISTED_COLUMNS));

    this._getQueryRowModel().save(attrs);
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

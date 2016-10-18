var Backbone = require('backbone');
var QueryRowModel = require('./query-row-model');

var TYPES_POINT = 'point';
var TYPES_POLYGON = 'polygon';
var TYPES_LINE = 'line';
var BLACKLISTED_COLUMNS = ['cartodb_id', 'created_at', 'the_geom_webmercator', 'updated_at'];

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

  fetch: function () {
    this._getQueryRowModel().fetch({
      success: function (data) {
        this.set(data.toJSON());
      }.bind(this)
    });
  },

  save: function () {
    var columnsCollection = this._layerDefinitionModel.getAnalysisDefinitionNodeModel().querySchemaModel.columnsCollection;
    var columns = columnsCollection.pluck('name');
    var attrs = _.pick(this.toJSON(), _.difference(columns, BLACKLISTED_COLUMNS));

    this._queryRowModel.set(attrs);
    this._queryRowModel.save();
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

var cdb = require('cartodb.js');
var _ = require('underscore');
var StylesFactory = require('./styles-factory');

module.exports = cdb.core.Model.extend({

  parse: function (r) {
    // Flatten attributes
    return _.extend(
      {
        type: r.type
      },
      r.aggregation,
      r.properties
    );
  },

  initialize: function (attrs, opts) {
    if (!opts.layerTableModel) throw new Error('layerTableModel is required');

    this._layerTableModel = opts.layerTableModel;

    this._initBinds();

    if (!attrs || !_.contains(StylesFactory.getTypeAttrs(), attrs.type)) {
      this.set('type', 'simple');
    }
  },

  _initBinds: function () {
    this.bind('change:type', this._setDefaultProperties, this);
    this._layerTableModel.bind('change:geometry_types', this._setDefaultProperties, this);
  },

  _setDefaultProperties: function () {
    var styleType = this.get('type');
    var geometryType = this._layerTableModel.getGeometryType && this._layerTableModel.getGeometryType() || 'point';
    this.attributes = {
      type: styleType
    };
    // Get default aggregation and properties from factory and apply them
    this.set(StylesFactory.getDefaultStyleAttrsByType(styleType, geometryType));
  },

  // Unflatten attributes
  toJSON: function () {
    return {
      type: this.get('type'),
      aggregation: _.reduce(this.attributes, function (memo, value, key) {
        if (_.contains(StylesFactory.getAggregationAttrs(), key)) {
          memo[key] = value;
        }
        return memo;
      }, {}, this),
      properties: _.reduce(this.attributes, function (memo, value, key) {
        if (!_.contains(StylesFactory.getAggregationAttrs(), key) && key !== 'type') {
          memo[key] = value;
        }
        return memo;
      }, {}, this)
    };
  }
});

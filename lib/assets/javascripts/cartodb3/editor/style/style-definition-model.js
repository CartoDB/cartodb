var cdb = require('cartodb.js');
var _ = require('underscore');
var StylesFactory = require('./styles-factory');

module.exports = cdb.core.Model.extend({

  /*
    type: 'simple', 'aggregation', 'heatmap',
    aggregation: { -> Aggregation options form model
      aggr_type: 'hexabins',
      aggr_dataset: <%- tableName %>,
      aggr_value: "COUNT", "MAX(<%= columnName %>)",...
      aggr_resolution: 1..30 ?
    },
    properties: { -> Properties form model
      the-component: {
        image: http://..,
      },
      stroke: ...,
      animated: true
    }
  */

  parse: function (r) {
    // Flatten attributes
    return _.extend(
      {
        type: r.type
      },
      r.aggregation,
      r.properties // _.omit(r.properties, 'geometry_type')
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
    this._layerTableModel.bind('change:geometry_types', function () {}, this);
    this._layerTableModel.columnsCollection.bind('change', function () {}, this);
  },

  _setDefaultProperties: function () {
    var styleType = this.get('type');
    // Get default aggregation and properties from factory and apply them
    var geometryType = this._layerTableModel.getGeometryType && this._layerTableModel.getGeometryType() || 'point';
    this.attributes = {
      type: styleType
    };
    this.set(StylesFactory.getDefaultStyleAttrsByType(styleType, geometryType));
  },

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

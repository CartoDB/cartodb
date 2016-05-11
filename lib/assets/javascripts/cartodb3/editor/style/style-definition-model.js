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
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._initBinds();

    // TODO: replace for a proper checker function
    this.set('type', 'simple');
  },

  _initBinds: function () {
    this.bind('change:type', this._setDefaultProperties, this);
  },

  _setDefaultProperties: function () {
    var styleType = this.get('type');
    // TODO: replace for the proper new query geometry type
    var geometryType = this._layerDefinitionModel._queryGeometryModel.get('geometry_type');
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

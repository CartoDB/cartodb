var cdb = require('cartodb.js');
var _ = require('underscore');
var StylesFactory = require('../../styles-factory');
var StyleFormComponents = require('../style-form-components-dictionary');

module.exports = cdb.core.Model.extend({

  initialize: function (attrs, opts) {
    if (!opts.styleModel) throw new Error('Style model is required');
    this._styleModel = opts.styleModel;
    this._querySchemaModel = opts.querySchemaModel;
    this._setProperties();
    this.schema = this._generateSchema();
    this._initBinds();
  },

  _initBinds: function () {
    this.bind('change', this._onChange, this);
  },

  _setProperties: function () {
    var geom = this._querySchemaModel.getGeometry();
    var fill = this._styleModel.get('fill');
    var isAggregatedType = _.contains(StylesFactory.getAggregationTypes(), this._styleModel.get('type'));

    if (isAggregatedType || (geom && geom.getSimpleType() === 'polygon')) {
      delete fill.size;
    }

    var attrs = {
      fill: fill,
      stroke: this._styleModel.get('stroke'),
      blending: this._styleModel.get('blending')
    };

    if (geom && geom.getSimpleType() === 'line') {
      delete attrs.stroke;
    }

    this.set(attrs);
  },

  _onChange: function () {
    this._styleModel.set(this.changed);
  },

  _generateSchema: function () {
    var self = this;
    return _.reduce(this.attributes, function (memo, value, key) {
      var d = StyleFormComponents[key];
      if (d) {
        memo[key] = d(self._querySchemaModel, self._styleModel.get('type'));
      }
      return memo;
    }, {});
  }

});

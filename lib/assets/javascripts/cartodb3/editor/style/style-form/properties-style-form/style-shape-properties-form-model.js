var cdb = require('cartodb.js');
var _ = require('underscore');
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
    var fill = this._styleModel.attributes.fill;

    if (geom && geom.getSimpleType() === 'polygon') {
      delete fill.size;
    }

    this.set({
      fill: fill,
      stroke: this._styleModel.get('stroke'),
      blending: this._styleModel.get('blending')
    });
  },

  _onChange: function () {
    this._styleModel.set(this.changed);
  },

  _generateSchema: function () {
    var self = this;
    return _.reduce(this.attributes, function (memo, value, key) {
      var d = StyleFormComponents[key];
      if (d) {
        memo[key] = d(self._querySchemaModel);
      }
      return memo;
    }, {});
  }

});

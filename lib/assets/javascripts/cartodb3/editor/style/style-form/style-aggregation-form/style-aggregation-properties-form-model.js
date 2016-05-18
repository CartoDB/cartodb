var cdb = require('cartodb.js');
var _ = require('underscore');
var StyleFormComponents = require('../style-form-components-dictionary');

module.exports = cdb.core.Model.extend({

  initialize: function (attrs, opts) {
    if (!opts.styleModel) throw new Error('Style model is required');
    this._styleModel = opts.styleModel;
    this._querySchemaModel = opts.querySchemaModel;
    this.schema = this._generateSchema();
    this._initBinds();
  },

  _initBinds: function () {
    this.bind('change', _.debounce(this._onChange.bind(this), 150), this);
  },

  _onChange: function () {
    this._styleModel.set('aggregation', this.changed);
  },

  _generateSchema: function () {
    var self = this;
    return _.reduce(this.attributes, function (memo, value, key) {
      var d = StyleFormComponents['aggregation-' + key];
      if (d) {
        memo[key] = d(self._querySchemaModel);
      }
      return memo;
    }, {});
  }

});

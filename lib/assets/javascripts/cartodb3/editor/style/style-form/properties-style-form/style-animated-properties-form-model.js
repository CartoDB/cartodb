var cdb = require('cartodb.js');
var _ = require('underscore');
var StyleFormComponents = require('../style-form-components-dictionary');

module.exports = cdb.core.Model.extend({

  initialize: function (attrs, opts) {
    if (!opts.styleModel) throw new Error('Style model is required');
    this._styleModel = opts.styleModel;
    this._querySchemaModel = opts.querySchemaModel;
    this.set(this._styleModel.get('animated'));
    this.schema = this._generateSchema();
    this._initBinds();
  },

  _initBinds: function () {
    this.bind('change', this._onChange, this);
  },

  _onChange: function () {
    var animatedData = _.extend(
      this.attributes,
      {
        overlap: this.get('overlap') === 'true',
        enabled: this._styleModel.get('animated').enabled
      }
    );
    this._styleModel.set('animated', animatedData);
  },

  _generateSchema: function () {
    var self = this;
    return _.reduce(this.attributes, function (memo, value, key) {
      var d = StyleFormComponents['animated-' + key];
      if (d) {
        memo[key] = d(self._querySchemaModel);
      }
      return memo;
    }, {});
  }

});

var cdb = require('cartodb.js');
var _ = require('underscore');
var StyleFormComponents = require('../style-form-components-dictionary');

module.exports = cdb.core.Model.extend({

  parse: function (r) {
    return _.extend(
      r,
      {
        overlap: r.overlap.toString()
      }
    );
  },

  initialize: function (attrs, opts) {
    if (!opts.styleModel) throw new Error('Style model is required');
    this._styleModel = opts.styleModel;
    this._querySchemaModel = opts.querySchemaModel;
    this.schema = this._generateSchema();
    this._initBinds();
  },

  _initBinds: function () {
    this.bind('change', this._onChange, this);
  },

  _onChange: function () {
    var labelsData = _.extend(
      {},
      this.attributes,
      {
        overlap: this.get('overlap') === 'true'
      }
    );

    // Don't update style model if there is no attribute selected
    if (labelsData.enabled && !labelsData.attribute) {
      return false;
    }

    this._styleModel.set('labels', labelsData);
  },

  _generateSchema: function () {
    var self = this;
    return _.reduce(this.attributes, function (memo, value, key) {
      var d = StyleFormComponents['labels-' + key];
      if (d) {
        memo[key] = d(self._querySchemaModel, self._styleModel.get('type'));
      }
      return memo;
    }, {});
  }

});

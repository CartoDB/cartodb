var _ = require('underscore');
var LegendBaseDefModel = require('./legend-base-definition-form-model');

module.exports = LegendBaseDefModel.extend({
  defaults: _.extend({}, LegendBaseDefModel.prototype.defaults,
    {
      type: 'category'
    }
  ),

  initialize: function (attrs, opts) {
    this._titlePlaceholder = _t('editor.legend.legend-form.by-color');
    LegendBaseDefModel.prototype.initialize.call(this, attrs, opts);
  }
});

var _ = require('underscore');
var LegendFormDefaultModel = require('./legend-form-default-model');

module.exports = LegendFormDefaultModel.extend({
  initialize: function (attrs, opts) {
    this._titlePlaceholder = _t('editor.legend.legend-form.by-size');
    LegendFormDefaultModel.prototype.initialize.call(this, attrs, opts);
  },

  _onChange: function () {
    console.log(this.toJSON());
  }
});

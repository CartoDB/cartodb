var _ = require('underscore');
var LegendFormDefaultModel = require('./legend-form-default-model');

module.exports = LegendFormDefaultModel.extend({
  defaults: {
    type: 'gradient'
  },

  initialize: function (attrs, opts) {
    this._titlePlaceholder = _t('editor.legend.legend-form.by-color');
    LegendFormDefaultModel.prototype.initialize.call(this, attrs, opts);
  },

  _generateSchema: function () {
    var schema = LegendFormDefaultModel.prototype._generateSchema.call(this);
    return _.extend(
      schema,
      {
        prefix: {
          type: 'Text'
        },
        suffix: {
          type: 'Text'
        }
      }
    );
  }
});

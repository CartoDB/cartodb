var _ = require('underscore');
var LegendFormDefaultModel = require('./legend-form-default-model');

module.exports = LegendFormDefaultModel.extend({
  initialize: function () {
    this._titlePlaceholder = _t('editor.legend.legenf-form.by-color');
    LegendFormDefaultModel.prototype.initialize.call(this);
  },

  _onChange: function () {
    console.log(this.toJSON());
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

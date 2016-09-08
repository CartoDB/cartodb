var _ = require('underscore');
var LegendFormDefaultModel = require('./legend-form-default-model');

module.exports = LegendFormDefaultModel.extend({
  defaults: {
    fill: {
      'color': {
        'fixed': '#fabada',
        'opacity': 0.9
      }
    }
  },

  initialize: function () {
    this._titlePlaceholder = _t('editor.legend.legend-form.by-color');
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
        fill: {
          type: 'Fill',
          title: _t('editor.legend.legend-form.fill'),
          options: [],
          editorAttrs: {
            color: {
              hidePanes: ['value']
            }
          }
        }
      }
    );
  }
});

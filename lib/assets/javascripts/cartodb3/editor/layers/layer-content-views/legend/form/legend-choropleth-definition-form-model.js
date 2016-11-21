var _ = require('underscore');
var LegendBaseDefModel = require('./legend-base-definition-form-model');

module.exports = LegendBaseDefModel.extend({
  defaults: _.extend({}, LegendBaseDefModel.prototype.defaults,
    {
      type: 'choropleth',
      prefix: '',
      suffix: ''
    }
  ),

  initialize: function (attrs, opts) {
    this._titlePlaceholder = _t('editor.legend.legend-form.by-color');
    LegendBaseDefModel.prototype.initialize.call(this, attrs, opts);
  },

  _generateSchema: function () {
    var schema = LegendBaseDefModel.prototype._generateSchema.call(this);
    return _.extend(
      schema,
      {
        suffix: {
          type: 'EnablerEditor',
          title: '',
          label: _t('editor.legend.legend-form.suffix'),
          editor: {
            type: 'Text'
          }
        },
        prefix: {
          type: 'EnablerEditor',
          title: '',
          label: _t('editor.legend.legend-form.prefix'),
          editor: {
            type: 'Text'
          }
        }
      }
    );
  }
});

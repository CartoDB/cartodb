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

    // title, prefix, suffix
    this.set(_.extend(
      {},
      _.pick(opts.legendDefinitionModel.attributes, 'title', 'prefix', 'suffix')
    ), {silent: true});

    LegendBaseDefModel.prototype.initialize.call(this, attrs, opts);
  },

  _generateSchema: function () {
    var schema = LegendBaseDefModel.prototype._generateSchema.call(this);
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

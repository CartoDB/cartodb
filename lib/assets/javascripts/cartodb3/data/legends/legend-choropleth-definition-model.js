var _ = require('underscore');
var LegendBaseDefModel = require('./legend-base-definition-model');

module.exports = LegendBaseDefModel.extend({
  defaults: _.extend({}, LegendBaseDefModel.prototype.defaults,
    {
      type: 'choropleth',
      prefix: '',
      sufix: ''
    }
  ),

  initialize: function (attrs, opts) {
    this._titlePlaceholder = _t('editor.legend.legend-form.by-color');
    LegendBaseDefModel.prototype.initialize.call(this, attrs, opts);
  },

  toJSON: function () {
    return _.extend(
      {},
      _.omit(this.attributes, 'prefix', 'sufix', 'preHTMLSnippet', 'postHTMLSnippet'),
      {
        pre_html: this.get('preHTMLSnippet'),
        post_html: this.get('postHTMLSnippet')
      },
      {
        definition: {
          prefix: this.get('prefix'),
          sufix: this.get('sufix')
        }
      }
    );
  },

  _generateSchema: function () {
    var schema = LegendBaseDefModel.prototype._generateSchema.call(this);
    return _.extend(
      schema,
      {
        prefix: {
          type: 'Text'
        },
        sufix: {
          type: 'Text'
        }
      }
    );
  }
});

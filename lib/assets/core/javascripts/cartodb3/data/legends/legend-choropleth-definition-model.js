var _ = require('underscore');
var LegendBaseDefModel = require('./legend-base-definition-model');

module.exports = LegendBaseDefModel.extend({
  defaults: _.extend({}, LegendBaseDefModel.prototype.defaults,
    {
      type: 'choropleth',
      prefix: '',
      suffix: '',
      leftLabel: '',
      rightLabel: ''
    }
  ),

  parse: function (r, opts) {
    var attrs = LegendBaseDefModel.prototype.parse.call(this, r);
    if (r.definition) {
      attrs.prefix = r.definition.prefix;
      attrs.suffix = r.definition.suffix;
      attrs.leftLabel = r.definition.left_label;
      attrs.rightLabel = r.definition.right_label;
    }
    return attrs;
  },

  toJSON: function () {
    var definition = {
      prefix: this.get('prefix'),
      suffix: this.get('suffix'),
      left_label: this.get('leftLabel'),
      right_label: this.get('rightLabel')
    };

    return _.extend(
      {},
      _.omit(this.attributes, 'prefix', 'suffix', 'leftLabel', 'rightLabel', 'postHTMLSnippet', 'preHTMLSnippet', 'customState'),
      {
        pre_html: this.get('preHTMLSnippet'),
        post_html: this.get('postHTMLSnippet')
      },
      {
        conf: {
          columns: this.get('customState')
        }
      },
      {
        definition: _.pick(definition, _.identity)
      }
    );
  }
});

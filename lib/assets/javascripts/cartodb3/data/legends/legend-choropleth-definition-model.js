var _ = require('underscore');
var LegendBaseDefModel = require('./legend-base-definition-model');

module.exports = LegendBaseDefModel.extend({
  defaults: _.extend({}, LegendBaseDefModel.prototype.defaults,
    {
      type: 'choropleth',
      prefix: '',
      suffix: ''
    }
  ),

  parse: function (r, opts) {
    var attrs = _.extend({}, r);
    if (r.definition) {
      attrs.prefix = r.definition.prefix;
      attrs.suffix = r.definition.suffix;
    }

    attrs.preHTMLSnippet = r.pre_html;
    attrs.postHTMLSnippet = r.post_html;
    return attrs;
  },

  toJSON: function () {
    return _.extend(
      {},
      _.omit(this.attributes, 'prefix', 'suffix', 'postHTMLSnippet', 'preHTMLSnippet'),
      {
        pre_html: this.get('preHTMLSnippet'),
        post_html: this.get('postHTMLSnippet')
      },
      {
        definition: {
          prefix: this.get('prefix'),
          suffix: this.get('suffix')
        }
      }
    );
  }
});

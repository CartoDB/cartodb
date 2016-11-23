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
    var attrs = LegendBaseDefModel.prototype.parse.call(this, r);
    if (r.definition) {
      attrs.prefix = r.definition.prefix;
      attrs.suffix = r.definition.suffix;
    }
    return attrs;
  },

  toJSON: function () {
    var definition = {
      prefix: this.get('prefix'),
      suffix: this.get('suffix')
    };

    return _.extend(
      {},
      _.omit(this.attributes, 'prefix', 'suffix', 'postHTMLSnippet', 'preHTMLSnippet'),
      {
        pre_html: this.get('preHTMLSnippet'),
        post_html: this.get('postHTMLSnippet')
      },
      {
        definition: _.pick(definition, _.identity)
      }
    );
  }
});

var _ = require('underscore');
var LegendBaseDefModel = require('./legend-base-definition-model');

module.exports = LegendBaseDefModel.extend({
  defaults: _.extend({}, LegendBaseDefModel.prototype.defaults,
    {
      type: 'category'
    }
  ),

  parse: function (r, opts) {
    var attrs = _.extend({}, r);
    attrs.preHTMLSnippet = r.pre_html;
    attrs.postHTMLSnippet = r.post_html;
    return attrs;
  },

  toJSON: function () {
    return _.extend(
      {},
      _.omit(this.attributes, 'postHTMLSnippet', 'preHTMLSnippet'),
      {
        pre_html: this.get('preHTMLSnippet'),
        post_html: this.get('postHTMLSnippet')
      }
    );
  }
});

var _ = require('underscore');
var LegendBaseDefModel = require('./legend-base-definition-model');

module.exports = LegendBaseDefModel.extend({
  defaults: _.extend({}, LegendBaseDefModel.prototype.defaults,
    {
      type: 'category'
    }
  ),

  toJSON: function () {
    return _.extend(
      {},
      _.omit(this.attributes, 'postHTMLSnippet', 'preHTMLSnippet', 'customState'),
      {
        pre_html: this.get('preHTMLSnippet'),
        post_html: this.get('postHTMLSnippet')
      },
      {
        conf: {
          columns: this.get('customState')
        }
      }
    );
  }
});

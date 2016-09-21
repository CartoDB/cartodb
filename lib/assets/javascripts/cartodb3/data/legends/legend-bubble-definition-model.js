var _ = require('underscore');
var LegendBaseDefModel = require('./legend-base-definition-model');

module.exports = LegendBaseDefModel.extend({
  defaults: _.extend({}, LegendBaseDefModel.prototype.defaults,
    {
      type: 'bubble',
      fillColor: '#fabada'
    }
  ),

  parse: function (r, opts) {
    var attrs = _.extend({}, r);
    if (r.definition) {
      attrs.fillColor = r.definition.color;
    }

    attrs.preHTMLSnippet = r.pre_html;
    attrs.postHTMLSnippet = r.post_html;
    return attrs;
  },

  toJSON: function () {
    return _.extend(
      {},
      _.omit(this.attributes, 'fill', 'fillColor', 'postHTMLSnippet', 'preHTMLSnippet'),
      {
        pre_html: this.get('preHTMLSnippet'),
        post_html: this.get('postHTMLSnippet')
      },
      {
        definition: {
          color: this.get('fillColor')
        }
      }
    );
  }
});

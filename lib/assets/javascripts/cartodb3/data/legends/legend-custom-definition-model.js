var _ = require('underscore');
var LegendBaseDefModel = require('./legend-base-definition-model');

module.exports = LegendBaseDefModel.extend({
  defaults: _.extend({}, LegendBaseDefModel.prototype.defaults,
    {
      type: 'custom',
      items: []
    }
  ),

  parse: function (r, opts) {
    var attrs = _.extend({}, r);

    if (r.definition) {
      attrs.items = r.definition.categories.map(function (item) {
        return {
          name: item.title,
          color: item.color
        };
      });
    }
    attrs.preHTMLSnippet = r.pre_html;
    attrs.postHTMLSnippet = r.post_html;
    return attrs;
  },

  toJSON: function () {
    return _.extend(
      {},
      _.omit(this.attributes, 'items', 'postHTMLSnippet', 'preHTMLSnippet'),
      {
        pre_html: this.get('preHTMLSnippet'),
        post_html: this.get('postHTMLSnippet')
      },
      {
        definition: {
          categories: this.get('items').map(function (item) {
            return {
              title: item.name,
              color: item.color
            };
          })
        }
      }
    );
  }
});

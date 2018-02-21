var _ = require('underscore');
var LegendBaseDefModel = require('./legend-base-definition-model');
var StyleHelper = require('builder/helpers/style');

module.exports = LegendBaseDefModel.extend({
  defaults: _.extend({}, LegendBaseDefModel.prototype.defaults,
    {
      type: 'custom',
      items: [],
      html: ''
    }
  ),

  parse: function (r, opts) {
    var attrs = LegendBaseDefModel.prototype.parse.call(this, r);

    if (r.definition) {
      attrs.items = r.definition.categories;
      attrs.html = r.definition.html || '';
    } else {
      attrs.items = StyleHelper.getStyleCategories(opts.layerDefinitionModel.styleModel);
    }
    attrs.type = 'custom';
    return attrs;
  },

  toJSON: function () {
    var definition = {
      categories: this.get('items').map(function (item) {
        return {
          title: (item.title || '').toString(),
          color: item.color,
          icon: item.image || item.icon
        };
      })
    };

    if (this.hasCustomHtml()) {
      definition.html = this.get('html');
    }

    return _.extend(
      {},
      _.omit(this.attributes, 'items', 'html', 'postHTMLSnippet', 'preHTMLSnippet', 'customState'),
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
        definition: definition
      }
    );
  },

  hasCustomHtml: function () {
    return this.get('html') !== '';
  }
});

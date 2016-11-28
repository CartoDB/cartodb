var _ = require('underscore');
var LegendBaseDefModel = require('./legend-base-definition-model');
var LegendColorHelper = require('../../editor/layers/layer-content-views/legend/form/legend-color-helper');

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
    var fill;
    var stroke;
    var color;

    if (r.definition) {
      attrs.items = r.definition.categories;
      attrs.html = r.definition.html;
    } else {
      fill = opts.layerDefinitionModel.styleModel.get('fill');
      stroke = opts.layerDefinitionModel.styleModel.get('stroke');
      color = fill.color || stroke.color;
      attrs.items = this.inheritStyleCategories(color);
    }
    return attrs;
  },

  toJSON: function () {
    return _.extend(
      {},
      _.omit(this.attributes, 'items', 'html', 'postHTMLSnippet', 'preHTMLSnippet'),
      {
        pre_html: this.get('preHTMLSnippet'),
        post_html: this.get('postHTMLSnippet')
      },
      {
        definition: {
          categories: this.get('items').map(function (item) {
            return {
              title: item.title || _t('editor.legend.legend-form.untitled'),
              color: item.color
            };
          }),
          html: this.get('html')
        }
      }
    );
  },

  inheritStyleCategories: function (color) {
    var range = 0;
    var items = [];

    if (color.range) {
      range = color.range.length;

      items = _.range(range).map(function (v, index) {
        return {
          color: color.range[index],
          title: color.domain && LegendColorHelper.unquoteColor(color.domain[index]) || ''
        };
      });
    } else if (color.fixed) {
      items = [{
        color: color.fixed,
        title: ''
      }];
    }

    return items;
  }
});

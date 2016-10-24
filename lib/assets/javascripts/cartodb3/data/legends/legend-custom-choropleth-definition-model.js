var _ = require('underscore');
var LegendBaseDefModel = require('./legend-base-definition-model');

module.exports = LegendBaseDefModel.extend({
  defaults: _.extend({}, LegendBaseDefModel.prototype.defaults,
    {
      type: 'custom_choropleth',
      prefix: '',
      suffix: '',
      colors: []
    }
  ),

  parse: function (r, opts) {
    var attrs = LegendBaseDefModel.prototype.parse.call(this, r);
    var fill;
    var stroke;
    var color;

    if (r.definition) {
      attrs.colors = r.definition.colors;
      attrs.prefix = r.definition.prefix;
      attrs.suffix = r.definition.suffix;
    } else {
      fill = opts.layerDefinitionModel.styleModel.get('fill');
      stroke = opts.layerDefinitionModel.styleModel.get('stroke');
      color = fill.color || stroke.color;
      attrs.colors = this._inheritStyleColors(color);
    }
    return attrs;
  },

  toJSON: function () {
    return _.extend(
      {},
      _.omit(this.attributes, 'prefix', 'suffix', 'colors', 'postHTMLSnippet', 'preHTMLSnippet'),
      {
        pre_html: this.get('preHTMLSnippet'),
        post_html: this.get('postHTMLSnippet')
      },
      {
        definition: {
          colors: this.get('colors').map(function (item) {
            return {
              color: item.color
            };
          }),
          prefix: this.get('prefix'),
          suffix: this.get('suffix')
        }
      }
    );
  },

  _inheritStyleColors: function (color) {
    var range = 0;
    var colors = [];

    if (color.range) {
      range = color.range.length;

      colors = _.range(range).map(function (v, index) {
        return {
          color: color.range[index]
        };
      });
    }

    return colors;
  }
});

var _ = require('underscore');
var LegendBaseDefModel = require('./legend-base-definition-model');

module.exports = LegendBaseDefModel.extend({
  defaults: _.extend({}, LegendBaseDefModel.prototype.defaults,
    {
      type: 'custom_choropleth',
      prefix: '',
      suffix: '',
      colors: [],
      leftLabel: '',
      rightLabel: ''
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
      attrs.leftLabel = r.definition.left_label;
      attrs.rightLabel = r.definition.right_label;
    } else {
      fill = opts.layerDefinitionModel.styleModel.get('fill');
      stroke = opts.layerDefinitionModel.styleModel.get('stroke');
      color = fill.color || stroke.color;
      attrs.colors = this._inheritStyleColors(color);
    }
    return attrs;
  },

  toJSON: function () {
    var definition = {
      prefix: this.get('prefix'),
      suffix: this.get('suffix'),
      left_label: this.get('leftLabel'),
      right_label: this.get('rightLabel'),
      colors: this.get('colors').map(function (item) {
        return {
          color: item.color
        };
      })
    };

    return _.extend(
      {},
      _.omit(this.attributes, 'prefix', 'suffix', 'leftLabel', 'rightLabel', 'colors', 'postHTMLSnippet', 'preHTMLSnippet', 'customState'),
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

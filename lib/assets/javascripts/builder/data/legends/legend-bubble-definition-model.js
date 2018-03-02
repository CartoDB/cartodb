var _ = require('underscore');
var LegendBaseDefModel = require('./legend-base-definition-model');
var LegendColorHelper = require('builder/editor/layers/layer-content-views/legend/form/legend-color-helper');
var DEFAULT_BUBBLES_COLOR = '#999999';

module.exports = LegendBaseDefModel.extend({
  defaults: _.extend({}, LegendBaseDefModel.prototype.defaults,
    {
      type: 'bubble',
      fillColor: DEFAULT_BUBBLES_COLOR,
      topLabel: '',
      bottomLabel: ''
    }
  ),

  parse: function (r, opts) {
    var attrs = LegendBaseDefModel.prototype.parse.call(this, r);

    if (opts.layerDefinitionModel) {
      if (r.definition) {
        attrs.fillColor = r.definition.color;
        attrs.topLabel = r.definition.top_label;
        attrs.bottomLabel = r.definition.bottom_label;
      } else {
        attrs.fillColor = this._inheritStyleColor(opts.layerDefinitionModel.styleModel);
      }
    }
    return attrs;
  },

  toJSON: function () {
    return _.extend(
      {},
      _.omit(this.attributes, 'fill', 'fillColor', 'topLabel', 'bottomLabel', 'postHTMLSnippet', 'preHTMLSnippet', 'customState'),
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
        definition: {
          color: this.get('fillColor'),
          top_label: this.get('topLabel'),
          bottom_label: this.get('bottomLabel')
        }
      }
    );
  },

  _inheritStyleColor: function (styleModel) {
    var fill = styleModel.get('fill');
    var stroke = styleModel.get('stroke');
    var color = (fill && fill.color) || (stroke && stroke.color);

    if (color && (color.fixed || color.range)) {
      return LegendColorHelper.getBubbles(color).color.fixed;
    } else {
      return DEFAULT_BUBBLES_COLOR;
    }
  }
});

var _ = require('underscore');
var LegendBaseDefModel = require('./legend-base-definition-model');
var LegendColorHelper = require('../../editor/layers/layer-content-views/legend/form/legend-color-helper');

module.exports = LegendBaseDefModel.extend({
  defaults: _.extend({}, LegendBaseDefModel.prototype.defaults,
    {
      type: 'bubble',
      fillColor: null
    }
  ),

  parse: function (r, opts) {
    var attrs = LegendBaseDefModel.prototype.parse.call(this, r);
    if (r.definition) {
      attrs.fillColor = r.definition.color;
    } else {
      attrs.fillColor = this._inheritStyleColor(opts.layerDefinitionModel.styleModel.get('fill').color);
    }
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
  },

  _inheritStyleColor: function (color) {
    return LegendColorHelper.getBubbles(color).color.fixed;
  }
});

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

  initialize: function (attrs, opts) {
    LegendBaseDefModel.prototype.initialize.call(this, attrs, opts);
    this._initBinds();
  },

  parse: function (r, opts) {
    var attrs = LegendBaseDefModel.prototype.parse.call(this, r);

    if (opts.layerDefinitionModel) {
      if (r.definition) {
        attrs.fillColor = r.definition.color;
      } else {
        attrs.fillColor = this._inheritStyleColor(opts.layerDefinitionModel.styleModel);
      }
    }
    return attrs;
  },

  _initBinds: function () {
    this.listenTo(this.layerDefinitionModel, 'change:cartocss', this._onChangeStyle.bind(this));
  },

  _onChangeStyle: function () {
    this.set('fillColor', this._inheritStyleColor(this.layerDefinitionModel.styleModel));
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

  _inheritStyleColor: function (styleModel) {
    var fill = styleModel.get('fill');
    var stroke = styleModel.get('stroke');
    var color = fill.color || stroke.color;
    return LegendColorHelper.getBubbles(color).color.fixed;
  }
});

var _ = require('underscore');
var StylesFactory = require('builder/editor/style/styles-factory');
var StyleFormDefaultModel = require('builder/editor/style/style-form/style-form-default-model');
var MetricsTracker = require('builder/components/metrics/metrics-tracker');

var TYPES = {
  HEATMAP: 'heatmap',
  ANIMATION: 'animation'
};

module.exports = StyleFormDefaultModel.extend({

  parse: function (r) {
    var geom = r.geom;
    var attrs = {
      style: r.style,
      fill: r.fill,
      stroke: r.stroke,
      blending: r.blending
    };
    var isAggregatedType = _.contains(StylesFactory.getAggregationTypes(), r.type);

    if (isAggregatedType || geom === 'polygon') {
      if (attrs.fill.size) {
        attrs.fill = _.omit(attrs.fill, 'size');
      }
    }

    if (geom === 'line') {
      attrs = _.omit(attrs, 'fill');
    }

    if (r.type === TYPES.HEATMAP || (r.type === TYPES.ANIMATION && r.style === 'heatmap')) {
      attrs = _.omit(attrs, 'stroke', 'blending');
    }

    if (r.type !== TYPES.ANIMATION) {
      attrs = _.omit(attrs, 'style');
    }

    return attrs;
  },

  _onChange: function () {
    this._styleModel.set(_.clone(this.attributes));

    MetricsTracker.track('Changed default geometry');
  }
});

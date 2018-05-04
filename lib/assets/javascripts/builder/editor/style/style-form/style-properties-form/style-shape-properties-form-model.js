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
      fill: r.fill, // < TODO delete
      fillSize: r.fill.size,
      // fillSize: r.fill.size.fixed, //
      // fillColor: r.fill.color,
      stroke: r.stroke, // < TODO delete
      // strokeSize: r.stroke.size, // <
      // strokeColor: r.stroke.color,
      blending: r.blending
    };
    var isAggregatedType = _.contains(StylesFactory.getAggregationTypes(), r.type);

    if (isAggregatedType || geom === 'polygon') {
      if (attrs.fill.size) {
        attrs.fill = _.omit(attrs.fill, 'size');
        attrs = _.omit(attrs, 'fillSize'); // <
      }
    }

    if (geom === 'line') {
      attrs = _.omit(attrs, 'fill');
      attrs = _.omit(attrs, 'fillSize'); // <
      // attrs = _.omit(attrs, 'fillColor'); // <
    }

    if (r.type === TYPES.HEATMAP || (r.type === TYPES.ANIMATION && r.style === 'heatmap')) {
      attrs = _.omit(attrs, 'stroke', 'blending');
      attrs = _.omit(attrs, 'strokeSize'); // <
      // attrs = _.omit(attrs, 'strokeColor'); // <
    }

    if (r.type !== TYPES.ANIMATION) {
      attrs = _.omit(attrs, 'style');
    }

    return attrs;
  },

  _onChange: function () {
    // TODO (just fixed size case)
    var fillSize = this.attributes.fillSize;
    // if (fillSize) this.attributes.fill.size.fixed = fillSize;
    if (fillSize) this.attributes.fill.size = fillSize;

    this._styleModel.set(_.clone(this.attributes));

    MetricsTracker.track('Changed default style');
  }
});

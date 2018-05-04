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

    var colorAttrs = _.omit(r.fill, 'size');

    var attrs = {
      style: r.style,
      fill: r.fill, // < TODO delete
      // fillSize: r.fill.size, // <
      fillColor: colorAttrs,
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
      attrs = _.omit(attrs, 'fillColor'); // <
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
    var fill = this._getUpdatedFillAttributes();
    this._styleModel.set('fill', fill);

    MetricsTracker.track('Changed default geometry');
  },

  _getUpdatedFillAttributes: function () { // FIXME fillColor
    var fillAttributes = _.clone(this.attributes);
    return _.extend(fillAttributes.fill, fillAttributes.fillColor);
  }
});

var _ = require('underscore');
var StylesFactory = require('builder/editor/style/styles-factory');
var StyleFormDefaultModel = require('builder/editor/style/style-form/style-form-default-model');
var MetricsTracker = require('builder/components/metrics/metrics-tracker');

var TYPES = {
  HEATMAP: 'heatmap',
  ANIMATION: 'animation'
};

module.exports = StyleFormDefaultModel.extend({

  parse: function (response) {
    var geom = response.geom;

    var colorAttrs = _.omit(response.fill, 'size');

    var attrs = {
      style: response.style,
      fill: response.fill, // < TODO delete
      // fillSize: r.fill.size, // <
      fillColor: colorAttrs,
      stroke: response.stroke, // < TODO delete
      // strokeSize: r.stroke.size, // <
      // strokeColor: r.stroke.color,
      blending: response.blending
    };
    var isAggregatedType = _.contains(StylesFactory.getAggregationTypes(), response.type);

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

    if (response.type === TYPES.HEATMAP || (response.type === TYPES.ANIMATION && response.style === 'heatmap')) {
      attrs = _.omit(attrs, 'stroke', 'blending');
      attrs = _.omit(attrs, 'strokeSize'); // <
      // attrs = _.omit(attrs, 'strokeColor'); // <
    }

    if (response.type !== TYPES.ANIMATION) {
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

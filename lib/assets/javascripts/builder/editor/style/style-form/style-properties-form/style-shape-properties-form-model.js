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
    var fields = {
      style: response.style,
      fill: response.fill, // < TODO delete
      fillSize: response.fill.size,
      // fillColor: response.fill.color,
      stroke: response.stroke, // < TODO delete
      // strokeSize: response.stroke.size, // <
      // strokeColor: response.stroke.color,
      blending: response.blending
    };
    var isAggregatedType = _.contains(StylesFactory.getAggregationTypes(), response.type);

    if (isAggregatedType || geom === 'polygon') {
      if (fields.fill.size) {
        fields.fill = _.omit(fields.fill, 'size');
        fields = _.omit(fields, 'fillSize'); // <
      }
    }

    if (geom === 'line') {
      fields = _.omit(fields, 'fill');
      fields = _.omit(fields, 'fillSize'); // <
      // fields = _.omit(fields, 'fillColor'); // <
    }

    if (response.type === TYPES.HEATMAP || (response.type === TYPES.ANIMATION && response.style === 'heatmap')) {
      fields = _.omit(fields, 'stroke', 'blending');
      fields = _.omit(fields, 'strokeSize'); // <
      // fields = _.omit(fields, 'strokeColor'); // <
    }

    if (response.type !== TYPES.ANIMATION) {
      fields = _.omit(fields, 'style');
    }

    return fields;
  },

  _onChange: function () {
    // TODO (just fixed size case)
    var fillSize = this.attributes.fillSize;
    if (fillSize) this.attributes.fill.size = fillSize;

    this._styleModel.set(_.clone(this.attributes));

    MetricsTracker.track('Changed default style');
  }
});

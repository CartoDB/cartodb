var _ = require('underscore');
var StylesFactory = require('builder/editor/style/styles-factory');
var StyleFormDefaultModel = require('builder/editor/style/style-form/style-form-default-model');
var StyleConstants = require('builder/components/form-components/_constants/_style');
var MetricsTracker = require('builder/components/metrics/metrics-tracker');

var FILL_PROPERTIES = [
  { source: 'size', value: 'fillSize' },
  { source: 'color', value: 'fillColor' }
];

module.exports = StyleFormDefaultModel.extend({

  parse: function (response) {
    var geom = response.geom;

    var fields = {
      style: response.style,
      fillSize: response.fill.size,
      fillColor: response.fill.color,
      stroke: response.stroke,
      blending: response.blending
    };

    var isAggregatedType = _.contains(StylesFactory.getAggregationTypes(), response.type);
    if (isAggregatedType || geom === 'polygon') {
      fields = _.omit(fields, 'fillSize');
    }

    if (geom === 'line') {
      fields = _.omit(fields, 'fillSize');
      fields = _.omit(fields, 'fillColor');
    }

    if (response.type === StyleConstants.TYPE.HEATMAP || response.type === StyleConstants.TYPE.ANIMATION && response.style === StyleConstants.TYPE.HEATMAP) {
      fields = _.omit(fields, 'stroke', 'blending');
    }

    if (response.type !== StyleConstants.TYPE.ANIMATION) {
      fields = _.omit(fields, 'style');
    }

    return fields;
  },

  _onChange: function () {
    var attrs = this._updatePartialProperties();

    this._styleModel.set(attrs);

    MetricsTracker.track('Changed default style');
  },

  _updatePartialProperties: function () {
    var attrs = _.clone(this.attributes);
    attrs.fill = _.extend(this._styleModel.get('fill'));

    FILL_PROPERTIES.forEach(function (property) {
      if (attrs[property.value]) {
        attrs.fill[property.source] = attrs[property.value];
      }
    });

    // TODO: same with STROKE_PROPERTIES

    return attrs;
  }
});

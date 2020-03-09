var _ = require('underscore');
var StylesFactory = require('builder/editor/style/styles-factory');
var StyleFormDefaultModel = require('builder/editor/style/style-form/style-form-default-model');
var StyleConstants = require('builder/components/form-components/_constants/_style');
var MetricsTracker = require('builder/components/metrics/metrics-tracker');
var MetricsTypes = require('builder/components/metrics/metrics-types');

var FILL_PROPERTIES = [
  { source: 'size', value: 'fillSize' },
  { source: 'color', value: 'fillColor' }
];

var STROKE_PROPERTIES = [
  { source: 'size', value: 'strokeSize' },
  { source: 'color', value: 'strokeColor' }
];

module.exports = StyleFormDefaultModel.extend({

  parse: function (response) {
    var geom = response.geom;

    var fields = {
      style: response.style,
      fillSize: response.fill && response.fill.size,
      fillColor: response.fill && response.fill.color,
      strokeSize: response.stroke && response.stroke.size,
      strokeColor: response.stroke && response.stroke.color,
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

    if (response.type === StyleConstants.Type.HEATMAP || response.type === StyleConstants.Type.ANIMATION && response.style === StyleConstants.Type.HEATMAP) {
      fields = _.omit(fields, 'strokeSize', 'strokeColor', 'blending');
    }

    if (response.type !== StyleConstants.Type.ANIMATION) {
      fields = _.omit(fields, 'style');
    }

    return fields;
  },

  _onChange: function () {
    var attrs = this._getUpdatedPartialProperties();

    this._styleModel.set(attrs);

    MetricsTracker.track(MetricsTypes.CHANGED_DEFAULT_GEOMETRY);
  },

  _getUpdatedPartialProperties: function () {
    var attrs = _.clone(this.attributes);

    this._setProperties(FILL_PROPERTIES, 'fill', attrs);
    this._setProperties(STROKE_PROPERTIES, 'stroke', attrs);

    return attrs;
  },

  _setProperties: function (properties, propertyName, attrs) {
    attrs[propertyName] = _.extend(this._styleModel.get(propertyName));
    properties.forEach(function (property) {
      if (attrs[property.value]) {
        attrs[propertyName][property.source] = attrs[property.value];
      }
    });

    return attrs;
  }
});

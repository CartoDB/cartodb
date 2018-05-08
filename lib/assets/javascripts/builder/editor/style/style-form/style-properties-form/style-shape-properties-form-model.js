var _ = require('underscore');
var StylesFactory = require('builder/editor/style/styles-factory');
var StyleFormDefaultModel = require('builder/editor/style/style-form/style-form-default-model');
var MetricsTracker = require('builder/components/metrics/metrics-tracker');

var TYPES = {
  HEATMAP: 'heatmap',
  ANIMATION: 'animation'
};

var FILL_PROPERTIES = ['fillColor', 'fillSize'];

module.exports = StyleFormDefaultModel.extend({

  parse: function (response) {
    var geom = response.geom;

    var fields = {
      style: response.style,
      fillColor: _.omit(response.fill, 'size'), // FIXME
      fillSize: _.omit(response.fill, 'color'),
      stroke: response.stroke,
      blending: response.blending
    };

    var isAggregatedType = _.contains(StylesFactory.getAggregationTypes(), response.type);

    // TODO
    // if (isAggregatedType || geom === 'polygon') {
    //   if (fields.fill.size) {
    //     fields.fill = _.omit(fields.fill, 'size');
    //   }
    // }

    if (geom === 'line') {
      fields = _.omit(fields, 'fillColor');
    }

    if (response.type === TYPES.HEATMAP || (response.type === TYPES.ANIMATION && response.style === 'heatmap')) {
      fields = _.omit(fields, 'stroke', 'blending');
      fields = _.omit(fields, 'strokeSize');
    }

    if (response.type !== TYPES.ANIMATION) {
      fields = _.omit(fields, 'style');
    }

    return fields;
  },

  _onChange: function () {
    var attrs = this._updateFillProperties();

    this._styleModel.set(attrs);
    MetricsTracker.track('Changed default geometry');
  },

  _updateFillProperties: function () {
    var attrs = _.clone(this.attributes);

    FILL_PROPERTIES.forEach(function (property) {
      if (attrs[property]) {
        attrs.fill = _.extend(this._styleModel.get('fill'), attrs[property]);
      }
    }.bind(this));

    return attrs;
  }
});

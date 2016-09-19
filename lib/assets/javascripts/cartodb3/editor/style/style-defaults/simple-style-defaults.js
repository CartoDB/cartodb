var _ = require('underscore');
var StyleDefaults = require('./style-defaults');
var defaultStyleValue = require('../../../data/default-cartography.json');
var defaultFormValues = require('../../../data/default-form-styles.json');

module.exports = _.defaults({

  generateAttributes: function (geometryType) {
    return _.extend(
      {},
      this._getFillAttrs(geometryType),
      this._getStrokeAttrs(geometryType),
      {
        blending: defaultFormValues.blending
      },
      this._getAggrAttrs(geometryType),
      this._getLabelsAttrs()
    );
  },

  _getFillAttrs: function (geometryType) {
    return _.pick(defaultStyleValue['simple'][geometryType], 'fill');
  },

  _getStrokeAttrs: function (geometryType) {
    return _.pick(defaultStyleValue['simple'][geometryType], 'stroke');
  },

  _getAggrAttrs: function () {
    return {
      aggregation: defaultFormValues.aggregation
    };
  },

  _getLabelsAttrs: function () {
    return {
      labels: defaultFormValues.labels
    };
  }
}, StyleDefaults);

var _ = require('underscore');
var StyleDefaults = require('./style-defaults');
var defaultStyleValue = require('../../../data/default-cartography.json');

module.exports = _.defaults({

  DEFAULT_STROKE_COLOR: '#FFFFFF',
  DEFAULT_LABEL_COLOR: '#6F808D',
  DEFAULT_FILL_OPACITY: 0.9,

  generateAttributes: function (geometryType) {
    return _.extend(
      {},
      this._getFillAttrs(geometryType),
      this._getStrokeAttrs(geometryType),
      {
        blending: 'none'
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
      aggregation: {}
    };
  },

  _getLabelsAttrs: function () {
    return {
      labels: {
        enabled: false,
        attribute: null,
        font: 'DejaVu Sans Book',
        fill: {
          'size': {
            fixed: 10
          },
          'color': {
            fixed: this.DEFAULT_LABEL_COLOR,
            opacity: 1
          }
        },
        halo: {
          'size': {
            fixed: 1
          },
          'color': {
            fixed: this.DEFAULT_STROKE_COLOR,
            opacity: 1
          }
        },
        offset: -10,
        overlap: true,
        placement: 'point'
      }
    };
  }
}, StyleDefaults);

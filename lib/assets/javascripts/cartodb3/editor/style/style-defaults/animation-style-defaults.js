var _ = require('underscore');
var SimpleStyleDefaults = require('./simple-style-defaults');
var defaultStyleValue = require('../../../data/default-cartography.json');

module.exports = _.defaults({

  generateAttributes: function (geometryType) {
    return _.extend(
      this._getStyleTypeAttrs(),
      this._getFillAttrs(geometryType),
      this._getStrokeAttrs(geometryType),
      {
        blending: 'lighter'
      },
      this._getAggrAttrs(geometryType),
      this._getAnimatedAttrs(geometryType)
    );
  },

  _getStyleTypeAttrs: function () {
    return {
      style: 'simple'
    };
  },

  _getStrokeAttrs: function (geometryType) {
    return _.pick(defaultStyleValue['simple'][geometryType], 'stroke');
  },

  _getFillAttrs: function (geometryType) {
    return _.pick(defaultStyleValue['simple'][geometryType], 'fill');
  },

  _getAnimatedAttrs: function (geometryType) {
    return {
      animated: {
        attribute: null,
        overlap: false,
        duration: 30,
        steps: 256,
        trails: 2,
        resolution: 4
      }
    };
  },

  _getAggrAttrs: function (geometryType) {
    return {
      aggregation: {}
    };
  }
}, SimpleStyleDefaults);

var _ = require('underscore');
var SimpleStyleDefaults = require('./simple-style-defaults');

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

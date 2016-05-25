var _ = require('underscore');
var SimpleStyleDefaults = require('./simple-style-defaults');

module.exports = _.defaults({

  generateAttributes: function (geometryType) {
    return _.extend(
      this._getFillAttrs(geometryType),
      this._getAggrAttrs(geometryType),
      this._getAnimatedAttrs(geometryType)
    );
  },

  _getFillAttrs: function (geometryType) {
    var attrs = {
      fill: {
        'size': {
          fixed: 35
        },
        'color': {
          range: ['blue', 'cyan', 'lightgreen', 'yellow', 'orange', 'red']
        }
      }
    };

    return attrs;
  },

  _getAnimatedAttrs: function (geometryType) {
    return {
      animated: {
        enabled: false,
        attribute: null,
        overlap: 'linear',
        duration: 30,
        steps: 1,
        resolution: 2,
        trails: 2
      }
    };
  },

  _getAggrAttrs: function (geometryType) {
    return {
      aggregation: {
        size: 16,
        value: {
          operator: 'count',
          attribute: ''
        }
      }
    };
  }
}, SimpleStyleDefaults);

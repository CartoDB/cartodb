var _ = require('underscore');
var SimpleStyleDefaults = require('./simple-style-defaults');

module.exports = _.defaults({

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

    if (geometryType !== 'polygon') {
      attrs['fill']['size'] = {
        fixed: geometryType === 'point' ? 10 : 2
      };
    }

    return attrs;
  },

  _getAnimatedAttrs: function (geometryType) {
    return {
      animated: {
        enabled: false,
        attribute: null,
        overlap: 'linear',
        duration: 30,
        steps: 256,
        resolution: 2,
        trails: 2
      }
    };
  },

  _getAggrAttrs: function (geometryType) {
    return {
      aggregation: {
        resolution: 16,
        value: {
          operator: 'count',
          attribute: ''
        }
      }
    };
  },

  _getStrokeAttrs: function (geometryType) {
    return {};
  }
}, SimpleStyleDefaults);

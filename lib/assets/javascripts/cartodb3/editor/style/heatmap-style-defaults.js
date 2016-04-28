var _ = require('underscore');
var StyleDefaults = require('./style-defaults');

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
      torque: {
        enabled: false,
        overlap: 'linear',
        duration: 30,
        steps: 256,
        resolution: 2,
        trails: 2
      }
    };
  },

  _getStrokeAttrs: function (geometryType) {
    return {};
  }
}, StyleDefaults);

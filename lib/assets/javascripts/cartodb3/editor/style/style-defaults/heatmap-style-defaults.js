var _ = require('underscore');
var SimpleStyleDefaults = require('./simple-style-defaults');
var rampList = require('cartocolor');

module.exports = _.defaults({

  generateAttributes: function (geometryType) {
    return _.extend(
      this._getFillAttrs(geometryType),
      this._getResAttrs(geometryType),
      this._getAggrAttrs(geometryType),
      this._getAnimatedAttrs(geometryType)
    );
  },

  _getFillAttrs: function (geometryType) {
    var attrs = {
      fill: {
        'size': {
          fixed: 45
        },
        'color': {
          attribute: 'points_agg',
          range: rampList.ag_Sunset[7].reverse(),
          // ['#00F', '#0FF', '#90EE90', '#FF0', '#FFA500', '#F00'],
          bins: 6
        }
      }
    };

    return attrs;
  },

  _getResAttrs: function (geometryType) {
    return {
      resolution: 4
    };
  },

  _getAnimatedAttrs: function (geometryType) {
    return {
      animated: {
        enabled: false,
        attribute: null,
        overlap: false,
        duration: 30,
        steps: 256,
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

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
          range: [ '#00F', '#0FF', '#90EE90', '#FF0', '#FFA500', '#F00']
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
        overlap: false,
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

var _ = require('underscore');
var SimpleStyleDefaults = require('./simple-style-defaults');
var rampList = require('cartocolor');

module.exports = _.defaults({

  generateAttributes: function (geometryType) {
    return _.extend(
      this._getFillAttrs(geometryType),
      this._getAnimatedAttrs()
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

  _getAnimatedAttrs: function (geometryType) {
    return {
      animated: {
        attribute: 'cartodb_id',
        overlap: false,
        duration: 30,
        steps: 1,
        trails: 0,
        resolution: 4
      }
    };
  }

}, SimpleStyleDefaults);

var _ = require('underscore');
var SimpleStyleDefaults = require('./simple-style-defaults');
var rampList = require('cartocolor');

module.exports = _.defaults({

  generateAttributes: function (geometryType) {
    return _.extend(
      this._getFillAttrs(geometryType),
      this._getAggrAttrs(),
      this._getAnimatedAttrs(),
      this._getLabelsAttrs()
    );
  },

  _getFillAttrs: function (geometryType) {
    var attrs = {
      fill: {
        'size': {
          fixed: 45
        },
        'color': {
          attribute: 'cartodb_id',
          range: rampList.ag_Sunset[7],
          bins: 6
        }
      }
    };

    return attrs;
  },

  _getAggrAttrs: function () {
    return {
      aggregation: {}
    };
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
  },

  _getLabelsAttrs: function () {
    return {
      labels: {}
    };
  }

}, SimpleStyleDefaults);

var _ = require('underscore');
var SimpleStyleDefaults = require('./simple-style-defaults');
var rampList = require('cartocolor');

module.exports = _.defaults({

  DEFAULT_FILL_COLOR: '#3B3B58',
  DEFAULT_STROKE_COLOR: '#FFF',

  _getAggrAttrs: function (geometryType) {
    return {
      aggregation: {
        size: 6,
        value: {
          operator: 'count',
          attribute: ''
        }
      }
    };
  },

  _getStrokeAttrs: function (geometryType) {
    return {
      stroke: {
        'size': {
          fixed: 0.5
        },
        'color': {
          fixed: this.DEFAULT_STROKE_COLOR,
          opacity: 1
        }
      }
    };
  },

  _getFillAttrs: function (geometryType) {
      return {
        fill: {
          'color': {
            attribute: "agg_value",
            bins: "3",
            quantification: "jenks",
            range: rampList.Magnt1[3]
          }
        }
      };
  }

}, SimpleStyleDefaults);

var _ = require('underscore');
var SimpleStyleDefaults = require('./simple-style-defaults');
var defaultFormValues = require('../../../data/default-form-styles.json');
var rampList = require('cartocolor');

module.exports = _.defaults({

  _getAggrAttrs: function (geometryType) {
    return {
      aggregation: {
        size: 10,
        value: {
          operator: 'count',
          attribute: ''
        }
      }
    };
  },

  _getStrokeAttrs: function (geometryType) {
    return {
      stroke: defaultFormValues.stroke
    };
  },

  _getFillAttrs: function (geometryType) {
    return {
      fill: {
        'color': {
          attribute: 'agg_value',
          bins: '5',
          quantification: 'quantiles',
          // TODO: flip the ramp when basemap is black
          // range: rampList.ag_GrnYl[5].reverse()
          range: _.clone(rampList.ag_GrnYl[5])
        }
      }
    };
  }

}, SimpleStyleDefaults);

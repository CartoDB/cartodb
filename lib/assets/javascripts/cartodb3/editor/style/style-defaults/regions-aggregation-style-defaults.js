var _ = require('underscore');
var SimpleStyleDefaults = require('./simple-style-defaults');
var rampList = require('cartocolor');

module.exports = _.defaults({
  _getAggrAttrs: function (geometryType) {
    return {
      aggregation: {
        dataset: 'countries',
        change: 'manual',
        value: {
          operator: 'count',
          attribute: ''
        }
      }
    };
  },

  _getFillAttrs: function (geometryType) {
    return {
      fill: {
        'color': {
          attribute: 'agg_value_density',
          bins: '5',
          quantification: 'quantiles',
          range: _.clone(rampList.Emrld[5])
        }
      }
    };
  }

}, SimpleStyleDefaults);

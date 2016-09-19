var _ = require('underscore');
var HexabinsAggregationDefaults = require('./hexabins-aggregation-style-defaults');

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
  }

}, HexabinsAggregationDefaults);

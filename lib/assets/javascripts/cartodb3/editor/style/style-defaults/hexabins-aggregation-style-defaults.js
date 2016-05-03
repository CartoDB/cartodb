var _ = require('underscore');
var StyleDefaults = require('./style-defaults');

module.exports = _.defaults({

  DEFAULT_FILL_COLOR: '#3B3B58',
  DEFAULT_STROKE_COLOR: '#3B3B58',

  _getAggrAttrs: function (geometryType) {
    return {
      aggr_size: {
        size: {
          fixed: 100
        },
        distance: {
          fixed: 'meters'
        }
      },
      aggr_value: {
        operation: 'COUNT',
        column: ''
      }
    };
  }

}, StyleDefaults);

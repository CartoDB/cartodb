var _ = require('underscore');
var StyleDefaults = require('./style-defaults');

module.exports = _.defaults({

  DEFAULT_FILL_COLOR: '#ECCA8B',
  DEFAULT_STROKE_COLOR: '#9A8F7B',

  _getAggrAttrs: function (geometryType) {
    return {
      aggr_dataset: '',
      aggr_change: 'manual',
      aggr_value: {
        operation: 'COUNT',
        attribute: ''
      }
    };
  }

}, StyleDefaults);

var _ = require('underscore');
var SimpleStyleDefaults = require('./simple-style-defaults');

module.exports = _.defaults({

  DEFAULT_FILL_COLOR: '#ECCA8B',
  DEFAULT_STROKE_COLOR: '#9A8F7B',

  _getAggrAttrs: function (geometryType) {
    return {
      aggregation: {
        dataset: '',
        change: 'manual',
        value: {
          operator: 'count',
          attribute: ''
        }
      }
    };
  }

}, SimpleStyleDefaults);

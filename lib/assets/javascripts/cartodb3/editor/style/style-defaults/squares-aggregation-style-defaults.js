var _ = require('underscore');
var SimpleStyleDefaults = require('./simple-style-defaults');

module.exports = _.defaults({

  DEFAULT_FILL_COLOR: '#C43C24',
  DEFAULT_STROKE_COLOR: '#C43C24',

  _getAggrAttrs: function (geometryType) {
    return {
      aggregation: {
        size: 100,
        value: {
          operator: 'count',
          attribute: ''
        }
      }
    };
  }

}, SimpleStyleDefaults);

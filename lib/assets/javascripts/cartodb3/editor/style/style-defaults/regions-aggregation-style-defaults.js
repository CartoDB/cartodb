var _ = require('underscore');
var SimpleStyleDefaults = require('./simple-style-defaults');

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
  }

}, SimpleStyleDefaults);

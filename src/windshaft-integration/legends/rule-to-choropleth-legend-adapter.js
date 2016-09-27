var _ = require('underscore');

var VALID_PROPS = ['line-color', 'marker-fill', 'polygon-fill'];
var VALID_MAPPINGS = ['>', '>=', '<', '<='];

module.exports = {
  canAdapt: function (rule) {
    return this._ruleHasValidProperty(rule) &&
      this._ruleHasValidMapping(rule);
  },

  _ruleHasValidProperty: function (rule) {
    return _.contains(VALID_PROPS, rule.prop);
  },

  _ruleHasValidMapping: function (rule) {
    return _.contains(VALID_MAPPINGS, rule.mapping);
  },

  adapt: function (rule) {
    var values = rule.values;
    var colors = _.map(values, function (value, i) {
      var label = '';
      if (i === 0) {
        label = rule.stats.min_val;
      } else if (i === values.length - 1) {
        label = rule.stats.max_val;
      }
      return { value: value, label: label };
    });

    return {
      colors: colors,
      avg: rule.stats.avg_val,
      max: rule.stats.max_val
    };
  }
};

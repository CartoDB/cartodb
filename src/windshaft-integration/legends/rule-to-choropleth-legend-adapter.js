var _ = require('underscore');

module.exports = {
  canAdapt: function (rule) {
    return ['line-color', 'marker-fill', 'polygon-fill'].indexOf(rule.prop) >= 0;
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
      state: 'success'
    };
  }
};

module.exports = {
  canAdapt: function (rule) {
    return rule.prop === 'marker-width';
  },

  adapt: function (rule) {
    var values = [
      rule.stats.min_val
    ].concat(rule.filters)
    .concat(rule.stats.max_val);

    var sizes = rule.values;
    if (rule.mapping === '>') {
      sizes.unshift(rule['default-value']);
    } else {
      sizes.push(rule['default-value']);
    }

    return {
      values: values,
      sizes: sizes,
      avg: rule.stats.avg_val,
      state: 'success'
    };
  }
};

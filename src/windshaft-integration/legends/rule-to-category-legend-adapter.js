module.exports = {
  canAdapt: function (rule) {
    return rule.mapping === '=';
  },

  adapt: function (rule) {
    var categories = rule.filters.map(function (filter, index) {
      return { label: filter, value: rule.values[index] };
    });
    return {
      categories: categories,
      defaultValue: rule['default-value'],
      state: 'success'
    };
  }
};

var _ = require('underscore');

var VALID_PROPS = ['line-color', 'marker-fill', 'polygon-fill'];
var VALID_MAPPINGS = ['='];

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

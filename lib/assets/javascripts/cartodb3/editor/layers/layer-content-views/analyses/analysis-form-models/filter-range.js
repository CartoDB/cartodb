var _ = require('underscore');

module.exports = {
  type: 'filter-range',
  label: "Filter range",
  parametersDataFields: 'kind,value,result',

  parse: function (nodeAttrs) {
    return {
      type: 'filter-range',
      kind: 'top',
      value: 50,
      result: 'show'
    };
  },

  formatAttrs: function (formAttrs) {
    return formAttrs;
  }
};

var _ = require('underscore');

module.exports = {
  type: 'filter-category',
  label: "Filter category",
  parametersDataFields: 'kind,value,result',

  parse: function (nodeAttrs) {
    return {
      type: 'filter-category',
      kind: 'top',
      value: 50,
      result: 'show'
    };
  },

  formatAttrs: function (formAttrs) {
    return formAttrs;
  }
};

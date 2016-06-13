var _ = require('underscore');

module.exports = {
  type: 'filter-range',
  label: 'Filter range',
  parametersDataFields: 'kind,max,result',

  parse: function (nodeAttrs) {
    return {
      type: 'filter-range',
      kind: 'top',
      max: 50,
      result: 'show'
    };
  },

  formatAttrs: function (formAttrs) {
    return formAttrs;
  }
};

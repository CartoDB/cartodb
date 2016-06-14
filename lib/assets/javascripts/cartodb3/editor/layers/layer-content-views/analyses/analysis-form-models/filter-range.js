var _ = require('underscore');

module.exports = {
  type: 'filter-range',
  label: 'Filter range',
  parametersDataFields: 'kind,max',

  parse: function (nodeAttrs) {
    var formAttrs = _.extend({}, nodeAttrs);

    formAttrs.type = 'filter-range';
    formAttrs.kind = nodeAttrs.kind || 'is-equal-to';
    formAttrs.max = nodeAttrs.max || 50;

    return formAttrs;
  },

  formatAttrs: function (formAttrs) {
    return formAttrs;
  }
};

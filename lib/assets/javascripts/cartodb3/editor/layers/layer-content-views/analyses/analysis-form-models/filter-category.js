var _ = require('underscore');

module.exports = {
  type: 'filter-category',
  label: 'Filter category',
  parametersDataFields: 'kind,text',

  parse: function (nodeAttrs) {
    var formAttrs = _.extend({}, nodeAttrs);

    formAttrs.type = 'filter-category';
    formAttrs.kind = nodeAttrs.kind || 'is-equal-to';
    formAttrs.text = nodeAttrs.text || 'test1';

    return formAttrs;
  },

  formatAttrs: function (formAttrs) {
    return formAttrs;
  }
};

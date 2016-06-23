var _ = require('underscore');

var PARAMS_FOR_IS_EQUAL = 'text,kind';

module.exports = {
  type: 'filter-category',
  label: 'Filter category',
  parametersDataFields: 'text,accept_reject',
  filterDataFields: 'accept,reject',

  parse: function (nodeAttrs) {
    var formAttrs = _.extend({}, nodeAttrs);

    formAttrs.type = 'filter-category';
    formAttrs.column = nodeAttrs.column || '';

    if (nodeAttrs.accept) {
      formAttrs.text = nodeAttrs.accept.join(',');
    } else if (nodeAttrs.reject) {
      formAttrs.text = nodeAttrs.reject.join(',');
    }

    formAttrs.accept_reject = (nodeAttrs.accept || !(nodeAttrs.accept || nodeAttrs.reject)) ? 'accept' : 'reject';

    return formAttrs;
  },

  formatAttrs: function (formAttrs) {
    var isFromIsEqualToKind = formAttrs.kind === 'is-equal-to';
    var text = [];

    if (isFromIsEqualToKind) {
      text = [+formAttrs.text];
    } else if (formAttrs.text) {
      text = formAttrs.text.split(',');
    }

    if (formAttrs.accept_reject === 'accept' || isFromIsEqualToKind) {
      formAttrs.accept = text;
      return _.pick(formAttrs, ['id', 'type', 'source', 'column', 'accept']);
    } else if (formAttrs.accept_reject === 'reject') {
      formAttrs.reject = text;
      return _.pick(formAttrs, ['id', 'type', 'source', 'column', 'reject']);
    }
  },

  getParameters: function (kind) {
    var params = this.parametersDataFields;

    if (kind === 'is-equal-to') {
      params = PARAMS_FOR_IS_EQUAL;
    }

    return params;
  }
};

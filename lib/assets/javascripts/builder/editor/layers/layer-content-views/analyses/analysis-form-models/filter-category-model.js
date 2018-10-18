var _ = require('underscore');

var PARAMS_FOR_IS_EQUAL = 'kind,text';

module.exports = {
  type: 'filter-category',
  label: 'Filter category',
  parametersDataFields: 'text,accept_reject',
  filterDataFields: 'accept,reject',

  parse: function (nodeAttrs) {
    var formAttrs = _.extend({}, nodeAttrs);
    var kind = nodeAttrs.kind;
    var text;

    formAttrs.type = 'filter-category';
    formAttrs.column = nodeAttrs.column || '';

    if (nodeAttrs.accept) {
      text = nodeAttrs.accept.join(',');
    } else if (nodeAttrs.reject) {
      text = nodeAttrs.reject.join(',');
    }

    if (this._isFromBooleanKind(kind)) {
      text = text === 'null' ? null : text === 'true';
    }

    formAttrs.text = text;

    formAttrs.accept_reject = (nodeAttrs.accept || !(nodeAttrs.accept || nodeAttrs.reject)) ? 'accept' : 'reject';

    return formAttrs;
  },

  formatAttrs: function (formAttrs) {
    var attrs = ['id', 'type', 'source', 'column'];
    var kind = formAttrs.kind;
    var isFromIsEqualToKind = this._isFromIsEqualToKind(kind);
    var isFromBooleanKind = this._isFromBooleanKind(kind);
    var text;

    if (isFromIsEqualToKind) {
      text = [+formAttrs.text];
    } else if (isFromBooleanKind) {
      text = [formAttrs.text];
    } else if (formAttrs.text) {
      text = formAttrs.text.split(',');
    }

    if (formAttrs.accept_reject === 'accept' || isFromIsEqualToKind) {
      formAttrs.accept = text;
    } else if (formAttrs.accept_reject === 'reject') {
      formAttrs.reject = text;
    }

    if (isFromIsEqualToKind || isFromBooleanKind) {
      return _.pick(formAttrs, attrs.concat(['kind', formAttrs.accept_reject]));
    } else {
      return _.pick(formAttrs, attrs.concat(formAttrs.accept_reject));
    }
  },

  _isFromBooleanKind: function (kind) {
    return kind === 'is-boolean';
  },

  _isFromIsEqualToKind: function (kind) {
    return kind === 'is-equal-to';
  },

  getParameters: function (kind) {
    var params = this.parametersDataFields;

    if (kind === 'is-equal-to') {
      params = PARAMS_FOR_IS_EQUAL;
    }

    return params;
  }
};

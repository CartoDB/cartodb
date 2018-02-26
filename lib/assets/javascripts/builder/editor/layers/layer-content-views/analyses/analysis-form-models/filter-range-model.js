var _ = require('underscore');

var PARAMETERS_FOR_KIND = {
  'between': 'kind,greater_than_or_equal,less_than_or_equal',
  'is-equal-to': 'kind,text',
  'is-less-than': 'kind,less_than',
  'is-less-or-equal-than': 'kind,less_than_or_equal',
  'is-greater-than': 'kind,greater_than',
  'is-greater-or-equal-than': 'kind,greater_than_or_equal'
};

var DEFAULT_PARAMETERS = PARAMETERS_FOR_KIND['between'];

module.exports = {
  type: 'filter-range',
  label: 'Filter range', // TODO: localize?

  parse: function (nodeAttrs) {
    var formAttrs = _.extend({}, nodeAttrs);

    formAttrs.type = 'filter-range';
    formAttrs.kind = nodeAttrs.kind || 'between';
    formAttrs.column = nodeAttrs.column || '';
    formAttrs.greater_than_or_equal = nodeAttrs.greater_than_or_equal != null ? nodeAttrs.greater_than_or_equal : 0;
    formAttrs.less_than_or_equal = nodeAttrs.less_than_or_equal != null ? nodeAttrs.less_than_or_equal : 50;
    formAttrs.greater_than = nodeAttrs.greater_than != null ? nodeAttrs.greater_than : 0;
    formAttrs.less_than = nodeAttrs.less_than != null ? nodeAttrs.less_than : 50;

    return formAttrs;
  },

  getParameters: function (kind, column) {
    if (column) {
      kind = this.getKind(kind);
      return PARAMETERS_FOR_KIND[kind];
    }

    return DEFAULT_PARAMETERS;
  },

  formatAttrs: function (formAttrs, column) {
    var kind = this.getKind(formAttrs.kind);

    var attrs = ['id', 'type', 'source', 'column'];
    var parameters = this.getParameters(kind, column);
    if (parameters !== '') {
      attrs = attrs.concat(parameters.split(','));
    }

    return _.pick(formAttrs, attrs);
  },

  getKind: function (kind) {
    if (!kind || !_.contains(_.keys(PARAMETERS_FOR_KIND), kind)) {
      kind = 'between';
    }

    return kind;
  }
};

var _ = require('underscore');

var PARAMETERS_FOR_KIND = {
  'between': 'kind,min,max',
  'is-equal-to': 'kind,text',
  'is-less-than': 'kind,max',
  'is-less-or-equal-than': 'kind,max_or_equal',
  'is-greater-than': 'kind,min',
  'is-greater-or-equal-than': 'kind,min_or_equal'
};

module.exports = {
  type: 'filter-range',
  label: 'Filter range', // TODO: localize?

  parse: function (nodeAttrs) {
    var formAttrs = _.extend({}, nodeAttrs);

    formAttrs.type = 'filter-range';
    formAttrs.kind = nodeAttrs.kind || 'between';
    formAttrs.column = nodeAttrs.column || '';
    formAttrs.min_or_equal = nodeAttrs.min_or_equal != null ? nodeAttrs.min_or_equal : 0;
    formAttrs.max_or_equal = nodeAttrs.max_or_equal != null ? nodeAttrs.max_or_equal : 50;
    formAttrs.min = nodeAttrs.min != null ? nodeAttrs.min : 0;
    formAttrs.max = nodeAttrs.max != null ? nodeAttrs.max : 50;

    return formAttrs;
  },

  getParameters: function (kind, column) {
    if (column) {
      kind = this.getKind(kind);
      return PARAMETERS_FOR_KIND[kind];
    }

    return '';
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

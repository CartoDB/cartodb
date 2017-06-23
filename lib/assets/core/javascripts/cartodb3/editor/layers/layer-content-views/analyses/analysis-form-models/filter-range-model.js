var _ = require('underscore');

var PARAMETERS_FOR_KIND = {
  'between': 'kind,min,max',
  'is-equal-to': 'kind,text',
  'is-less-than': 'kind,max',
  'is-greater-than': 'kind,min'
};

module.exports = {
  type: 'filter-range',
  label: 'Filter range', // TODO: localize?

  parse: function (nodeAttrs) {
    var formAttrs = _.extend({}, nodeAttrs);

    formAttrs.type = 'filter-range';
    formAttrs.kind = nodeAttrs.kind || 'between';
    formAttrs.column = nodeAttrs.column || '';
    formAttrs.min = nodeAttrs.min != null ? nodeAttrs.min : 0;
    formAttrs.max = nodeAttrs.max != null ? nodeAttrs.max : 50;

    return formAttrs;
  },

  getParameters: function (kind) {
    kind = this.getKind(kind);

    return PARAMETERS_FOR_KIND[kind];
  },

  formatAttrs: function (formAttrs) {
    var kind = this.getKind(formAttrs.kind);

    var attrs = this.getParameters(kind);

    return _.pick(formAttrs, ['id', 'type', 'source', 'column'].concat(attrs.split(',')));
  },

  getKind: function (kind) {
    if (!kind || !_.contains(_.keys(PARAMETERS_FOR_KIND), kind)) {
      kind = 'between';
    }

    return kind;
  }
};

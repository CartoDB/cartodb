var _ = require('underscore');
var AnalysisDefinitionModel = require('./analysis-definition-model');

var OWN_ATTRS_NAMES = ['id', 'type'];

/**
 * Analysis definition of a dataset source (i.e. SQL table), possibly with a custom query applied to it.
 */
module.exports = AnalysisDefinitionModel.extend({

  defaults: {
    type: 'source',
    table_name: ''
  },

  parse: function (r) {
    // Flatten attributes
    return _.defaults(
      _.pick(r, OWN_ATTRS_NAMES),
      r.params
    );
  },

  toJSON: function () {
    return _.defaults(
      {
        params: {
          query: this.get('query') || 'SELECT * FROM ' + this.get('table_name')
        }
      },
      _.pick(this.attributes, OWN_ATTRS_NAMES)
    );
  }

});
